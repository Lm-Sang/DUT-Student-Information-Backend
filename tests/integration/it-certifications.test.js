import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import express from 'express';
import {createItCertificationsRepository} from '../../src/modules/certifications/repositories/it-certifications.repository.js';
import {createItCertificationsService} from '../../src/modules/certifications/services/it-certifications.service.js';
import {validateItData} from '../../src/modules/certifications/dto/it-certifications.request.dto.js';
import {queryLocalDatabase,disconnectLocalDatabase} from '../../src/infrastructure/database/local-sql-server.js';
import {createItCertificationsController} from '../../src/modules/certifications/controllers/it-certifications.controller.js';
import {createItCertificationsRouter} from '../../src/modules/certifications/routes/it-certifications.routes.js';
import {errorHandler} from '../../src/shared/middlewares/error-handler.middleware.js';

const actor={role:'student',source:'auth',reference:'it-test',studentCode:'102240377'};
const data={MaHS:actor.studentCode,MaCC:'CNTT01',SoHieu:'SH-001',SoVaoSo:'VS-001',
  SoNgayQD:'QD-001',GhiChu:'Chứng chỉ thử',CoSoCapCC:'Trường Đại học Bách khoa',NgayCC:'2026-10-01',MaHS_SoVaoSo:null};

test('IT input uses original columns and requires issuing institution',()=>{
  assert.deepEqual(validateItData(data),data);
  for(const change of [{CoSoCapCC:''},{CoSoCapCC:null},{CoSoCapCC:'x'.repeat(251)},
    {SoHieu:'x'.repeat(21)},{SoVaoSo:'x'.repeat(31)},{NgayCC:'2026-02-30'},
    {MaCC:'x'.repeat(11)},{fullName:'Tên tự thêm'},{theoryScore:10}]) {
    assert.throws(()=>validateItData({...data,...change}),error=>error.statusCode===400);
  }
  assert.equal(validateItData({MaHS:actor.studentCode,MaCC:'CNTT01',CoSoCapCC:'Cơ sở cấp'}).NgayCC,null);
});

test('IT form reads source catalog and rejects an unknown certificate before signing uploads',async()=>{
  let signed=0;
  const catalog=[{ID:1,MaCC:'CNTT01',TenCC:'Chứng chỉ CNTT cơ bản'}];
  const service=createItCertificationsService({repository:{catalog:async()=>catalog},
    storage:{bucket:'test',async presignUpload(){signed++;}},config:{maxFiles:4}});
  const form=await service.form(actor);
  assert.deepEqual(form.catalog,catalog);
  assert.deepEqual(form.fields.map(field=>field.key),['SoHieu','CoSoCapCC','SoVaoSo','MaCC','NgayCC']);
  assert.equal(form.fields.find(f=>f.key==='CoSoCapCC').required,true);
  assert.equal(form.fields.some(f=>f.key==='theoryScore'),false);
  await assert.rejects(service.prepare(actor,{data:{...data,MaCC:'UNKNOWN'},files:[]}),e=>e.statusCode===400);
  await assert.rejects(service.prepare(actor,{data:{...data,MaHS:'102240378'},files:[]}),e=>e.statusCode===403);
  assert.equal(signed,0);
});

