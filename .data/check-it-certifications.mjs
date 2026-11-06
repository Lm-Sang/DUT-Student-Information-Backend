import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import express from 'express';
import sharp from 'sharp';
import {env} from '../src/config/env.js';
import {localConnectionString} from '../src/infrastructure/database/local-sql-server.js';
import {certificationConfig} from '../src/config/certifications.js';
import {createItCertificationsModule} from '../src/modules/certifications/index.js';
import {createItCertificationsRepository} from '../src/modules/certifications/repositories/it-certifications.repository.js';
import {errorHandler} from '../src/shared/middlewares/error-handler.middleware.js';
import {AppError} from '../src/shared/errors/app-error.js';

const {default:native}=await import('msnodesqlv8');
assert.equal(env.localDatabase.name,'Studentpage');
const connection=await native.promises.open(localConnectionString(env.localDatabase));
const nativeQuery=(sql,parameters=[])=>connection.promises.query(sql,parameters,{timeoutMs:30000});
const schema='it_certification_test_'+randomUUID().replaceAll('-','');
assert.match(schema,/^it_certification_test_[a-f0-9]{32}$/);
const query=(sql,parameters=[])=>nativeQuery(sql.replaceAll('it_certification.',schema+'.'),parameters);
const foreignDigest=async()=>{
  const data={};for(const table of ['Applications','Submissions','EvidenceFiles','Reviews','Languages','CertificateTypes','CertificateLevels','RecognitionPolicies'])
    data[table]=(await nativeQuery('SELECT * FROM certification.['+table+'] ORDER BY Id;')).first;
  return createHash('sha256').update(JSON.stringify(data)).digest('hex');
};
const before=await foreignDigest();
const repository=createItCertificationsRepository({query});
let signed=0,finishFailure=false,delayRead;
const objects=new Map();
const storage={bucket:'it-memory-only',
  async presignUpload(key,type){signed++;return{url:'https://storage.test/'+key,method:'PUT',headers:{'Content-Type':type,'If-None-Match':'*'}};},
  async head(key){if(!objects.has(key))throw new AppError('Missing upload',502);return{sizeBytes:objects.get(key).length};},
  async read(key){if(delayRead)await delayRead;return objects.get(key);},
  async remove(key){objects.delete(key);},async download(key){return'https://storage.test/'+key;}};
const finish=repository.finishSubmission;
const wrapped={...repository,async finishSubmission(input){if(finishFailure)throw new AppError('DB unavailable',503);return finish(input);}};
const module=createItCertificationsModule({repository:wrapped,storage,config:certificationConfig,contextProvider:(req,scope)=>scope==='student'
  ? {role:'student',source:'auth',reference:'it-check-'+(req.headers['x-user']??'self'),studentCode:'102240377',name:'IT check',className:'24T1',permissions:[]}
  : {role:'reviewer',source:'auth',reference:'it-check-reviewer',name:'IT reviewer',permissions:[]}});
const app=express();app.use(express.json());app.use(module.basePath,module.router);app.use(errorHandler);
const server=await new Promise(resolve=>{const s=app.listen(0,'127.0.0.1',()=>resolve(s));});
const base='http://127.0.0.1:'+server.address().port+module.basePath;
const bytes=await sharp(Buffer.from('<svg width="900" height="700"><rect width="900" height="700" fill="white"/>'+
  Array.from({length:24},(_,i)=>'<rect x="40" y="'+(30+i*24)+'" width="750" height="8"/>').join('')+'</svg>')).png().toBuffer();
const payload=()=>({data:{fullName:'Sinh viên kiểm thử',className:'24T1',studentCode:'102240377',birthDate:'2004-02-29',
  theoryScore:0,practicalScore:10,examSession:'Khóa thi 10/2026'},files:[{purpose:'general',fileName:'it.png',contentType:'image/png',sizeBytes:bytes.length}]});
