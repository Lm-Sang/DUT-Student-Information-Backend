import assert from 'node:assert/strict';
import {setTimeout as delay} from 'node:timers/promises';
import {EventEmitter} from 'node:events';
import test from 'node:test';
import express from 'express';
import {AppError} from '../../src/shared/errors/app-error.js';
import {errorHandler} from '../../src/shared/middlewares/error-handler.middleware.js';
import {createCertificationEvents,notifyCertificateChanged} from '../../src/modules/certifications/events/certification-events.js';
import {createCertificationEventsController} from '../../src/modules/certifications/controllers/certification-events.controller.js';
import {createLocalCertificationsModules} from '../../certification-web-test/backend-module.js';
import {certificationConfig} from '../../src/config/certifications.js';
import {MemoryRepository,MemoryStorage} from '../support/certifications.js';
import {MemoryItRepository} from '../support/it-certifications.js';
import {readCertificationEvents,createCertificationRealtime} from '../../certification-web-test/public/realtime.js';

async function listen(t,app){const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
 t.after(()=>{server.closeAllConnections();return new Promise(r=>server.close(r));});return'http://127.0.0.1:'+server.address().port;}
async function collect(url,options={}){
 const controller=new AbortController(),response=await fetch(url,{...options,signal:controller.signal});
 assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/text\/event-stream/);
 const entries=[];let failure;
 const done=readCertificationEvents(response,(event,data)=>{entries.push({event,data});}).catch(error=>{if(!controller.signal.aborted)failure=error;});
 return{entries,done,stop:()=>controller.abort(),async wait(predicate){for(let i=0;i<200;i++){if(failure)throw failure;if(predicate(entries))return;await delay(5);}throw new Error('Timed out waiting for SSE');}};
}

test('event broker isolates student ownership/source and shares both kinds with authorized reviewers',()=>{
 const events=createCertificationEvents({maxConnections:4,maxPerActor:1}),received=[[],[],[]];
 const owner={role:'student',reference:'student',source:'auth'};
 const stop=events.subscribe(owner,e=>received[0].push(e));
 events.subscribe({...owner,source:'development'},e=>received[1].push(e));
 events.subscribe({role:'reviewer',reference:'reviewer',source:'auth'},e=>received[2].push(e));
 assert.throws(()=>events.subscribe(owner,()=>{}),e=>e.statusCode===429);
 notifyCertificateChanged(events,'it',{Id:'ABC',ActorReference:owner.reference,ActorSource:owner.source,Status:'verified',VersionToken:'v1'});
 assert.equal(received[0].length,1);assert.equal(received[1].length,0);assert.equal(received[2].length,1);
 assert.deepEqual(Object.keys(received[0][0]),['kind','applicationId','status','rowVersion']);
 stop();events.closeAll();assert.equal(events.size,0);
});