test('IT HTTP accepts original column names, requires issuer and exposes imported records',async()=>{
  const rows=[{ID:700,...data,CoSoCapCC:null}];
  let prepared;
  const repo={catalog:async()=>[{ID:1,MaCC:'CNTT01',TenCC:'CNTT'}],
    async records(input){assert.equal(input.actor.studentCode,actor.studentCode);return{totalRecords:1,items:rows};},
    async prepareSubmission(input){prepared=input;}};
  const config={maxFiles:4,maxFileBytes:1024,uploadTtlSeconds:600};
  const service=createItCertificationsService({repository:repo,config,
    storage:{bucket:'test',async presignUpload(){return{url:'https://example.test/upload',method:'PUT',headers:{}};}}});
  const app=express();app.use(express.json());
  app.use('/api/it-certifications',createItCertificationsRouter(createItCertificationsController(service,config),
    ()=> (req,res,next)=>{req.certificationActor=actor;next();}));
  app.use(errorHandler);
  const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
  const base='http://127.0.0.1:'+server.address().port+'/api/it-certifications';
  try {
    const form=await (await fetch(base+'/form')).json();
    assert.equal(form.data.catalog[0].MaCC,'CNTT01');
    const formData={SoHieu:data.SoHieu,CoSoCapCC:data.CoSoCapCC,SoVaoSo:data.SoVaoSo,MaCC:data.MaCC,NgayCC:data.NgayCC};
    const payload={data:formData,files:[{fileName:'it.png',contentType:'image/png',sizeBytes:4}]};
    const post=body=>fetch(base+'/applications',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const missing=await post({...payload,data:{...data,CoSoCapCC:null}});
    assert.equal(missing.status,400);assert.equal((await missing.json()).details.field,'CoSoCapCC');
    assert.equal(prepared,undefined);
    const accepted=await post(payload);assert.equal(accepted.status,201);
    assert.deepEqual(prepared.data,{...data,SoNgayQD:null,GhiChu:null});
    const spoofed=await post({...payload,data:{...formData,MaHS:'102240378'}});
    assert.equal(spoofed.status,403);
    const records=await (await fetch(base+'/records?page=1&pageSize=20')).json();
    assert.deepEqual(records.data.items,rows);
    const invalid=await fetch(base+'/records?status=submitted');
    assert.equal(invalid.status,400);
  } finally {await new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));}
});