async function request(path,method='GET',body,expected=200,version,headers={}){
  const response=await fetch(base+path,{method,headers:{...(body===undefined?{}:{'Content-Type':'application/json'}),
    ...(version?{'If-Match':'"'+version+'"'}:{}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});
  const result=await response.json();assert.equal(response.status,expected,JSON.stringify({path,expected,result}));return result.data;
}
function put(upload,content=bytes){
  const key=new URL(upload.url).pathname.slice(1);assert.match(key,/^certifications\/evidence\/it\//);
  assert.equal(upload.headers['If-None-Match'],'*');if(objects.has(key))return false;objects.set(key,Buffer.from(content));return true;
}
async function submit(input=payload()){
  const prepared=await request('/applications','POST',input,201);for(const upload of prepared.uploads)put(upload);
  return request('/applications/'+prepared.applicationId+'/complete','POST',{});
}
let checks=0;
try{
  const sql=(await readFile('docs/sql/it-certifications.sql','utf8')).replaceAll('it_certification',schema);
  await nativeQuery(sql);await nativeQuery(sql);checks++;
  const tables=(await nativeQuery('SELECT name FROM sys.tables WHERE schema_id=SCHEMA_ID(?);',[schema])).first;
  assert.deepEqual(tables.map(t=>t.name).sort(),['Applications','EvidenceFiles','Reviews','Submissions']);
  const form=await request('/form');assert.deepEqual(form.fields.map(f=>f.key),Object.keys(payload().data));
  assert.equal(form.fields.find(f=>f.key==='theoryScore').max,10);checks++;
  for(const [field,value]of [['theoryScore',10.01],['practicalScore',-1],['theoryScore','5'],['practicalScore',1.001],
    ['birthDate','2003-02-29'],['birthDate','2099-01-01'],['examSession',''],['issuedOn','2026-01-01']]){
    const input=payload();input.data[field]=value;const previous=signed;
    await request('/applications','POST',input,400);assert.equal(signed,previous);checks++;
  }
  const spoof=payload();spoof.data.studentCode='102240378';await request('/applications','POST',spoof,403);checks++;
  const extra=payload();extra.files[0].purpose='sw';await request('/applications','POST',extra,400);checks++;
  let prepared=await request('/applications','POST',payload(),201);
  const path='/applications/'+prepared.applicationId;
  const pending=await request(path);assert.equal(pending.currentSubmission,null);assert.equal(pending.pendingSubmission.theoryScore,0);
  await request(path+'/files/'+prepared.uploads[0].id+'/download','GET',undefined,404);
  await request(path,'GET',undefined,403,undefined,{'x-user':'other'});checks++;
  put(prepared.uploads[0]);let application=await request(path+'/complete','POST',{});
  assert.equal(application.status,'submitted');assert.equal(application.currentSubmission.birthDate,'2004-02-29');
  assert.equal(application.currentSubmission.theoryScore,0);assert.equal(application.currentSubmission.practicalScore,10);
  assert.equal(application.currentSubmission.examSession,'Khóa thi 10/2026');
  assert.equal(put(prepared.uploads[0],Buffer.from('overwrite')),false);
  assert.equal((await request(path+'/complete','POST',{})).currentSubmission.id,application.currentSubmission.id);
  assert.match((await request(path+'/files/'+prepared.uploads[0].id+'/download')).url,/evidence\/it\//);checks++;
  assert.equal((await request('/applications','GET',undefined,200,undefined,{'x-user':'other'})).totalRecords,0);checks++;
  await request('/reviewer'+path+'/review','POST',{decision:'needs_changes',reason:'Chụp lại',verificationMethod:'other'},428);
  const review={decision:'needs_changes',reason:'Chụp lại',verificationMethod:'document_comparison'};
  application=await request('/reviewer'+path+'/review','POST',review,200,application.rowVersion);
  await request('/reviewer'+path+'/review','POST',review,409,application.rowVersion);checks++;
  const revised=payload();revised.applicationId=application.id;revised.data.theoryScore=7.25;
  prepared=await request('/applications','POST',revised,201);put(prepared.uploads[0]);application=await request(path+'/complete','POST',{});
  assert.equal(application.submissions.length,2);assert.equal(application.submissions[1].theoryScore,0);
  assert.equal(application.currentSubmission.theoryScore,7.25);checks++;
  await assert.rejects(query('UPDATE it_certification.Submissions SET TheoryScore=5 WHERE Id=?;',[application.currentSubmission.id]),/ITCERT_SUBMISSION_IMMUTABLE/);checks++;
  application=await request('/reviewer'+path+'/review','POST',{decision:'verified',verificationMethod:'issuer_lookup'},200,application.rowVersion);
  await request('/applications','POST',revised,409);checks++;
  const multiple=payload();multiple.files.push({...multiple.files[0],fileName:'page2.png'});
  prepared=await request('/applications','POST',multiple,201);put(prepared.uploads[0]);
  const multi='/applications/'+prepared.applicationId;
  await request(multi+'/complete','POST',{},502);assert.equal((await request(multi)).currentSubmission,null);
  put(prepared.uploads[1]);assert.equal((await request(multi+'/complete','POST',{})).currentSubmission.files.length,2);checks++;
  prepared=await request('/applications','POST',payload(),201);put(prepared.uploads[0],Buffer.alloc(bytes.length));
  const invalid='/applications/'+prepared.applicationId;
  await request(invalid+'/complete','POST',{},422);assert.equal(objects.has(new URL(prepared.uploads[0].url).pathname.slice(1)),false);
  put(prepared.uploads[0]);finishFailure=true;await request(invalid+'/complete','POST',{},503);
  assert.equal(objects.has(new URL(prepared.uploads[0].url).pathname.slice(1)),true);finishFailure=false;
  assert.equal((await request(invalid+'/complete','POST',{})).status,'submitted');checks++;
  prepared=await request('/applications','POST',payload(),201);put(prepared.uploads[0]);
  const concurrent='/applications/'+prepared.applicationId;
  let resume;delayRead=new Promise(resolve=>resume=resolve);
  const first=request(concurrent+'/complete','POST',{});
  for(let i=0;i<100;i++){const state=await repository.get(prepared.applicationId);if(state.Submissions[0].Status==='checking')break;await new Promise(resolve=>setTimeout(resolve,10));}
  await request(concurrent+'/complete','POST',{},409);resume();delayRead=null;assert.equal((await first).status,'submitted');checks++;
  prepared=await request('/applications','POST',payload(),201);
  await query("UPDATE it_certification.Submissions SET CreatedAt=DATEADD(hour,-1,SYSUTCDATETIME()),ExpiresAt=DATEADD(minute,-1,SYSUTCDATETIME()) WHERE ApplicationId=?;",[prepared.applicationId]);
  await request('/applications/'+prepared.applicationId+'/complete','POST',{},410);
  const renewal={...payload(),applicationId:prepared.applicationId};const renewed=await request('/applications','POST',renewal,201);
  assert.notEqual(renewed.uploads[0].id,prepared.uploads[0].id);checks++;
  let rejected=await submit();rejected=await request('/reviewer/applications/'+rejected.id+'/review','POST',
    {decision:'rejected',reason:'Không xác minh được',verificationMethod:'other'},200,rejected.rowVersion);
  await request('/applications','POST',{...payload(),applicationId:rejected.id},409);checks++;
  // A lost response after DB commit must preserve the accepted file and allow an idempotent retry.
  prepared=await request('/applications','POST',payload(),201);put(prepared.uploads[0]);
  wrapped.finishSubmission=async input=>{await finish(input);throw new AppError('Response lost',503);};
  const lost='/applications/'+prepared.applicationId;
  await request(lost+'/complete','POST',{},503);assert.equal((await request(lost+'/complete','POST',{})).status,'submitted');
  assert.equal(objects.has(new URL(prepared.uploads[0].url).pathname.slice(1)),true);wrapped.finishSubmission=finish;checks++;
  assert.equal(await foreignDigest(),before);checks++;
  console.log(JSON.stringify({passed:true,checks,sourceDataCopied:false,foreignDataUnchanged:true,realR2ObjectsWritten:0,schema}));
}finally{
  server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
  await nativeQuery('IF XACT_STATE()<>0 ROLLBACK TRANSACTION;');
  const keys=(await nativeQuery('SELECT OBJECT_NAME(parent_object_id) AS TableName,name FROM sys.foreign_keys WHERE schema_id=SCHEMA_ID(?);',[schema])).first;
  for(const key of keys){assert.match(key.TableName,/^[A-Za-z0-9_]+$/);assert.match(key.name,/^[A-Za-z0-9_]+$/);await nativeQuery('ALTER TABLE ['+schema+'].['+key.TableName+'] DROP CONSTRAINT ['+key.name+'];');}
  const tables=(await nativeQuery('SELECT name FROM sys.tables WHERE schema_id=SCHEMA_ID(?);',[schema])).first;
  for(const table of tables){assert.match(table.name,/^[A-Za-z0-9_]+$/);await nativeQuery('DROP TABLE ['+schema+'].['+table.name+'];');}
  await nativeQuery('IF SCHEMA_ID(?) IS NOT NULL EXEC(N\'DROP SCHEMA ['+schema+']\');',[schema]);
  assert.equal(await foreignDigest(),before);await connection.promises.close();console.log('Isolated IT test schema removed; foreign-language data preserved.');
}
