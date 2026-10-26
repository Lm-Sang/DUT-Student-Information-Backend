import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import express from 'express';
import sharp from 'sharp';
import { createWebTestApp } from '../../certification-web-test/server.js';
import { submitStudentApplication,buildApplicationPayload } from '../../certification-web-test/public/upload.js';
import { validateEvidenceFiles } from '../../certification-web-test/public/image-validation.js';
import { createCertificationsModule } from '../../src/modules/certifications/index.js';
import { createDutStudentContext } from '../../src/modules/certifications/middlewares/dut-student-context.js';
import { certificationConfig } from '../../src/config/certifications.js';
import { MemoryRepository,MemoryStorage } from '../support/certifications.js';
import { errorHandler } from '../../src/shared/middlewares/error-handler.middleware.js';
import {createLocalCertificationsModules} from '../../certification-web-test/backend-module.js';
import {MemoryItRepository} from '../support/it-certifications.js';
import {certificateView,certificateApiBase,isItPage} from '../../certification-web-test/public/certificate-view.js';
import {parsePreparation} from '../../src/modules/certifications/dto/certifications.request.dto.js';
import {parseItPreparation} from '../../src/modules/certifications/dto/it-certifications.request.dto.js';

// Exercise the FE validation and upload ordering in Node with only browser decoding replaced.
const validateFiles=(files,limits)=>validateEvidenceFiles(files,limits,{decode:async file=>{
  const input=sharp(Buffer.from(await file.arrayBuffer()));
  const metadata=await input.metadata();
  const {data,info}=await input.rotate().resize({width:1200,height:1200,fit:'inside',withoutEnlargement:true})
    .flatten({background:'#fff'}).greyscale().raw().toBuffer({resolveWithObject:true});
  return{width:metadata.width,height:metadata.height,data,normalizedWidth:info.width,normalizedHeight:info.height};
}});

async function listen(t,app) {
  const server=createServer(app);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>{server.close(resolve);server.closeAllConnections();}));
  return 'http://127.0.0.1:'+server.address().port;
}