test('IT SQL keeps source columns in the shared schema and enforces catalog/student/file relationships',
  {skip:process.env.IT_CERT_DB_TEST!=='1'},async()=>{
  const schema='it_test_'+randomUUID().replaceAll('-','');
  const legacySchema=schema+'_old';
  const query=(sql,params=[])=>queryLocalDatabase(sql.replaceAll('dbo.tmCNTTChungChi',legacySchema+'.tmCNTTChungChi').replaceAll('certification',schema),params);
  const repo=createItCertificationsRepository({query,databaseName:'Studentpage',databaseHost:'localhost'});
  let applicationId;
  try {
    await queryLocalDatabase(`CREATE SCHEMA ${schema}`);
    const ddl=await readFile('docs/sql/it-certifications.sql','utf8');
    await query(ddl);await query(ddl);
    const tables=(await queryLocalDatabase('SELECT name FROM sys.tables WHERE schema_id=SCHEMA_ID(?)',[schema])).first;
    assert.deepEqual(tables.map(t=>t.name).sort(),['tmCNTTChungChi','tmCNTTChungChi_File','tmCNTTChungChi_SV']);
    const columns=(await queryLocalDatabase(`SELECT c.name,c.max_length,c.is_nullable,c.is_identity FROM sys.columns c
      WHERE object_id=OBJECT_ID(?) ORDER BY column_id`,[schema+'.tmCNTTChungChi_SV'])).first;
    assert.deepEqual(columns.map(c=>[c.name,c.max_length,Boolean(c.is_nullable),Boolean(c.is_identity)]),[
      ['ID',4,false,false],['MaHS',18,true,false],['MaCC',20,true,false],['SoHieu',40,true,false],
      ['SoVaoSo',60,true,false],['SoNgayQD',500,true,false],['GhiChu',500,true,false],
      ['CoSoCapCC',500,true,false],['NgayCC',3,true,false],['MaHS_SoVaoSo',200,true,false]]);
    await query("INSERT certification.tmCNTTChungChi(MaCC,TenCC) VALUES(N'CNTT01',N'Chứng chỉ CNTT cơ bản');");
    await assert.rejects(query("INSERT certification.tmCNTTChungChi_SV(ID,MaHS,MaCC) VALUES(700,N'102240377',N'LEGACY');"),/FOREIGN KEY/i);
    // Import the original catalog code before its student records. Nullable fields stay nullable.
    await query("INSERT certification.tmCNTTChungChi(MaCC,TenCC) VALUES(N'LEGACY',N'Historical certificate'); INSERT certification.tmCNTTChungChi_SV(ID,MaHS,MaCC) VALUES(700,N'102240377',N'LEGACY');");
    await assert.rejects(query("INSERT certification.tmCNTTChungChi_SV(ID) VALUES(700);"),/PRIMARY KEY|duplicate key/i);
    await assert.rejects(query("INSERT certification.tmCNTTChungChi(MaCC) VALUES(N'CNTT01');"),/UNIQUE|duplicate key/i);
    await assert.rejects(query("DELETE certification.tmCNTTChungChi WHERE MaCC=N'LEGACY';"),/REFERENCE|FOREIGN KEY/i);
    assert.equal((await repo.records({actor,page:1,pageSize:20})).items[0].ID,700);
    assert.equal((await repo.records({actor:{...actor,studentCode:'102240378'},page:1,pageSize:20})).totalRecords,0);
    const objects=new Map();
    const storage={bucket:'test',async presignUpload(key,type){return{url:key,method:'PUT',headers:{'Content-Type':type}};},
      async head(key){return{sizeBytes:objects.get(key)?.length??0};},async read(key){return objects.get(key);},
      async remove(key){objects.delete(key);},async download(key){return key;}};
    const config={maxFiles:4,maxFileBytes:1024,uploadTtlSeconds:600,downloadTtlSeconds:60};
    const service=createItCertificationsService({repository:repo,storage,config,
      inspectImage:async()=>({status:'needs_review',reasons:['DOCUMENT_CONTENT_REVIEW_REQUIRED']})});
    const prepare=async(existing,change={})=>{
      const prepared=await service.prepare(actor,{applicationId:existing,data:{...data,...change},
        files:[{fileName:'it.png',contentType:'image/png',sizeBytes:4},{fileName:'it2.png',contentType:'image/png',sizeBytes:4}]});
      for(const upload of prepared.uploads)objects.set(upload.url,Buffer.from('test'));
      return prepared;
    };
    const prepared=await prepare();applicationId=prepared.applicationId;
    let app=await service.get(actor,applicationId);
    assert.equal(app.pendingSubmission.data.ID,701);
    assert.equal(app.pendingSubmission.data.CoSoCapCC,data.CoSoCapCC);
    await assert.rejects(query('DELETE certification.tmCNTTChungChi_SV WHERE ID=?',[app.pendingSubmission.data.ID]),/REFERENCE|FOREIGN KEY/i);
    await assert.rejects(query(`INSERT certification.tmCNTTChungChi_File(Id,ApplicationId,SubmissionId,CertificateId,Sequence,
      ActorReference,ActorSource,OriginalFileName,DeclaredContentType,DeclaredSizeBytes,Bucket,ObjectKey,ExpiresAt)
      SELECT NEWID(),ApplicationId,SubmissionId,2147483647,Sequence,ActorReference,ActorSource,OriginalFileName,
      DeclaredContentType,DeclaredSizeBytes,Bucket,ObjectKey+'orphan',ExpiresAt FROM certification.tmCNTTChungChi_File
      WHERE Id=?`,[prepared.uploads[0].id]),/FOREIGN KEY/i);
    await assert.rejects(service.get({...actor,reference:'other'},applicationId),e=>e.statusCode===403);
    let current=await service.complete(actor,applicationId);
    assert.equal(current.status,'submitted');
    assert.equal(current.currentSubmission.files.length,2);
    assert.equal(current.currentSubmission.certificateTypeName,'Chứng chỉ CNTT cơ bản');
    assert.deepEqual(current.currentSubmission.data,{ID:701,...data});
    assert.deepEqual(await service.complete(actor,applicationId),current);
    assert.equal((await service.list(actor,{page:1,pageSize:20})).totalRecords,1);
    assert.equal((await service.list(actor,{page:1,pageSize:20})).items[0].certificateTypeName,'Chứng chỉ CNTT cơ bản');
    assert.equal((await service.list({...actor,reference:'other'},{page:1,pageSize:20})).totalRecords,0);
    const reviewer={role:'reviewer',source:'auth',reference:'reviewer',name:'Reviewer'};
    current=await service.review(reviewer,applicationId,current.rowVersion,{decision:'needs_changes',reason:'Bổ sung ảnh',verificationMethod:'other'});
    await prepare(applicationId,{SoHieu:'SH-002'});
    current=await service.complete(actor,applicationId);
    assert.equal(current.submissions.length,2);
    assert.equal(current.submissions[1].data.SoHieu,'SH-001');
    assert.equal(current.currentSubmission.data.SoHieu,'SH-002');
    current=await service.review(reviewer,applicationId,current.rowVersion,{decision:'verified',verificationMethod:'document_comparison'});
    assert.equal(current.status,'verified');
    await assert.rejects(prepare(applicationId),e=>e.statusCode===409);
    // Metadata operations never rewrite imported source rows.
    const imported=(await repo.records({actor,page:1,pageSize:20})).items.find(c=>c.ID===700);
    assert.equal(imported.MaCC,'LEGACY');assert.equal(imported.CoSoCapCC,null);
    // A lost DB response leaves valid uploads available for retry.
    const retry=await prepare();
    const failing=createItCertificationsService({repository:{...repo,async finishSubmission(){throw new Error('DB response lost');}},
      storage,config,inspectImage:async()=>({status:'needs_review',reasons:[]})});
    await assert.rejects(failing.complete(actor,retry.applicationId),/DB response lost/);
    assert.equal((await service.complete(actor,retry.applicationId)).status,'submitted');
  } finally {
    await queryLocalDatabase(`DROP TABLE IF EXISTS ${schema}.tmCNTTChungChi_File;
      DROP TABLE IF EXISTS ${schema}.tmCNTTChungChi_SV;DROP TABLE IF EXISTS ${schema}.tmCNTTChungChi;DROP SCHEMA ${schema};`);
    await disconnectLocalDatabase();
  }
});