test('SSE authenticates once, does no database polling, publishes committed review results for both modules and cleans up',async t=>{
 const events=createCertificationEvents({maxConnections:8,maxPerActor:2}),language=new MemoryRepository(),it=new MemoryItRepository(),storage=new MemoryStorage();
 let profileCalls=0,databaseCalls=0;
 const wrap=repo=>new Proxy(repo,{get(target,key){const value=target[key];return typeof value==='function'?function(...args){databaseCalls++;return value.apply(target,args);}:value;}});
 const config={...certificationConfig,events:{heartbeatMs:20,lifetimeMs:10000}};
 const inspectImage=async()=>({status:'needs_review',reasons:[]});
 const modules=createLocalCertificationsModules({events,language:{repository:wrap(language),storage,config,inspectImage},it:{repository:wrap(it),storage,config,inspectImage},
  authConfig:{nodeEnv:'test',devMode:true,reviewerOrigin:'http://localhost:5174'},studentContextProvider:async req=>{
   profileCalls++;const token=req.headers.authorization;
   if(!['Bearer a','Bearer b'].includes(token))throw new AppError('Invalid token',401);
   const studentCode=token==='Bearer a'?'102240377':'102240378';
   return{role:'student',source:'auth',reference:'dut:'+studentCode,studentCode,cohortYear:2024};}});
 const app=express();app.use(express.json());for(const m of Object.values(modules))app.use(m.basePath,m.router);app.use(errorHandler);
 const base=await listen(t,app);
 const streams=[];t.after(async()=>{for(const s of streams)s.stop();await Promise.all(streams.map(s=>s.done));events.closeAll();});
 const a=await collect(base+'/api/certifications/events',{headers:{Authorization:'Bearer a'}});streams.push(a);
 const b=await collect(base+'/api/certifications/events',{headers:{Authorization:'Bearer b'}});streams.push(b);
 await a.wait(es=>es.some(e=>e.event==='connected'));await delay(50);
 assert.equal(profileCalls,2);assert.equal(databaseCalls,0);
 async function request(path,{method='GET',body,auth='a',cookie,version,expected=200}={}){
  const response=await fetch(base+path,{method,headers:{...(auth?{Authorization:'Bearer '+auth}:{}),...(cookie?{cookie}:{}),
   ...(body?{'Content-Type':'application/json'}:{}),...(version?{'If-Match':'"'+version+'"'}:{})},...(body?{body:JSON.stringify(body)}:{})});
  const json=await response.json();assert.equal(response.status,expected,JSON.stringify(json));return{data:json.data,response};}
 await request('/api/certifications/events?studentCode=102240378',{expected:400});
 await request('/api/certifications/events',{auth:'invalid',expected:401});
 await request('/api/certifications/reviewer/events',{auth:null,expected:401});
 const login=await request('/api/certifications/reviewer/auth/login',{method:'POST',auth:null,body:{username:'admin',password:'123'}});
 const cookie=login.response.headers.get('set-cookie').split(';')[0];
 const reviewer=await collect(base+'/api/certifications/reviewer/events',{headers:{cookie}});streams.push(reviewer);
 const payload={data:{fullName:'Student',className:'24T1',certificateTypeId:1,issuedOn:'2026-01-01',result:{overall:5}},
  files:[{purpose:'general',fileName:'proof.png',contentType:'image/png',sizeBytes:4}]};
 const prepared=(await request('/api/certifications/applications',{method:'POST',body:payload,expected:201})).data;
 storage.objects.set(new URL(prepared.uploads[0].url).pathname.slice(1),Buffer.from('test'));
 let certificate=(await request('/api/certifications/applications/'+prepared.applicationId+'/complete',{method:'POST',body:{}})).data;
 const reviewPath='/api/certifications/reviewer/applications/'+certificate.id+'/review';
 certificate=(await request(reviewPath,{method:'POST',auth:null,cookie,version:certificate.rowVersion,
  body:{decision:'needs_changes',reason:'New image',verificationMethod:'other'}})).data;
 await a.wait(es=>es.some(e=>e.data.status==='needs_changes'));
 assert.equal(a.entries.find(e=>e.data.status==='needs_changes').data.rowVersion,certificate.rowVersion);
 const before=a.entries.filter(e=>e.event==='certificate.updated').length;
 await request(reviewPath,{method:'POST',auth:null,cookie,version:certificate.rowVersion,
  body:{decision:'verified',verificationMethod:'other'},expected:409});
 await delay(30);assert.equal(a.entries.filter(e=>e.event==='certificate.updated').length,before);
 const itPrepared=(await request('/api/it-certifications/applications',{method:'POST',expected:201,body:{data:{MaCC:'CNTT01',CoSoCapCC:'Issuer'},files:payload.files}})).data;
 storage.objects.set(new URL(itPrepared.uploads[0].url).pathname.slice(1),Buffer.from('test'));
 let itCertificate=(await request('/api/it-certifications/applications/'+itPrepared.applicationId+'/complete',{method:'POST',body:{}})).data;
 itCertificate=(await request('/api/it-certifications/reviewer/applications/'+itCertificate.id+'/review',{method:'POST',auth:null,cookie,version:itCertificate.rowVersion,
  body:{decision:'verified',verificationMethod:'other'}})).data;
 await a.wait(es=>es.some(e=>e.data.kind==='it'&&e.data.status==='verified'));
 await reviewer.wait(es=>es.some(e=>e.data.kind==='language')&&es.some(e=>e.data.kind==='it'));
 assert.equal(b.entries.filter(e=>e.event==='certificate.updated').length,0);
 for(const stream of streams)stream.stop();await Promise.all(streams.map(s=>s.done));
 for(let i=0;i<100&&events.size;i++)await delay(5);assert.equal(events.size,0);
});

