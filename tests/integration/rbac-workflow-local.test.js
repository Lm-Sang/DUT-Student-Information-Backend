import assert from 'node:assert/strict';
import {test} from 'node:test';
import {randomUUID,randomInt} from 'node:crypto';
import sharp from 'sharp';
import {createCertificationsService} from '../../src/common/certifications/services/certifications.service.js';
import {createItCertificationsService} from '../../src/common/certifications/services/it-certifications.service.js';
import {createCertificationsRepository} from '../../src/common/certifications/repositories/certifications.repository.js';
import {createItCertificationsRepository} from '../../src/common/certifications/repositories/it-certifications.repository.js';
import {createAcademicLeaveRepository} from '../../src/common/academic-leave/repositories/academic-leave.repository.js';
import {createAcademicLeaveService} from '../../src/common/academic-leave/services/academic-leave.service.js';
import {parsePreparation,parseReview,parseLanguage,parsePolicy,parseIssuer,parseType} from '../../src/common/certifications/dto/certifications.request.dto.js';
import {parseItPreparation} from '../../src/common/certifications/dto/it-certifications.request.dto.js';
import {createDocumentImageInspector} from '../../src/infrastructure/images/document-image.js';
import {certificationConfig as config} from '../../src/config/certifications.js';
import {queryLocalDatabase as query,transactionLocalDatabase as transaction,disconnectLocalDatabase} from '../../src/infrastructure/database/local-sql-server.js';
import {assertLocalDemoTarget,localDatabaseGuardSql} from '../../src/infrastructure/database/local-write-guard.js';
import {renderAcademicLeavePrint} from '../../src/common/academic-leave/mappers/academic-leave-print.mapper.js';
import {pdfRenderer} from '../../src/infrastructure/pdf/chromium-pdf.js';

