import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import {queryLocalDatabase,disconnectLocalDatabase} from '../../src/infrastructure/database/local-sql-server.js';
import {createCertificationsRepository} from '../../src/modules/certifications/repositories/certifications.repository.js';
import {createCertificationsService} from '../../src/modules/certifications/services/certifications.service.js';

const actor={role:'student',source:'auth',reference:'compact-test',studentCode:'102230001',cohortYear:2023};
const reviewer={role:'reviewer',source:'auth',reference:'reviewer',name:'Reviewer'};
const fields=[{key:'overall',label:'Overall',type:'number',required:true,min:0,max:9,step:0.5}];
const input={fullName:'SQL student',className:'23T1',certificateTypeId:1,issuedOn:'2026-01-01',result:{overall:5}};

test('compact SQL migrates latest records and supports catalog, supplementation, review and retry',
  {skip:process.env.CERT_DB_TEST!=='1'},async()=>{
  const schema='cert_test_'+randomUUID().replaceAll('-','');
  const query=(sql,params=[])=>queryLocalDatabase(sql.replaceAll('certification.',schema+'.'),params);
  const repo=createCertificationsRepository({query,databaseName:'Studentpage',databaseHost:'localhost'});
  const snapshot={type:{id:1,code:'IELTS',displayName:'IELTS',formSchema:{fields},revision:1},language:{id:1},policies:[]};
  const legacyId=randomUUID(),oldSubmission=randomUUID(),pendingSubmission=randomUUID(),verifiedId=randomUUID(),verifiedSubmission=randomUUID();
  try {
    await queryLocalDatabase(`CREATE SCHEMA ${schema};`);
    await query(`CREATE TABLE certification.Languages(Id int IDENTITY PRIMARY KEY,Code nvarchar(10),DisplayName nvarchar(100),
      IsPublished bit,IsSchoolProvided bit DEFAULT 0,Revision int DEFAULT 1,CreatedAt datetime2 DEFAULT SYSUTCDATETIME(),UpdatedAt datetime2 DEFAULT SYSUTCDATETIME(),RowVersion rowversion);
      CREATE TABLE certification.CertificateTypes(Id int IDENTITY PRIMARY KEY,LanguageId int,Code nvarchar(50),DisplayName nvarchar(200),
      FormSchemaJson nvarchar(max),IsPublished bit,IsSchoolProvided bit DEFAULT 0,BaseCertificateTypeId int NULL,
      Revision int DEFAULT 1,CreatedAt datetime2 DEFAULT SYSUTCDATETIME(),UpdatedAt datetime2 DEFAULT SYSUTCDATETIME(),RowVersion rowversion);
      CREATE TABLE certification.CertificateLevels(Id int IDENTITY PRIMARY KEY,CertificateTypeId int,Code nvarchar(50),DisplayName nvarchar(100),Weight float,SortOrder int);
      CREATE TABLE certification.RecognitionPolicies(Id int IDENTITY PRIMARY KEY,LanguageId int NULL,CertificateTypeId int NULL,
      CohortFrom smallint,CohortTo smallint NULL,IsRecognized bit,Reason nvarchar(2000),DocumentReference nvarchar(255),
      Revision int DEFAULT 1,CreatedAt datetime2 DEFAULT SYSUTCDATETIME(),UpdatedAt datetime2 DEFAULT SYSUTCDATETIME(),RowVersion rowversion);
      INSERT certification.Languages(Code,DisplayName,IsPublished) VALUES('LN001','English',1);
      INSERT certification.CertificateTypes(LanguageId,Code,DisplayName,FormSchemaJson,IsPublished) VALUES(1,'IELTS','IELTS',?,1),(1,'TOEIC_FOUR','TOEIC 4',?,1),(1,'VSTEP','VSTEP',?,1);
      INSERT certification.CertificateLevels(CertificateTypeId,Code,DisplayName,Weight,SortOrder) VALUES(3,'VSTEP3','VSTEP B1',3,1),(3,'VSTEP4','VSTEP B2',4,2);
      INSERT certification.RecognitionPolicies(LanguageId,CohortFrom,IsRecognized) VALUES(1,1900,1);`,
      [JSON.stringify({fields}),JSON.stringify({fields:['listening','reading','speaking','writing'].map(key=>({key,label:key,type:'number',required:true,min:0,max:key==='listening'||key==='reading'?495:200,step:1}))}),
        JSON.stringify({fields:[{key:'level',label:'Level',type:'select',required:true,optionsFrom:'certificateLevels'}]})]);
    const beforeCatalog=await repo.catalog();
    // Fixture includes a historical submitted version followed by a newer pending edit.
    await query(`CREATE TABLE certification.Applications(Id uniqueidentifier PRIMARY KEY,ActorReference nvarchar(128),ActorSource varchar(20),StudentCode varchar(9),
      CohortYear smallint,Status varchar(20),CurrentSubmissionId uniqueidentifier NULL,CreatedAt datetime2,UpdatedAt datetime2);
      CREATE TABLE certification.Submissions(Id uniqueidentifier PRIMARY KEY,ApplicationId uniqueidentifier REFERENCES certification.Applications(Id),
      Sequence int,CertificateTypeId int,FullName nvarchar(150),ClassName nvarchar(50),ResultJson nvarchar(max),CatalogSnapshotJson nvarchar(max),IssuedOn date,
      Notes nvarchar(2000),Status varchar(20),ExpiresAt datetime2,ClaimToken uniqueidentifier NULL,SubmittedAt datetime2 NULL,CreatedAt datetime2,UpdatedAt datetime2);
      ALTER TABLE certification.Applications ADD CONSTRAINT FK_Current_${schema} FOREIGN KEY(CurrentSubmissionId) REFERENCES certification.Submissions(Id);
      CREATE TABLE certification.EvidenceFiles(Id uniqueidentifier PRIMARY KEY,SubmissionId uniqueidentifier REFERENCES certification.Submissions(Id),Purpose varchar(32),
      OriginalFileName nvarchar(255),DeclaredContentType varchar(100),DeclaredSizeBytes bigint,Bucket varchar(63),TemporaryObjectKey varchar(512),ObjectKey varchar(512),
      Status varchar(20),InspectionJson nvarchar(max),CreatedAt datetime2,CompletedAt datetime2 NULL);
      CREATE TABLE certification.Reviews(SubmissionId uniqueidentifier REFERENCES certification.Submissions(Id),ReviewerReference nvarchar(128),ReviewerName nvarchar(150),
      ActorSource varchar(20),Decision varchar(20),Reason nvarchar(2000),VerificationMethod varchar(32),ReviewedAt datetime2);
      INSERT certification.Applications VALUES(?,?,'auth','102230001',2023,'needs_changes',NULL,'2026-01-01','2026-01-03'),
        (?,?,'auth','102230001',2023,'verified',NULL,'2026-01-01','2026-01-03');`,[legacyId,actor.reference,verifiedId,actor.reference]);
    for(const [id,appId,seq,status,result]of [[oldSubmission,legacyId,1,'submitted',4.5],[pendingSubmission,legacyId,2,'uploading',5],[verifiedSubmission,verifiedId,1,'submitted',6]]){
      await query(`INSERT certification.Submissions VALUES(?,?,?,?,N'Student',N'23T1',?,?,'2026-01-01',NULL,?,DATEADD(hour,1,SYSUTCDATETIME()),NULL,
        CASE WHEN ?='submitted' THEN CONVERT(datetime2,'2026-01-02') END,'2026-01-01','2026-01-03');
        INSERT certification.EvidenceFiles VALUES(NEWID(),?,'general','file.png','image/png',4,'test','unused',?,
          CASE WHEN ?='submitted' THEN 'completed' ELSE 'pending' END,
          CASE WHEN ?='submitted' THEN N'{"status":"needs_review"}' END,'2026-01-01',
          CASE WHEN ?='submitted' THEN CONVERT(datetime2,'2026-01-02') END);`,
      [id,appId,seq,1,JSON.stringify({overall:result}),JSON.stringify(snapshot),status,status,id,'certifications/evidence/'+id,status,status,status]);
    }
    await query(`UPDATE certification.Applications SET CurrentSubmissionId=? WHERE Id=?;
      UPDATE certification.Applications SET CurrentSubmissionId=? WHERE Id=?;
      INSERT certification.Reviews VALUES(?,'reviewer','Legacy reviewer','auth','needs_changes','New image','other','2026-01-03'),
        (?,'reviewer','Legacy reviewer','auth','verified',NULL,'issuer_lookup','2026-01-03');`,
      [oldSubmission,legacyId,verifiedSubmission,verifiedId,oldSubmission,verifiedSubmission]);
    const ddl=await readFile('docs/sql/certifications-compact.sql','utf8');
    await query(ddl);await query(ddl);
    // Upgrade a pre-existing non-unique file index without changing its records.
    await query('DROP INDEX UX_CertFiles_Certificate ON certification.EvidenceFiles; CREATE INDEX IX_CertFiles_Certificate ON certification.EvidenceFiles(CertificateId);');
    const singleFileDdl=await readFile('docs/sql/certifications-single-evidence.sql','utf8');
    await query(singleFileDdl);await query(singleFileDdl);
    assert.deepEqual(await repo.catalog(),beforeCatalog);
    const tables=(await queryLocalDatabase('SELECT name FROM sys.tables WHERE schema_id=SCHEMA_ID(?)',[schema])).first.map(t=>t.name).sort();
    assert.deepEqual(tables,['CertificateLevels','CertificateTypes','EvidenceFiles','Languages','RecognitionPolicies','StudentCertificates']);
    const pending=await repo.get(legacyId);assert.equal(pending.Status,'uploading');assert.deepEqual(pending.Result,{overall:5});assert.equal(pending.Files.length,1);
    assert.equal(pending.ReviewedAt,undefined);assert.equal(pending.CreatedAt,'2026-01-01T00:00:00');
    const migrated=await repo.get(verifiedId);assert.equal(migrated.Status,'verified');assert.equal(migrated.ReviewerName,'Legacy reviewer');
    assert.deepEqual(migrated.Result,{overall:6});assert.match(migrated.Files[0].ObjectKey,new RegExp(verifiedSubmission,'i'));
    const objects=new Map();
    const storage={bucket:'test',async presignUpload(key,type){return{url:key,method:'PUT',headers:{'Content-Type':type}};},
      async head(key){return{sizeBytes:objects.get(key)?.length??0};},async read(key){return objects.get(key);},
      async remove(key){objects.delete(key);},async download(key){return key;}};
    const config={maxFiles:4,maxFileBytes:1024,uploadTtlSeconds:600,downloadTtlSeconds:60};
    const inspectImage=async()=>({status:'needs_review',reasons:[]});
    const service=createCertificationsService({repository:repo,storage,config,inspectImage});
    const prepare=async(applicationId,data=input)=>{
      const prepared=await service.prepare(actor,{applicationId,data,files:[{purpose:'general',fileName:'image.png',contentType:'image/png',sizeBytes:4}]});
      for(const upload of prepared.uploads)objects.set(upload.url,Buffer.from('test'));
      return prepared;
    };
    const catalog=await service.catalog(actor);
    assert.equal(catalog.maxFiles,1);
    for(const files of [[],[{fileName:'one.png'},{fileName:'two.png'}]])
      await assert.rejects(service.prepare(actor,{data:input,files}),e=>e.statusCode===400);
    assert.deepEqual(catalog.languages[0].types.find(t=>t.code==='VSTEP').formSchema.fields[0].options,[{value:'VSTEP3',label:'VSTEP B1'},{value:'VSTEP4',label:'VSTEP B2'}]);
    const prepared=await prepare();let app=await service.complete(actor,prepared.applicationId);
    assert.equal(app.status,'submitted');assert.equal(app.files.length,1);assert.deepEqual(app.result,input.result);
    await assert.rejects(query(`INSERT certification.EvidenceFiles(Id,CertificateId,Purpose,OriginalFileName,
      DeclaredContentType,DeclaredSizeBytes,Bucket,ObjectKey) SELECT NEWID(),CertificateId,Purpose,OriginalFileName,
      DeclaredContentType,DeclaredSizeBytes,Bucket,ObjectKey+'duplicate' FROM certification.EvidenceFiles WHERE Id=?`,[app.files[0].id]),/UX_CertFiles_Certificate|duplicate key/i);
    assert.equal(app.submissions,undefined);assert.deepEqual(await service.complete(actor,app.id),app);
    await assert.rejects(service.get({...actor,reference:'other'},app.id),e=>e.statusCode===403);
    const fileId=app.files[0].id;
    const oldObjectKey=(await repo.get(app.id)).Files[0].ObjectKey;
    const originalCreated=app.createdAt;
    app=await service.review(reviewer,app.id,app.rowVersion,{decision:'needs_changes',reason:'New image',verificationMethod:'other'});
    assert.equal(app.review.reason,'New image');
    await prepare(app.id,{...input,result:{overall:6}});
    assert.equal(objects.has(oldObjectKey),false);
    let draft=await service.get(actor,app.id);assert.equal(draft.status,'uploading');assert.equal(draft.review,null);
    assert.equal(draft.createdAt,originalCreated);assert.equal(draft.result.overall,6);
    await assert.rejects(service.download(actor,app.id,fileId),e=>e.statusCode===404);
    app=await service.complete(actor,app.id);
    const decisions=await Promise.allSettled([service.review(reviewer,app.id,app.rowVersion,{decision:'verified',verificationMethod:'other'}),
      service.review(reviewer,app.id,app.rowVersion,{decision:'rejected',reason:'Other',verificationMethod:'other'})]);
    assert.equal(decisions.filter(d=>d.status==='fulfilled').length,1);
    assert.equal(decisions.find(d=>d.status==='rejected').reason.statusCode,409);
    await assert.rejects(prepare(app.id),e=>e.statusCode===409);
    const nativeCount=(await query('SELECT COUNT(*) AS n FROM certification.StudentCertificates WHERE Id=?',[app.id])).first[0].n;
    assert.equal(nativeCount,1);
    const scores={listening:300,reading:350,speaking:150,writing:160};
    const toeic=await prepare(null,{...input,certificateTypeId:2,result:scores});
    assert.deepEqual((await service.complete(actor,toeic.applicationId)).result,scores);
    const level=await prepare(null,{...input,certificateTypeId:3,result:{level:'VSTEP3'}});
    assert.deepEqual((await service.complete(actor,level.applicationId)).result,{level:'VSTEP3'});
    const retry=await prepare();
    const failing=createCertificationsService({repository:{...repo,async finishSubmission(){throw new Error('Lost DB response');}},storage,config,inspectImage});
    await assert.rejects(failing.complete(actor,retry.applicationId),/Lost DB response/);
    assert.equal((await service.complete(actor,retry.applicationId)).status,'submitted');
    const expired=await prepare();
    await query("UPDATE certification.StudentCertificates SET ExpiresAt=DATEADD(second,-1,SYSUTCDATETIME()) WHERE Id=?",[expired.applicationId]);
    await assert.rejects(service.complete(actor,expired.applicationId),e=>e.statusCode===410);
    await prepare(expired.applicationId);assert.equal((await service.complete(actor,expired.applicationId)).status,'submitted');
    const claims=await prepare();const row=await repo.get(claims.applicationId);
    const ref={actor,applicationId:row.Id,expected:row.VersionToken,claimToken:randomUUID()};
    const race=await Promise.allSettled([repo.claimSubmission(ref),repo.claimSubmission({...ref,claimToken:randomUUID()})]);
    assert.equal(race.filter(r=>r.status==='fulfilled').length,1);assert.equal(race.find(r=>r.status==='rejected').reason.statusCode,409);
    const won=race.find(r=>r.status==='fulfilled').value;
    await repo.releaseSubmission({...ref,claimToken:won.ClaimToken});
    assert.equal((await repo.get(row.Id)).Status,'uploading');
    assert.equal((await service.list({...actor,reference:'other'},{page:1,pageSize:20})).totalRecords,0);
  } finally {
    // Only the checked, randomly named test schema is removed.
    const constraints=(await queryLocalDatabase(`SELECT OBJECT_NAME(parent_object_id) AS parent,name FROM sys.foreign_keys
      WHERE SCHEMA_NAME(schema_id)=?`,[schema])).first;
    for(const fk of constraints)await queryLocalDatabase(`ALTER TABLE [${schema}].[${fk.parent}] DROP CONSTRAINT [${fk.name}];`);
    const tables=(await queryLocalDatabase('SELECT name FROM sys.tables WHERE schema_id=SCHEMA_ID(?)',[schema])).first;
    for(const table of tables)await queryLocalDatabase(`DROP TABLE [${schema}].[${table.name}];`);
    await queryLocalDatabase(`DROP SCHEMA ${schema};`);await disconnectLocalDatabase();
  }
});