test('FE test serves only public files and receives SSO token via a fragment callback',async t=>{
  const base=await listen(t,createWebTestApp({apiBaseUrl:'http://localhost:3003',ssoBaseUrl:'https://sso.dut.udn.vn'}));
  assert.equal((await fetch(base)).status,200);
  assert.match(await (await fetch(base)).text(),/type="file"/);
  assert.doesNotMatch(await (await fetch(base)).text(),/<input[^>]*type="file"[^>]*\bmultiple\b/);
  const itHtml=await(await fetch(base+'/?kind=it')).text();
  assert.match(itHtml,/id="it-tab"/);assert.match(itHtml,/id="it-fields"/);
  assert.equal((await fetch(base+'/certificate-view.js')).status,200);
  assert.equal((await fetch(base+'/.env')).status,404);
  assert.equal((await fetch(base+'/server.js')).status,404);
  assert.deepEqual(await(await fetch(base+'/test-config.json')).json(),{apiBaseUrl:'http://localhost:3003',ssoBaseUrl:'https://sso.dut.udn.vn',
    mode:'student',studentOrigin:'http://localhost:5173',reviewerOrigin:'http://localhost:5174'});
  const callback=await fetch(base+'/local-api/auth/token?accessToken=sso-test-token',{redirect:'manual'});
  assert.equal(callback.status,303);
  assert.equal(callback.headers.get('location'),'/auth-callback.html#accessToken=sso-test-token');
  assert.equal(callback.headers.get('referrer-policy'),'no-referrer');
  const failed=await fetch(base+'/local-api/auth/token?error_description=secret-error',{redirect:'manual'});
  assert.match(failed.headers.get('location'),/^\/auth-callback.html#error=/);
  assert.ok(!failed.headers.get('location').includes('secret-error'));
});

test('combined FE adapter selects the IT API and renders native certificate fields',()=>{
  assert.equal(isItPage('?kind=it'),true);assert.equal(certificateApiBase(true),'/api/it-certifications');
  const app={id:'app',status:'needs_changes',updatedAt:'2026-10-26T00:00:00Z',studentCode:'102240377',
    pendingSubmission:null,currentSubmission:{data:{ID:7,MaCC:'CNTT01',SoHieu:'SH1',CoSoCapCC:'Issuer',SoVaoSo:'VS1',NgayCC:'2026-10-01'},
      certificateTypeName:'Chứng chỉ CNTT cơ bản',files:[{id:'file'}],review:{decision:'needs_changes',reason:'New image'}}};
  const view=certificateView(app,true);
  assert.equal(view.catalogSnapshot.type.displayName,'Chứng chỉ CNTT cơ bản');
  assert.deepEqual(view.catalogSnapshot.type.formSchema.fields.map(f=>f.key),['SoHieu','CoSoCapCC','SoVaoSo','MaCC','NgayCC']);
  assert.equal(view.result.CoSoCapCC,'Issuer');assert.equal(view.review.reason,'New image');assert.equal(view.files[0].id,'file');
  assert.equal(certificateView(view,false),view);
});

test('shared local reviewer session handles IT submission, evidence, supplementation and both queues',async t=>{
  const language=new MemoryRepository(),it=new MemoryItRepository(),storage=new MemoryStorage();
  const student={role:'student',source:'auth',reference:'student-102240377',name:'Student',studentCode:'102240377',cohortYear:2024};
  const modules=createLocalCertificationsModules({language:{repository:language,storage},it:{repository:it,storage},
    authConfig:{nodeEnv:'test',devMode:true,reviewerOrigin:'http://localhost:5174'},
    studentContextProvider:async req=>{assert.equal(req.headers.authorization,'Bearer student-token');return student;}});
  const app=express();app.use(express.json());for(const module of Object.values(modules))app.use(module.basePath,module.router);
  app.use(errorHandler);const base=await listen(t,app);
  async function request(path,{method='GET',body,cookie,auth=true,version,expected=200}={}){
    const response=await fetch(base+path,{method,headers:{...(auth?{Authorization:'Bearer student-token'}:{}),
      ...(body?{'Content-Type':'application/json'}:{}),...(cookie?{cookie}:{}),...(version?{'If-Match':'"'+version+'"'}:{})},
      ...(body?{body:JSON.stringify(body)}:{})});
    const json=await response.json();assert.equal(response.status,expected,JSON.stringify(json));return{response,data:json.data};
  }
  const form=(await request('/api/it-certifications/form')).data;assert.equal(form.fields.length,5);
  const bytes=await sharp(Buffer.from('<svg width="900" height="700"><rect width="900" height="700" fill="white"/>'+Array.from({length:24},(_,i)=>'<rect x="40" y="'+(30+i*24)+'" width="750" height="8"/>').join('')+'</svg>')).jpeg().toBuffer();
  const data={SoHieu:'SH1',CoSoCapCC:'Issuer',SoVaoSo:'VS1',MaCC:'CNTT01',NgayCC:'2026-10-01'};
  // The shared upload helper expects the existing HTTP 201 prepare response.
  const wrappedApi=async(path,options={})=>(await request('/api/it-certifications'+path,{...options,expected:path==='/applications'?201:200})).data;
  const submitIt=(applicationId,input=bytes)=>submitStudentApplication({api:wrappedApi,data,applicationId,files:[new File([input],'it.JPG',{type:'image/jpg'})],
    validateFiles,upload:async(upload,file)=>{storage.objects.set(new URL(upload.url).pathname.slice(1),Buffer.from(await file.arrayBuffer()));}});
  let application=await submitIt();assert.equal(application.status,'submitted');
  assert.equal(application.currentSubmission.files[0].contentType,'image/jpeg');
  const login=await request('/api/certifications/reviewer/auth/login',{method:'POST',auth:false,body:{username:'admin',password:'123'}});
  const cookie=login.response.headers.get('set-cookie').split(';')[0];
  assert.match(login.response.headers.get('set-cookie'),/Path=\/api(?:;|$)/);
  const reviewerPath='/api/it-certifications/reviewer/applications';
  const queue=(await request(reviewerPath,{cookie,auth:false})).data;
  assert.equal(queue.items[0].certificateTypeName,'Chứng chỉ CNTT cơ bản');
  assert.equal((await request('/api/certifications/reviewer/applications',{cookie,auth:false})).data.totalRecords,0);
  const fileId=application.currentSubmission.files[0].id;
  assert.match((await request(reviewerPath+'/'+application.id+'/files/'+fileId+'/download',{cookie,auth:false})).data.url,/evidence\/it/);
  application=(await request(reviewerPath+'/'+application.id+'/review',{method:'POST',auth:false,cookie,version:application.rowVersion,
    body:{decision:'needs_changes',reason:'Chụp rõ hơn',verificationMethod:'document_comparison'}})).data;
  assert.equal(certificateView(application,true).review.reason,'Chụp rõ hơn');
  const sameId=application.id;
  application=await submitIt(sameId,await sharp(bytes).png().toBuffer());assert.equal(application.id,sameId);
  assert.equal(application.currentSubmission.files[0].contentType,'image/png');
  application=(await request(reviewerPath+'/'+application.id+'/review',{method:'POST',auth:false,cookie,version:application.rowVersion,
    body:{decision:'verified',verificationMethod:'document_comparison'}})).data;assert.equal(application.status,'verified');
  await request(reviewerPath,{cookie,expected:403});
  await request('/api/certifications/reviewer/auth/logout',{method:'POST',auth:false,cookie,body:{}});
  await request(reviewerPath,{auth:false,cookie,expected:401});
});

test('reviewer origin serves the review screen without embedding its temporary password',async t=>{
  const base=await listen(t,createWebTestApp({apiBaseUrl:'http://localhost:3003',ssoBaseUrl:'https://sso.dut.udn.vn',mode:'reviewer'}));
  const html=await(await fetch(base)).text();assert.match(html,/Xét duyệt chứng chỉ/);assert.match(html,/reviewer-login-form/);
  assert.doesNotMatch(html,/value="123"/);
  assert.equal((await(await fetch(base+'/test-config.json')).json()).mode,'reviewer');
});

for(const format of ['png','jpg','png-named-jpg','jpeg-named-png'])test(`one ${format} selection drives prepare, binary PUT and complete with the SSO student identity`,async t=>{
  const isJpeg=format==='jpg'||format==='jpeg-named-png';
  const contentType=isJpeg?'image/jpeg':'image/png';
  const repository=new MemoryRepository(),storage=new MemoryStorage();
  const r2=await listen(t,async(req,res)=>{
    assert.equal(req.method,'PUT');assert.equal(req.headers['content-type'],contentType);
    assert.equal(req.headers['if-none-match'],'*');
    assert.match(req.url,/^\/certifications\/evidence\//);
    assert.equal(req.headers.authorization,undefined);
    if(storage.objects.has(req.url.slice(1))){res.writeHead(412);res.end();return;}
    const chunks=[];for await(const chunk of req)chunks.push(chunk);
    storage.objects.set(req.url.slice(1),Buffer.concat(chunks));res.writeHead(200);res.end();
  });
  storage.presignUpload=async(key,contentType)=>({url:r2+'/'+key,method:'PUT',headers:{'Content-Type':contentType,'If-None-Match':'*'}});
  const context=createDutStudentContext({fetchImpl:async(_url,options)=>options.headers.Authorization==='Bearer student-token'
    ? Response.json({data:{studentCardNumber:'102240377',fullName:'Sinh viên DUT',class:{name:'24T1'}}})
    : new Response(null,{status:401})});
  const module=createCertificationsModule({repository,storage,studentContextProvider:context,
    config:{...certificationConfig,devMode:true,nodeEnv:'test'}});
  const app=express();app.use(express.json());app.use(module.basePath,module.router);app.use(errorHandler);
  const base=await listen(t,app),calls=[];
  const api=async(path,options={})=>{
    calls.push(path);
    const response=await fetch(base+module.basePath+path,{method:options.method||'GET',
      headers:{Authorization:'Bearer student-token',...(options.body?{'Content-Type':'application/json'}:{})},
      ...(options.body?{body:JSON.stringify(options.body)}:{})});
    const result=await response.json();assert.ok(response.ok,JSON.stringify(result));return result.data;
  };
  const catalog=await api('/catalog');assert.equal(catalog.student.source,'auth');assert.equal(catalog.student.fullName,'Sinh viên DUT');
  const invalid=await fetch(base+module.basePath+'/catalog',{headers:{Authorization:'Bearer invalid'}});
  assert.equal(invalid.status,401);
  const manager=await fetch(base+module.basePath+'/management/catalog',{headers:{Authorization:'Bearer student-token'}});
  assert.equal(manager.status,503);
  const svg='<svg width="900" height="700"><rect width="900" height="700" fill="white"/>'+
    Array.from({length:24},(_,i)=>'<rect x="40" y="'+(30+i*24)+'" width="750" height="8"/>').join('')+'</svg>';
  const bytes=await sharp(Buffer.from(svg)).toFormat(isJpeg?'jpeg':'png').toBuffer();
  const declaredType=format==='png-named-jpg'?'image/jpeg':format==='jpeg-named-png'?'image/png':format==='jpg'?'image/jpg':contentType;
  const extension=format==='png-named-jpg'?'JPG':format==='jpeg-named-png'?'PNG':format.toUpperCase();
  const file=new File([bytes],'chung-chi.'+extension,{type:declaredType});
  if(format==='jpg'){
    const untyped=new File([bytes],'scan.jpeg');
    assert.equal(buildApplicationPayload({data:{},files:[untyped]}).files[0].contentType,'image/jpeg');
    await validateFiles([untyped]);
  }
  const data={fullName:'Sinh viên DUT',className:'24T1',certificateTypeId:1,issuedOn:'2026-01-01',result:{overall:4.5}};
  const payload=buildApplicationPayload({data,files:[file]});
  assert.equal(payload.files[0].sizeBytes,bytes.length);assert.equal(payload.files[0].fileName,file.name);
  assert.equal(payload.files[0].contentType,declaredType==='image/jpg'?'image/jpeg':declaredType);
  let remembered;
  assert.deepEqual(catalog.imageValidation,{maxPixels:certificationConfig.maxPixels,
    minImageSide:certificationConfig.minImageSide,blurThreshold:certificationConfig.blurThreshold});
  let originalUpload;
  const result=await submitStudentApplication({api,data,files:[file],validateFiles,
    limits:{maxFiles:catalog.maxFiles,maxFileBytes:catalog.maxFileBytes,...catalog.imageValidation},onPrepared:id=>{remembered=id;},
    upload:async(upload,selected,onProgress)=>{
      originalUpload=upload;
      assert.equal(selected,file);
      const response=await fetch(upload.url,{method:'PUT',headers:upload.headers,body:selected});
      assert.equal(response.status,200);onProgress(1);
    }});
  assert.equal(result.id,remembered);assert.equal(result.status,'submitted');
  assert.equal(result.studentCode,'102240377');assert.equal(result.cohortYear,2024);
  assert.deepEqual(result.result,{overall:4.5});
  assert.equal(result.files[0].sizeBytes,file.size);
  assert.equal(result.files[0].contentType,contentType);
  assert.equal((await repository.get(result.id)).ActorSource,'auth');
  assert.deepEqual(calls,['/catalog','/applications','/applications/'+result.id+'/complete']);
  assert.equal((await fetch(originalUpload.url,{method:'PUT',headers:originalUpload.headers,body:'replay'})).status,412);
  assert.deepEqual([...storage.objects.values()][0],bytes);
});

test('both certificate request parsers normalize JPG MIME aliases before signing uploads',()=>{
  const config={maxFiles:1,maxFileBytes:1024};
  const files=[{fileName:'SCAN.JPG',contentType:'image/jpg',sizeBytes:100}];
  const language=parsePreparation({data:{fullName:'Student',className:'24T1',certificateTypeId:1,result:{overall:5},issuedOn:'2026-01-01'},files},config);
  const it=parseItPreparation({data:{MaCC:'CNTT01',CoSoCapCC:'Issuer'},files},config,'102240377');
  assert.equal(language.files[0].contentType,'image/jpeg');assert.equal(it.files[0].contentType,'image/jpeg');
  assert.equal(language.files[0].fileName,'SCAN.JPG');assert.equal(it.files[0].fileName,'SCAN.JPG');
});

test('failed binary upload retains the application id and never calls complete',async()=>{
  const calls=[];let remembered;
  const file=new File(['bytes'],'file.png',{type:'image/png'});
  await assert.rejects(submitStudentApplication({files:[file],data:{},validateFiles:async()=>{},onPrepared:id=>{remembered=id;},
    api:async(path,options)=>{calls.push(path);assert.equal(options.body.applicationId,'existing');return{applicationId:'existing',uploads:[{url:'https://r2.example/upload'}]};},
    applicationId:'existing',upload:async()=>{throw new Error('Upload failed');}}),/Upload failed/);
  assert.equal(remembered,'existing');assert.deepEqual(calls,['/applications']);
});

test('FE rejects invalid images and multiple files before prepare or R2 upload',async()=>{
  const valid=await sharp({create:{width:900,height:700,channels:3,background:'#fff'}})
    .composite([{input:Buffer.from('<svg width="900" height="700"><rect x="60" y="50" width="750" height="400"/></svg>')}]).png().toBuffer();
  const small=await sharp({create:{width:100,height:100,channels:3,background:'#fff'}}).png().toBuffer();
  const blank=await sharp({create:{width:900,height:700,channels:3,background:'#fff'}}).png().toBuffer();
  const validFile=new File([valid],'valid.png',{type:'image/png'});
  const cases=[
    {file:new File(['not an image'],'fake.png',{type:'image/png'}),pattern:/Nội dung ảnh/},
    {file:new File([small],'small.png',{type:'image/png'}),pattern:/Cạnh ngắn nhất/},
    {file:new File([blank],'blank.png',{type:'image/png'}),pattern:/chi tiết/},
    {file:validFile,limits:{maxPixels:1000},pattern:/pixel/},
    {file:validFile,limits:{maxFileBytes:10},pattern:/Dung lượng/},
    {file:validFile,limits:{blurThreshold:100000},pattern:/quá mờ/},
    {file:new File([await sharp(valid).webp().toBuffer()],'unsupported.jpg',{type:'image/jpeg'}),pattern:/Nội dung ảnh/},
  ];
  for(const {file,limits,pattern}of cases){
    let calls=0;
    await assert.rejects(submitStudentApplication({data:{},files:[file],limits,validateFiles,
      api:async()=>{calls++;},upload:async()=>{calls++;}}),pattern);
    assert.equal(calls,0);
  }
  let calls=0;
  await assert.rejects(submitStudentApplication({data:{},files:[validFile,new File([small],'second.png',{type:'image/png'})],validateFiles,
    api:async()=>{calls++;},upload:async()=>{calls++;}}),/một file/);
  assert.equal(calls,0);
});