test('IT migration transfers legacy tables intact and rolls back invalid relationships',
  {skip:process.env.IT_CERT_DB_TEST!=='1'},async()=>{
  const schema='it_move_'+randomUUID().replaceAll('-',''),legacy=schema+'_old';
  const ddl=await readFile('docs/sql/it-certifications.sql','utf8');
  const migratedDdl=ddl.replaceAll('dbo.tmCNTTChungChi',legacy+'.tmCNTTChungChi').replaceAll('certification',schema);
  const tables=['tmCNTTChungChi','tmCNTTChungChi_SV','tmCNTTChungChi_File'];
  const fileId=randomUUID();
  const readRows=async owner=>{
    const result={};for(const table of tables)result[table]=(await queryLocalDatabase(`SELECT * FROM ${owner}.${table} ORDER BY ID`)).first;
    return result;
  };
  try {
    await queryLocalDatabase(`CREATE SCHEMA ${schema}`);
    await queryLocalDatabase(`CREATE SCHEMA ${legacy}`);
    for(const table of tables){
      const create=ddl.match(new RegExp('CREATE TABLE certification\\.'+table+'\\([\\s\\S]*?\\n \\);'))?.[0];
      assert.ok(create,'Legacy fixture table '+table);
      await queryLocalDatabase(create.replaceAll('certification.',legacy+'.'));
    }
    await queryLocalDatabase(`INSERT ${legacy}.tmCNTTChungChi(MaCC,TenCC) VALUES(N'CNTT01',N'Basic IT certificate');
      INSERT ${legacy}.tmCNTTChungChi_SV(ID,MaHS,MaCC,SoHieu,CoSoCapCC) VALUES(700,N'102240377',N'CNTT01',N'original',N'Issuer'),
        (700,N'102240377',N'CNTT01',N'duplicate',N'Issuer');
      INSERT ${legacy}.tmCNTTChungChi_File(Id,ApplicationId,SubmissionId,CertificateId,Sequence,ActorReference,ActorSource,
        OriginalFileName,DeclaredContentType,DeclaredSizeBytes,Bucket,ObjectKey,ExpiresAt)
      VALUES(?,NEWID(),NEWID(),700,1,N'it-test','auth',N'legacy.png','image/png',4,'test','certifications/evidence/it/legacy',DATEADD(hour,1,SYSUTCDATETIME()));`,[fileId]);
    const beforeDuplicate=await readRows(legacy);
    await assert.rejects(queryLocalDatabase(migratedDdl),/ITCERT_DUPLICATE_ID/);
    assert.deepEqual(await readRows(legacy),beforeDuplicate);
    assert.equal((await queryLocalDatabase('SELECT COUNT(*) AS n FROM sys.tables WHERE schema_id=SCHEMA_ID(?)',[schema])).first[0].n,0);
    await queryLocalDatabase(`DELETE ${legacy}.tmCNTTChungChi_SV WHERE SoHieu=N'duplicate';
      UPDATE ${legacy}.tmCNTTChungChi_SV SET MaCC=N'MISSING';`);
    await assert.rejects(queryLocalDatabase(migratedDdl),/ITCERT_UNKNOWN_CATALOG_CODE/);
    assert.equal((await readRows(legacy)).tmCNTTChungChi_SV[0].MaCC,'MISSING');
    await queryLocalDatabase(`UPDATE ${legacy}.tmCNTTChungChi_SV SET MaCC=N'CNTT01';
      UPDATE ${legacy}.tmCNTTChungChi_File SET CertificateId=777;`);
    await assert.rejects(queryLocalDatabase(migratedDdl),/ITCERT_ORPHAN_FILE/);
    await queryLocalDatabase(`UPDATE ${legacy}.tmCNTTChungChi_File SET CertificateId=700;`);
    const before=await readRows(legacy);
    const objectIds=(await queryLocalDatabase('SELECT object_id FROM sys.tables WHERE schema_id=SCHEMA_ID(?) ORDER BY name',[legacy])).first;
    await queryLocalDatabase(migratedDdl);await queryLocalDatabase(migratedDdl);
    assert.deepEqual(await readRows(schema),before);
    assert.deepEqual((await queryLocalDatabase('SELECT object_id FROM sys.tables WHERE schema_id=SCHEMA_ID(?) ORDER BY name',[schema])).first,objectIds);
    assert.equal((await queryLocalDatabase('SELECT COUNT(*) AS n FROM sys.tables WHERE schema_id=SCHEMA_ID(?)',[legacy])).first[0].n,0);
    const fks=(await queryLocalDatabase(`SELECT name,is_disabled,is_not_trusted FROM sys.foreign_keys WHERE schema_id=SCHEMA_ID(?) ORDER BY name`,[schema])).first;
    assert.deepEqual(fks.map(f=>f.name),['FK_CNTTFile_Student','FK_CNTTStudent_Catalog']);
    assert.ok(fks.every(f=>!f.is_disabled&&!f.is_not_trusted));
    const repo=createItCertificationsRepository({databaseName:'Studentpage',databaseHost:'localhost',
      query:(sql,params=[])=>queryLocalDatabase(sql.replaceAll('certification.',schema+'.'),params)});
    const record=(await repo.records({actor,page:1,pageSize:20})).items[0];
    assert.equal(record.ID,700);assert.equal(record.CoSoCapCC,'Issuer');
  } finally {
    for(const owner of [schema,legacy]){
      await queryLocalDatabase(`DROP TABLE IF EXISTS ${owner}.tmCNTTChungChi_File;
        DROP TABLE IF EXISTS ${owner}.tmCNTTChungChi_SV;DROP TABLE IF EXISTS ${owner}.tmCNTTChungChi;DROP SCHEMA ${owner};`);
    }
    await disconnectLocalDatabase();
  }
});