test('local SQL: certificate upload/supplement/review/catalogs and academic leave lifecycle with isolated fixtures',{
 skip:process.env.RBAC_WORKFLOW_DB_TEST!=='1',timeout:240000,
},async()=>{
 assertLocalDemoTarget();
 const reference='rbac-e2e:'+randomUUID(),studentCode='9'+String(randomInt(10000000,99999999));
 const student={role:'student',source:'auth',reference,studentCode,cohortYear:2023,name:'Sinh viên kiểm thử tích hợp'};
 const another={...student,reference:reference+':other',studentCode:'8'+studentCode.slice(1)};
 const reviewer={role:'reviewer',source:'auth',reference:reference+':reviewer',name:'Chuyên viên fixture',permissions:['certifications:review','certifications:catalog:manage','academic-leave:review']};
 const profile={fullName:student.name,studentCode,className:'TEST_DT',cccd:'000000000001',birthday:'2004-01-01',phoneNumber:'0000000000'};
 const objects=new Map(),keys=new Set(),catalogRows=[];
 const storage={
  bucket:'local-memory-fixtures',presignUpload:async key=>{keys.add(key);return {url:'https://fixture.invalid/'+key,method:'PUT',headers:{}};},
  head:async key=>({sizeBytes:objects.get(key)?.length,contentType:'image/png'}),read:async key=>objects.get(key),
  remove:async key=>objects.delete(key),download:async key=>'https://fixture.invalid/'+key,
 };
 const bytes=await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="700"><rect width="1000" height="700" fill="white"/>${Array.from({length:25},(_,i)=>`<rect x="60" y="${30+i*25}" width="${550+i*7}" height="8" fill="${i%2?'#222':'#174b87'}"/>`).join('')}<text x="100" y="350" font-size="45">TEST ONLY ${studentCode}</text></svg>`)).png().toBuffer();
 const file={purpose:'general',fileName:'integration-test-only.png',contentType:'image/png',sizeBytes:bytes.length};
 const services=[createCertificationsService({repository:createCertificationsRepository(),storage,inspectImage:createDocumentImageInspector(config),config:{...config,maxFiles:1},studentProfile:async()=>profile}),
  createItCertificationsService({repository:createItCertificationsRepository(),storage,inspectImage:createDocumentImageInspector(config),config,studentProfile:async()=>profile})];
 async function upload(prepared){for(const item of prepared.uploads)objects.set(new URL(item.url).pathname.slice(1),bytes);}
 const certRepo=createCertificationsRepository();
 try{
  // Real catalog CRUD, including If-Match-style optimistic versions, without modifying school rows.
  const suffix=randomUUID().slice(0,7),language=await services[0].saveCatalog(reviewer,'languages',parseLanguage({code:'T'+suffix,displayName:'Fixture '+suffix,isPublished:false}));catalogRows.push(['Languages',language.id]);
  const schema={fields:[{key:'score',label:'Điểm thử',type:'number',required:true,min:0,max:100,step:1}]};
  const type=await services[0].saveCatalog(reviewer,'types',parseType({code:'T'+suffix,displayName:'Fixture certificate',languageId:language.id,isPublished:false,formSchema:schema}));catalogRows.push(['CertificateTypes',type.id]);
  const policy=await services[0].saveCatalog(reviewer,'policies',parsePolicy({certificateTypeId:type.id,cohortFrom:2023,isRecognized:true}));catalogRows.push(['RecognitionPolicies',policy.id]);
  const issuer=await services[0].saveCatalog(reviewer,'issuers',parseIssuer({code:'T'+suffix,displayName:'Fixture issuer',isActive:true,sourceUrl:'https://example.com/test',verifiedOn:'2026-01-01',certificateTypeIds:[type.id]}));catalogRows.push(['IssuingOrganizations',issuer.id]);
  await services[0].saveCatalog(reviewer,'types',parseType({code:type.code,displayName:'Updated fixture type',languageId:language.id,isPublished:false,formSchema:schema}),type.id,type.rowVersion);
  await services[0].saveCatalog(reviewer,'policies',parsePolicy({certificateTypeId:type.id,cohortFrom:2023,isRecognized:true,documentReference:'Fixture policy update'}),policy.id,policy.rowVersion);
  await services[0].saveCatalog(reviewer,'issuers',parseIssuer({code:issuer.code,displayName:'Updated fixture issuer',isActive:true,sourceUrl:'https://example.com/test',verifiedOn:'2026-01-01',certificateTypeIds:[type.id]}),issuer.id,issuer.rowVersion);
  await services[0].saveCatalog(reviewer,'languages',parseLanguage({code:language.code,displayName:'Updated fixture',isPublished:false}),language.id,language.rowVersion);
  await assert.rejects(()=>services[0].saveCatalog(reviewer,'languages',parseLanguage({code:language.code,displayName:'Stale fixture',isPublished:false}),language.id,language.rowVersion),e=>e.statusCode===409);
  const studentCatalog=await services[0].catalog(student),eligible=studentCatalog.languages.flatMap(l=>l.types).find(t=>t.eligible&&t.issuingOrganizations?.length);
  assert(eligible,'Need an eligible real catalog type with an issuing organization');
  const result=Object.fromEntries(eligible.formSchema.fields.map(f=>[f.key,f.type==='number'?f.min:typeof f.options[0]==='object'?f.options[0].value:f.options[0]]));
  const itCatalog=await services[1].form(student);assert(itCatalog.catalog.length);
  for(let index=0;index<services.length;index++){
   const service=services[index];
   const data=index?{MaCC:itCatalog.catalog[0].MaCC,SoHieu:'FIXTURE',CoSoCapCC:'Fixture test issuer',SoVaoSo:'TEST',NgayCC:'2026-01-01'}:{certificateTypeId:eligible.id,issuingOrganizationId:eligible.issuingOrganizations[0].id,issuedOn:'2026-01-01',result};
   const prepare=(applicationId=null)=>service.prepare(student,index?parseItPreparation({...(applicationId?{applicationId}:{}),data,files:[file,file]},config,studentCode):parsePreparation({...(applicationId?{applicationId}:{}),data,files:[file]},config));
   let prepared=await prepare();await upload(prepared);let row=await service.complete(student,prepared.applicationId);assert.equal(row.status,'submitted');
   await assert.rejects(()=>service.get(another,row.id),e=>e.statusCode===403);
   const stale=row.rowVersion;row=await service.review(reviewer,row.id,row.rowVersion,parseReview({decision:'needs_changes',reason:'Bổ sung ảnh rõ hơn'}));assert.equal(row.status,'needs_changes');
   prepared=await prepare(row.id);await upload(prepared);row=await service.complete(student,row.id);assert.equal(row.status,'submitted');
   row=await service.review(reviewer,row.id,row.rowVersion,parseReview({decision:'processing'}));assert.equal(row.status,'processing');
   await assert.rejects(()=>service.review(reviewer,row.id,stale,parseReview({decision:'rejected',reason:'Stale'})),e=>e.statusCode===409);
   row=await service.review(reviewer,row.id,row.rowVersion,parseReview({decision:'verified',verificationMethod:'document_comparison'}));assert.equal(row.status,'verified');
   const evidence=index?row.currentSubmission.files[0]:row.files[0];const link=await service.download(student,row.id,evidence.id);assert(link.url);
   await assert.rejects(()=>prepare(row.id),e=>e.statusCode===409);
   prepared=await prepare();await upload(prepared);row=await service.complete(student,prepared.applicationId);row=await service.review(reviewer,row.id,row.rowVersion,parseReview({decision:'rejected',reason:'Từ chối fixture'}));assert.equal(row.status,'rejected');
   assert((await service.list(student,{page:1,pageSize:20,status:null})).items.length>=2);
  }
  // Use the real SQL repository with only the school's current-semester read injected.
  let term='2610';
  const leaveRepo=createAcademicLeaveRepository({connect:async()=>({request:()=>({query:async()=>({recordset:[{code:term}]})})})});
  const leave=createAcademicLeaveService({repository:leaveRepo,prefillProvider:async()=>({student:profile}),snapshotProvider:async()=>({student:profile,academicRows:[]})});
  const input=kind=>({kind,reasonCode:'medical',parentApplicationId:null,startSemesterCode:term,semesterCount:1,content:'Integration fixture'});
  let draft=await leave.save(student,input('leave'));draft=await leave.save(student,{...input('leave'),content:'Edited'},draft.id,draft.rowVersion);draft=await leave.cancel(student,draft.id,draft.rowVersion);assert.equal(draft.status,'cancelled');
  let row=await leave.save(student,input('leave'));row=await leave.confirm(student,row.id,row.rowVersion);assert.equal(row.status,'submitted');
  await assert.rejects(()=>leave.cancel(student,row.id,row.rowVersion),e=>e.statusCode===409);
  row=await leave.review(reviewer,row.id,row.rowVersion,{decision:'needs_changes',note:'Bổ sung fixture'});row=await leave.save(student,input('leave'),row.id,row.rowVersion);row=await leave.confirm(student,row.id,row.rowVersion);
  row=await leave.review(reviewer,row.id,row.rowVersion,{decision:'received'});assert.equal(Date.parse(row.paperDeadlineAt)-Date.parse(row.receivedAt),3*86400000);
  const waitingVersion=row.rowVersion;await assert.rejects(()=>leave.review(reviewer,row.id,row.rowVersion,{decision:'approved'}),e=>e.statusCode===409);
  row=await leave.receivePaper(reviewer,row.id,row.rowVersion);await assert.rejects(()=>leave.receivePaper(reviewer,row.id,waitingVersion),e=>e.statusCode===409);
  row=await leave.review(reviewer,row.id,row.rowVersion,{decision:'approved'});const parent=row;
  const printable=await leave.printable(student,row.id),html=renderAcademicLeavePrint(printable);assert(html.includes(studentCode));
  const pdf=await pdfRenderer.render(html);assert.equal(pdf.subarray(0,5).toString(),'%PDF-');
  term='2620';let extension=await leave.save(student,{...input('extension'),parentApplicationId:parent.id});extension=await leave.confirm(student,extension.id,extension.rowVersion);extension=await leave.review(reviewer,extension.id,extension.rowVersion,{decision:'rejected',note:'Reject fixture'});assert.equal(extension.status,'rejected');
  let returning=await leave.save(student,{...input('return'),parentApplicationId:parent.id,semesterCount:0});returning=await leave.confirm(student,returning.id,returning.rowVersion);returning=await leave.review(reviewer,returning.id,returning.rowVersion,{decision:'received'});returning=await leave.receivePaper(reviewer,returning.id,returning.rowVersion);returning=await leave.review(reviewer,returning.id,returning.rowVersion,{decision:'approved'});assert.equal(returning.status,'approved');
  assert((await leave.applicationHistory(student,row.id,{page:1,pageSize:100})).items.length>=7);
  console.log(JSON.stringify({storage:'memory adapter; no external requests',sql:'real local SQL',catalogKinds:4,certificateKinds:2,itMultipleFiles:true,supplement:true,rejection:true,optimisticConcurrency:true,ownership:true,academicLeave:true,extension:true,returnToStudy:true,pdf:true}));
 }finally{
  // Clean only fixtures created by this run. Never delete pre-existing user files/rows.
  try {
  const remaining=await query(`SELECT ObjectKey FROM certification.EvidenceFiles WHERE CertificateId IN(SELECT Id FROM certification.StudentCertificates WHERE ActorReference=?) UNION ALL SELECT ObjectKey FROM certification.tmCNTTChungChi_File WHERE ActorReference=?`,[reference,reference]);
  remaining.first.forEach(r=>keys.add(r.ObjectKey));
  const results=await Promise.allSettled([...keys].map(key=>storage.remove(key)));
  await transaction(`${localDatabaseGuardSql}
   DECLARE @it TABLE(ID int);INSERT @it SELECT DISTINCT CertificateId FROM certification.tmCNTTChungChi_File WHERE ActorReference=?;
   DELETE certification.tmCNTTChungChi_File WHERE ActorReference=?;
   DELETE certification.tmCNTTChungChi_SV WHERE ID IN(SELECT ID FROM @it);
   DELETE certification.EvidenceFiles WHERE CertificateId IN(SELECT Id FROM certification.StudentCertificates WHERE ActorReference=?);
   DELETE certification.StudentCertificates WHERE ActorReference=?;
   DELETE academic_leave.ApplicationHistory WHERE ApplicationId IN(SELECT Id FROM academic_leave.Applications WHERE ActorReference=?);
   WHILE EXISTS(SELECT 1 FROM academic_leave.Applications WHERE ActorReference=?) BEGIN
     DELETE c FROM academic_leave.Applications c WHERE ActorReference=? AND NOT EXISTS(SELECT 1 FROM academic_leave.Applications child WHERE child.ParentApplicationId=c.Id);
     IF @@ROWCOUNT=0 THROW 51990,'Fixture has unexpected external dependencies',1;
   END;`,[reference,reference,reference,reference,reference,reference,reference]);
  for(const [table,id]of [...catalogRows].reverse())await transaction(`${localDatabaseGuardSql}${table==='IssuingOrganizations'?'DELETE certification.CertificateTypeIssuers WHERE IssuingOrganizationId=?;':''}DELETE certification.${table} WHERE Id=?;`,table==='IssuingOrganizations'?[id,id]:[id]);
  assert.equal(results.filter(r=>r.status==='rejected').length,0,'Fixture object cleanup must succeed');
  } finally {await pdfRenderer.close();await disconnectLocalDatabase();}
 }
});