test('SSE limits, lifetime and slow-reader cleanup do not retain subscriptions',async t=>{
 const events=createCertificationEvents({maxConnections:1,maxPerActor:1});
 const app=express();app.use((req,_res,next)=>{req.certificationActor={role:'student',source:'auth',reference:'student'};next();});
 app.get('/events',createCertificationEventsController(events,{events:{heartbeatMs:10,lifetimeMs:100}}));app.use(errorHandler);
 const base=await listen(t,app),stream=await collect(base+'/events');
 const limited=await fetch(base+'/events');assert.equal(limited.status,429);assert.equal(limited.headers.get('retry-after'),'10');
 await stream.done;assert.equal(events.size,0);
 const res=new EventEmitter();res.status=()=>res;res.set=()=>res;res.flushHeaders=()=>{};res.write=()=>false;
 res.destroy=()=>{res.destroyed=true;res.emit('close');};res.end=()=>res.emit('close');
 createCertificationEventsController(events)({body:{},query:{},certificationActor:{role:'student',source:'auth',reference:'student'}},res,e=>{throw e;});
 assert.equal(res.destroyed,true);assert.equal(events.size,0);
});

test('SSE client retries overload with backoff and stops after expired authentication',async()=>{
 let calls=0,expired=0;
 const realtime=createCertificationRealtime({url:'https://example.test/events',visibilityTarget:null,pageTarget:null,
  retryMs:5,maxRetryMs:10,random:()=>0,onAuthError:()=>{expired++;},fetchImpl:async()=>{
   calls++;return new Response('{}',{status:calls<3?429:401,headers:{'Content-Type':'application/json'}});
  }});
 realtime.start();await delay(60);assert.equal(calls,3);assert.equal(expired,1);realtime.stop();
});

test('SSE client parses fragmented frames and reconnects/resyncs after visibility changes without duplicate streams',async()=>{
 const encoder=new TextEncoder(),received=[];
 const body=new ReadableStream({start(c){for(const part of ['event: connec','ted\r\ndata: {}\r','\n\r\nevent: certificate.updated\ndata: {"kind":"it"}\n\n'])c.enqueue(encoder.encode(part));c.close();}});
 await readCertificationEvents(new Response(body),(event,data)=>received.push({event,data}));
 assert.deepEqual(received,[{event:'connected',data:{}},{event:'certificate.updated',data:{kind:'it'}}]);
 const target=new EventTarget();let visible=true,opens=0,syncs=0,aborts=0;
 const realtime=createCertificationRealtime({url:'https://example.test/events',visibilityTarget:target,pageTarget:new EventTarget(),isVisible:()=>visible,
  getHeaders:()=>({Authorization:'Bearer header-only'}),onSync:()=>{syncs++;},fetchImpl:async(url,options)=>{
   assert.equal(url.includes('header-only'),false);assert.equal(options.headers.Authorization,'Bearer header-only');opens++;
   return new Response(new ReadableStream({start(c){c.enqueue(encoder.encode('event: connected\ndata: {}\n\n'));
    options.signal.addEventListener('abort',()=>{aborts++;c.error(new DOMException('Abort','AbortError'));},{once:true});}}),{headers:{'Content-Type':'text/event-stream'}});
  }});
 realtime.start();realtime.start();await delay(5);assert.equal(opens,1);assert.equal(syncs,1);
 visible=false;target.dispatchEvent(new Event('visibilitychange'));await delay(5);assert.equal(aborts,1);
 visible=true;target.dispatchEvent(new Event('visibilitychange'));await delay(5);assert.equal(opens,2);assert.equal(syncs,2);
 realtime.stop();await delay(5);assert.equal(aborts,2);
});
