import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import test from 'node:test';
import express from 'express';
import sharp from 'sharp';
import {createReviewerTestAuth} from '../../certification-web-test/reviewer-auth.js';
import {createCertificationsModule} from '../../src/modules/certifications/index.js';
import {certificationConfig} from '../../src/config/certifications.js';
import {MemoryRepository,MemoryStorage} from '../support/certifications.js';
import {errorHandler} from '../../src/shared/middlewares/error-handler.middleware.js';
import {AppError} from '../../src/shared/errors/app-error.js';

const config={...certificationConfig,nodeEnv:'test',devMode:true,reviewerOrigin:'http://localhost:5174'};
async function listen(t,app){const server=createServer(app);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>{server.close(resolve);server.closeAllConnections();}));return'http://127.0.0.1:'+server.address().port;}

test('temporary reviewer login checks credentials, origin, expiry and revocation only in local dev',async t=>{
  let now=Date.now();const auth=createReviewerTestAuth(config,{now:()=>now});
  const app=express();app.use('/api/certifications/reviewer/auth',auth.router);app.use(errorHandler);const base=await listen(t,app);
  const path=base+'/api/certifications/reviewer/auth';
  const login=(password,origin=config.reviewerOrigin)=>fetch(path+'/login',{method:'POST',headers:{'Content-Type':'application/json',origin},body:JSON.stringify({username:'admin',password})});
  assert.equal((await fetch(path+'/session')).status,401);
  assert.equal((await login('wrong')).status,401);
  assert.equal((await login('123','http://localhost:5173')).status,403);
  const response=await login('123');assert.equal(response.status,200);
  const cookie=response.headers.get('set-cookie');assert.match(cookie,/HttpOnly/i);assert.match(cookie,/SameSite=Strict/i);assert.match(cookie,/Path=\/api(?:;|$)/);
  assert.match(cookie,/Path=\/api\/certifications\/reviewer/); // Expire the former narrower cookie when upgrading.
  const sessionCookie=cookie.split(';')[0];const body=await response.json();assert.equal(body.data.user.username,'admin');assert.equal(body.data.token,undefined);
  assert.equal((await fetch(path+'/session',{headers:{cookie:sessionCookie}})).status,200);
  assert.equal((await fetch(path+'/session',{headers:{cookie:'certification_reviewer_test='+'a'.repeat(64)}})).status,401);
  const expiredCookie=sessionCookie;now+=2*60*60*1000+1;
  assert.equal((await fetch(path+'/session',{headers:{cookie:expiredCookie}})).status,401);
  const fresh=await login('123');const freshCookie=fresh.headers.get('set-cookie').split(';')[0];
  assert.equal((await fetch(path+'/logout',{method:'POST',headers:{cookie:freshCookie,origin:config.reviewerOrigin}})).status,200);
  assert.equal((await fetch(path+'/session',{headers:{cookie:freshCookie}})).status,401);
  const disabled=express();disabled.use('/auth',createReviewerTestAuth({...config,nodeEnv:'production'}).router);disabled.use(errorHandler);
  assert.equal((await fetch((await listen(t,disabled))+'/auth/session')).status,503);
});

test('reviewer account inspects and assesses the current certificate; supplementation updates the same record',async t=>{
  const repository=new MemoryRepository(),storage=new MemoryStorage();
  const reviewerAuthentication=createReviewerTestAuth(config);
  const reviewerActor=reviewerAuthentication.actor;
  reviewerAuthentication.actor=req=>{
    if(req.headers.authorization)throw new AppError('Student token cannot review',403);
    return reviewerActor(req);
  };
  const module=createCertificationsModule({repository,storage,config,reviewerAuthentication,studentContextProvider:async req=>{
    assert.equal(req.headers.authorization,'Bearer student-token');
    return{role:'student',source:'auth',reference:'student-102230001',name:'Sinh viên',studentCode:'102230001',cohortYear:2023,permissions:[]};
  }});
  const app=express();app.use(express.json());app.use(module.basePath,module.router);app.use(errorHandler);const base=await listen(t,app);
  async function request(path,{method='GET',body,cookie,student=false,rowVersion,expected=200}={}){
    const response=await fetch(base+module.basePath+path,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),
      ...(cookie?{cookie}:{}),...(student?{Authorization:'Bearer student-token'}:{}),...(rowVersion?{'If-Match':'"'+rowVersion+'"'}:{})},
      ...(body?{body:JSON.stringify(body)}:{})});
    const json=await response.json();assert.equal(response.status,expected,JSON.stringify(json));return{response,data:json.data};
  }
  await request('/reviewer/applications',{expected:401});
  await request('/reviewer/applications',{student:true,expected:403});
  const login=await request('/reviewer/auth/login',{method:'POST',body:{username:'admin',password:'123'}});
  const cookie=login.response.headers.get('set-cookie').split(';')[0];
  const svg='<svg width="900" height="700"><rect width="900" height="700" fill="white"/>'+
    Array.from({length:24},(_,i)=>'<rect x="40" y="'+(30+i*24)+'" width="750" height="8"/>').join('')+'</svg>';
  const bytes=await sharp(Buffer.from(svg)).png().toBuffer();
  const input={data:{fullName:'Sinh viên DUT',className:'23T1',certificateTypeId:1,issuedOn:'2026-01-01',result:{overall:4.5}},
    files:[{purpose:'general',fileName:'certificate.png',contentType:'image/png',sizeBytes:bytes.length}]};
  async function prepare(body=input){const {data}=await request('/applications',{method:'POST',body,student:true,expected:201});
    for(const upload of data.uploads)storage.objects.set(new URL(upload.url).pathname.slice(1),bytes);return data;}
  assert.equal((await request('/catalog',{student:true})).data.maxFiles,1);
  for(const files of [[],[input.files[0],{...input.files[0],fileName:'second.png'}]])
    await request('/applications',{method:'POST',student:true,body:{...input,files},expected:400});
  assert.equal(repository.records.size,0);
  const prepared=await prepare();
  assert.equal(prepared.uploads.length,1);
  assert.equal((await request('/reviewer/applications',{cookie})).data.items.length,0);
  const draft=(await request('/reviewer/applications/'+prepared.applicationId,{cookie})).data;
  await request('/reviewer/applications/'+draft.id+'/review',{method:'POST',cookie,rowVersion:draft.rowVersion,
    body:{decision:'verified',verificationMethod:'document_comparison'},expected:409});
  let application=(await request('/applications/'+prepared.applicationId+'/complete',{method:'POST',student:true,body:{}})).data;
  const queue=(await request('/reviewer/applications',{cookie})).data;
  assert.equal(queue.items[0].fullName,'Sinh viên DUT');assert.equal(queue.items[0].certificateTypeName,'IELTS');
  const fileId=application.files[0].id;
  assert.match((await request('/reviewer/applications/'+application.id+'/files/'+fileId+'/download',{cookie})).data.url,/evidence/);
  const reviewPath='/reviewer/applications/'+application.id+'/review';
  await request(reviewPath,{method:'POST',cookie,rowVersion:application.rowVersion,
    body:{decision:'needs_changes',verificationMethod:'document_comparison'},expected:400});
  await request(reviewPath,{method:'POST',cookie,rowVersion:application.rowVersion,
    body:{decision:'verified',verificationMethod:'document_comparison',result:{overall:9}},expected:400});
  await request(reviewPath,{method:'POST',cookie,rowVersion:'0000000000000000',
    body:{decision:'verified',verificationMethod:'document_comparison'},expected:409});
  application=(await request(reviewPath,{method:'POST',cookie,rowVersion:application.rowVersion,
    body:{decision:'needs_changes',reason:'Bổ sung ảnh rõ hơn',verificationMethod:'document_comparison'}})).data;
  assert.equal(application.status,'needs_changes');assert.equal(application.result.overall,4.5);
  assert.match(application.review.reviewerName,/admin/);
  const extra=await prepare({...input,applicationId:application.id,data:{...input.data,result:{overall:5}}});
  await request('/reviewer/applications/'+application.id+'/files/'+fileId+'/download',{cookie,expected:404});
  application=(await request('/applications/'+extra.applicationId+'/complete',{method:'POST',student:true,body:{}})).data;
  assert.equal(application.id,prepared.applicationId);assert.equal(application.result.overall,5);
  assert.equal(application.files.length,1);assert.equal(application.createdAt,draft.createdAt);
  assert.equal(application.review,null);assert.equal(repository.records.size,1);
  assert.equal(application.submissions,undefined);
  application=(await request(reviewPath,{method:'POST',cookie,rowVersion:application.rowVersion,
    body:{decision:'verified',verificationMethod:'issuer_lookup'}})).data;
  assert.equal(application.status,'verified');assert.equal(application.result.overall,5);
  await request(reviewPath,{method:'POST',cookie,rowVersion:application.rowVersion,
    body:{decision:'rejected',reason:'No overwrite',verificationMethod:'other'},expected:409});
  await request('/applications',{method:'POST',student:true,body:{...input,applicationId:application.id},expected:409});
  const second=await prepare();
  const submitted=(await request('/applications/'+second.applicationId+'/complete',{method:'POST',student:true,body:{}})).data;
  const rejected=(await request('/reviewer/applications/'+submitted.id+'/review',{method:'POST',cookie,rowVersion:submitted.rowVersion,
    body:{decision:'rejected',reason:'Không chấp nhận minh chứng',verificationMethod:'document_comparison'}})).data;
  assert.equal(rejected.status,'rejected');
  await request('/applications',{method:'POST',student:true,body:{...input,applicationId:rejected.id},expected:409});
  await request('/reviewer/auth/logout',{method:'POST',cookie,body:{}});
  await request('/reviewer/applications',{cookie,expected:401});
});
