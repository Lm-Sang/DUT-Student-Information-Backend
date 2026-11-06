import assert from 'node:assert/strict';
import { test } from 'node:test';
import { scryptSync } from 'node:crypto';
import express from 'express';
import jwt from 'jsonwebtoken';
import { createServer } from 'node:http';
import { createAuthService } from '../../../src/common/auth/services/auth.service.js';
import { createAuthStore } from '../../../src/common/auth/stores/auth.store.js';
import { createAuthController } from '../../../src/common/auth/controllers/auth.controller.js';
import { createAuthRouter } from '../../../src/common/auth/routes/auth.routes.js';
import { verifyPassword, hashPassword } from '../../../src/common/auth/services/password.service.js';
import { errorHandler } from '../../../src/shared/middlewares/error-handler.middleware.js';
import { createSsoTokenResolver } from '../../../src/common/auth/middlewares/auth.middleware.js';
import { createDutStudentContext } from '../../../src/common/students/index.js';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const secret = 'test-only-shared-sso-key-at-least-32-bytes';
const appSecret = 'test-only-independent-app-key-at-least-32-bytes';
const password = 'fixture-password-long-enough-1';
const salt = 'ab'.repeat(16);
const legacyHash = `scrypt$${salt}$${scryptSync(password,salt,32).toString('hex')}`;
function fixture() {
  const config={nodeEnv:'test',jwt:{secret:appSecret,shareSsoKey:false,issuer:'test-app',studentAudience:'test-student',adminAudience:'test-admin',staffAudience:'test-staff',expiresIn:'15m'},
    microsoftSso:{jwtSecret:Buffer.from(secret).toString('base64'),jwtSecretEncoding:'base64',jwtIssuer:'test-sso',jwtAudience:'test-sso-client',allowMissingAudience:false,
      baseUrl:'http://sso.example.test',loginPath:'/microsoft/login',logoutPath:'/microsoft/logout',studentCallbackUrl:'http://localhost:3003/api/student/auth/microsoft/callback',studentFrontendCallbackUrl:'http://localhost:5173/auth-callback.html'},
    app:{url:'http://localhost:3003',studentFrontendUrl:'http://localhost:5173',adminFrontendUrl:'http://localhost:5173'},auth:{refreshTtlSeconds:604800,stateTtlMs:600000,handoffTtlMs:60000}};
  let clock=Date.now();
  const account={id:'cv:test',requestActorId:'cv:test',username:'reviewer',displayName:'Test specialist',passwordHash:legacyHash,channel:'staff',isActive:true,roles:['reviewer'],permissions:['requests.view'],version:'v1'};
  const repository={findStaffByUsername:async name=>name==='reviewer'?{...account}:null,findStaffById:async id=>id===account.id?{...account}:null,
    findLocalByUsername:async()=>null,findLocalById:async()=>null};
  const store=createAuthStore({filename:':memory:',now:()=>clock});
  const service=createAuthService({config,repository,store,now:()=>clock});
  return {config,account,store,service,advance:ms=>clock+=ms};
}
const ssoToken=()=>jwt.sign({unique_name:'123456789@sv.dut.udn.vn',name:'Student'},secret,{algorithm:'HS256',issuer:'test-sso',audience:'test-sso-client',subject:'student-1',expiresIn:3600});

test('raw student SSO works without backend JWT configuration and never trusts SSO privileges',async()=>{
 const f=fixture();f.config.jwt={};
 const token=jwt.sign({unique_name:'123456789@sv1.dut.udn.vn',roles:['admin'],permissions:['*'],organization:{accessLevel:'super_admin'},sid:'untrusted'},secret,{algorithm:'HS256',expiresIn:600});
 try{
  const claims=await f.service.verifyToken(token,'student');
  assert.equal(claims.authMethod,'sso');assert.deepEqual(claims.roles,['student']);assert.deepEqual(claims.permissions,[]);
  assert.equal(claims.organization,null);assert.equal(claims.sid,null);
  assert.equal(await f.service.getSsoAccessToken(token),token);
  const pending=await f.service.exchangeToken('student',token),h=f.service.createHandoff('student',pending);
  assert.equal(f.service.redeemHandoff('student',h.code,h.binding).data.accessToken,token);
  for(const invalid of [jwt.sign({unique_name:'student'},secret,{algorithm:'HS256'}),
   jwt.sign({unique_name:'student'},secret,{algorithm:'HS384',expiresIn:600}),
   jwt.sign({unique_name:'student'},'wrong-key',{expiresIn:600}),
   jwt.sign({unique_name:'student'},secret,{expiresIn:600,notBefore:60})]){
    await assert.rejects(()=>f.service.verifyToken(invalid,'student'),e=>e.statusCode===401);
  }
 }finally{f.store.close();}
});

test('local JWTs require an independent key and work even when SSO is not configured',async()=>{
 const f=fixture();try{
  f.config.jwt.shareSsoKey=true;
  await assert.rejects(()=>f.service.loginWithPassword('staff',{username:'reviewer',password}),e=>e.statusCode===503);
  f.config.jwt.shareSsoKey=false;f.config.jwt.secret=secret;
  await assert.rejects(()=>f.service.loginWithPassword('staff',{username:'reviewer',password}),e=>e.statusCode===503);
  f.config.jwt.secret=appSecret;f.config.microsoftSso={};
  const bundle=await f.service.loginWithPassword('staff',{username:'reviewer',password});
  assert.equal((await f.service.verifyToken(bundle.data.accessToken,'staff')).channel,'staff');
 }finally{f.store.close();}
});

test('student profile forwards the exact verified SSO token and enforces signed profile identity',async()=>{
 const f=fixture(),forwarded=[];
 const context=createDutStudentContext({ssoTokenResolver:createSsoTokenResolver(f.service),fetchImpl:async(_url,options)=>{
  forwarded.push(options.headers.Authorization);return {ok:true,status:200,json:async()=>({data:{studentCardNumber:'123456789',fullName:'Profile student'}})};
 }});
 const token=jwt.sign({unique_name:'123456789@sv1.dut.udn.vn',studentCode:'123456789'},secret,{expiresIn:600});
 try{
  assert.equal((await context({headers:{authorization:'Bearer '+token}})).studentCode,'123456789');
  assert.deepEqual(forwarded,['Bearer '+token]);
  const mismatch=jwt.sign({unique_name:'123456789@sv1.dut.udn.vn',studentCode:'000000001'},secret,{expiresIn:600});
  await assert.rejects(()=>context({headers:{authorization:'Bearer '+mismatch}}),e=>e.statusCode===403);
  f.service.revokeSession('student',await f.service.verifyToken(token,'student'));
  await assert.rejects(()=>context({headers:{authorization:'Bearer '+token}}),e=>e.statusCode===401);
  assert.equal(forwarded.length,2);
 }finally{f.store.close();}
});

test('student HTTP logout rejects the SSO token afterwards even when a legacy refresh cookie exists',async()=>{
 const f=fixture(),app=express();
 app.use('/api/student/auth',createAuthRouter('student',createAuthController('student',f.service,{frontendOrigin:'http://localhost:5173'}),f.service));app.use(errorHandler);
 const server=createServer(app);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}/api/student/auth`;
 const token=ssoToken(),headers={Authorization:'Bearer '+token,Origin:'http://localhost:5173',Cookie:'dut_web_student_refresh=legacy-token'};
 try{
  assert.equal((await fetch(base+'/me',{headers})).status,200);
  const logout=await fetch(base+'/logout',{method:'POST',headers});assert.equal(logout.status,200);
  const data=(await logout.json()).data;assert.equal(new URL(data.url).origin,'http://sso.example.test');assert.equal(data.clearLocalToken,true);
  assert(logout.headers.getSetCookie().some(c=>c.startsWith('dut_web_student_refresh=;')));
  assert.equal((await fetch(base+'/me',{headers})).status,401);
  await assert.rejects(()=>f.service.getSsoAccessToken(token),e=>e.statusCode===401);
  assert.equal((await fetch(base+'/refresh',{method:'POST',headers})).status,403);
 }finally{await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});f.store.close();}
});

test('student logout survives restart and is shared by workers using the same SQLite store',async()=>{
 const f=fixture(),directory=mkdtempSync(join(tmpdir(),'dut-auth-test-')),filename=join(directory,'auth.sqlite');
 const first=createAuthStore({filename}),second=createAuthStore({filename});
 const service=createAuthService({config:f.config,store:first}),worker=createAuthService({config:f.config,store:second});
 const token=ssoToken();
 try{
  await worker.verifyToken(token,'student');
  const claims=await service.verifyToken(token,'student');service.revokeSession('student',claims);
  service.revokeSession('student',claims);
  await assert.rejects(()=>worker.verifyToken(token,'student'),e=>e.statusCode===401);
  first.close();second.close();
  await assert.rejects(()=>service.verifyToken(token,'student'),e=>e.statusCode===401);
 }finally{first.close();second.close();f.store.close();rmSync(directory,{recursive:true,force:true});}
});

test('legacy SSO needs only a valid signature and expiry; issuer/audience configuration is not required',async()=>{
 const f=fixture();delete f.config.microsoftSso.jwtIssuer;delete f.config.microsoftSso.jwtAudience;
 try{
  const claims={unique_name:'123456789@sv.dut.udn.vn',name:'Student'};
  const token=jwt.sign(claims,secret,{algorithm:'HS256',subject:'student-1',expiresIn:3600});
  assert.equal((await f.service.exchangeToken('student',token)).authMethod,'sso');
  assert.equal((await f.service.loginWithPassword('staff',{username:'reviewer',password})).data.channel,'staff');
  await assert.rejects(()=>f.service.exchangeToken('student',jwt.sign(claims,'wrong-key',{algorithm:'HS256',expiresIn:3600})),e=>e.statusCode===401);
  await assert.rejects(()=>f.service.exchangeToken('student',jwt.sign(claims,secret,{algorithm:'HS256',expiresIn:-1})),e=>e.statusCode===401);
  const staff=await f.service.loginWithPassword('staff',{username:'reviewer',password});
  await assert.rejects(()=>f.service.exchangeToken('student',staff.data.accessToken),e=>e.statusCode===401);
 }finally{f.store.close();}
});

test('independent backend key signs staff JWT; issuer, audience, type, channel and session separate privileges',async()=>{
 const f=fixture();try{
  const bundle=await f.service.loginWithPassword('staff',{username:'reviewer',password});
  const claims=jwt.verify(bundle.data.accessToken,appSecret,{algorithms:['HS256'],issuer:'test-app',audience:'test-staff'});
  assert.throws(()=>jwt.verify(bundle.data.accessToken,secret,{algorithms:['HS256']}));
  assert.equal(claims.channel,'staff');assert.equal(claims.tokenUse,'access');assert.equal(jwt.decode(bundle.data.accessToken,{complete:true}).header.typ,'at+jwt');
  const user=await f.service.verifyToken(bundle.data.accessToken,'staff');assert.equal(user.identity.requestActorId,'cv:test');assert.deepEqual(user.permissions,['requests.view']);
  await assert.rejects(()=>f.service.verifyToken(ssoToken(),'staff'),e=>e.statusCode===401);
  await assert.rejects(()=>f.service.verifyToken(bundle.data.accessToken,'student'),e=>e.statusCode===401);
  await assert.rejects(()=>f.service.verifyToken(bundle.refreshToken,'staff'),e=>e.statusCode===401);
  await assert.rejects(()=>f.service.refreshSession('staff',bundle.data.accessToken),e=>e.statusCode===401);
  await assert.rejects(()=>f.service.getSsoAccessToken(bundle.data.accessToken,'staff'),e=>e.statusCode===403);
 }finally{f.store.close();}
});

test('student SSO keeps verified identity; password login and SSO admin/staff elevation are rejected',async()=>{
 const f=fixture();try{
  await assert.rejects(()=>f.service.loginWithPassword('student',{username:'reviewer',password}),e=>e.statusCode===403);
  await assert.rejects(()=>f.service.exchangeToken('staff',ssoToken()),e=>e.statusCode===403);
  const pending=await f.service.exchangeToken('student',ssoToken());
  const handoff=f.service.createHandoff('student',pending);
  assert.throws(()=>f.service.redeemHandoff('student',handoff.code,'0'.repeat(64)),e=>e.statusCode===401);
  const result=f.service.redeemHandoff('student',handoff.code,handoff.binding);
  assert.equal(result.data.accessToken,ssoToken());assert.equal(result.refreshToken,undefined);
  assert.equal(result.data.refreshExpiresAt,null);
  assert.throws(()=>f.service.redeemHandoff('student',handoff.code,handoff.binding),e=>e.statusCode===401);
  const claims=await f.service.verifyToken(result.data.accessToken,'student');assert.deepEqual(claims.roles,['student']);assert.deepEqual(claims.permissions,[]);
  assert.equal(await f.service.getSsoAccessToken(result.data.accessToken),ssoToken());
 }finally{f.store.close();}
});

test('staff permissions/password versions and disabled accounts invalidate active JWT and refresh immediately',async()=>{
 for(const mutate of [a=>a.version='v2',a=>a.isActive=false]){
  const f=fixture();try{const b=await f.service.loginWithPassword('staff',{username:'reviewer',password});mutate(f.account);
   await assert.rejects(()=>f.service.verifyToken(b.data.accessToken,'staff'),e=>e.statusCode===401);
   await assert.rejects(()=>f.service.refreshSession('staff',b.refreshToken),e=>e.statusCode===401);
  }finally{f.store.close();}
 }
});

test('refresh rotates once, detects replay and logout revokes access tokens',async()=>{
 const f=fixture();try{
  const b=await f.service.loginWithPassword('staff',{username:'reviewer',password});
  const rotated=await f.service.refreshSession('staff',b.refreshToken);assert.notEqual(rotated.refreshToken,b.refreshToken);
  await assert.rejects(()=>f.service.refreshSession('staff',b.refreshToken),e=>e.statusCode===409);
  await f.service.verifyToken(rotated.data.accessToken,'staff');
  f.advance(5001);
  await assert.rejects(()=>f.service.refreshSession('staff',b.refreshToken),e=>e.statusCode===401);
  await assert.rejects(()=>f.service.verifyToken(rotated.data.accessToken,'staff'),e=>e.statusCode===401);
  const next=await f.service.loginWithPassword('staff',{username:'reviewer',password});
  f.service.logoutSession('staff',next.refreshToken);
  await assert.rejects(()=>f.service.verifyToken(next.data.accessToken,'staff'),e=>e.statusCode===401);
 }finally{f.store.close();}
});

test('student token is the upstream SSO token and has no backend refresh lifetime',async()=>{
 const f=fixture();try{
  await assert.rejects(()=>f.service.exchangeToken('student',ssoToken().slice(0,-3)+'bad'),e=>e.statusCode===401);
  const expired=jwt.sign({unique_name:'123456789@sv.dut.udn.vn'},secret,{issuer:'test-sso',audience:'test-sso-client',expiresIn:-1});
  await assert.rejects(()=>f.service.exchangeToken('student',expired),e=>e.statusCode===401);
  const pending=await f.service.exchangeToken('student',ssoToken());const h=f.service.createHandoff('student',pending);const b=f.service.redeemHandoff('student',h.code,h.binding);
  assert.equal(b.data.accessToken,ssoToken());
  await assert.rejects(()=>f.service.refreshSession('student',b.data.accessToken),e=>e.statusCode===403);
  f.advance(3600001);
  await assert.rejects(()=>f.service.verifyToken(b.data.accessToken,'student'),e=>e.statusCode===401);
  await assert.rejects(()=>f.service.getSsoAccessToken(b.data.accessToken),e=>e.statusCode===401);
 }finally{f.store.close();}
});

test('password hashes support legacy staff and modern scrypt without accepting malformed hashes',async()=>{
 assert.equal(await verifyPassword(password,legacyHash),true);assert.equal(await verifyPassword('wrong',legacyHash),false);
 const modern=await hashPassword(password);assert.equal(await verifyPassword(password,modern),true);assert.equal(await verifyPassword(password,'malformed'),false);
});

test('staff login requires frontend Origin; refresh cookie stays HttpOnly and token is absent from JSON',async()=>{
 const f=fixture();const app=express();app.use(express.json());
 app.use('/api/staff/auth',createAuthRouter('staff',createAuthController('staff',f.service,{frontendOrigin:'http://localhost:5173'}),f.service));app.use(errorHandler);
 const server=createServer(app);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}/api/staff/auth`;
 try{
  const body=JSON.stringify({username:'reviewer',password});
  let r=await fetch(base+'/login',{method:'POST',headers:{'Content-Type':'application/json'},body});assert.equal(r.status,403);
  r=await fetch(base+'/login',{method:'POST',headers:{'Content-Type':'application/json',Origin:'http://localhost:5173'},body});assert.equal(r.status,200);
  const cookie=r.headers.get('set-cookie');assert.match(cookie,/dut_web_staff_refresh=/);assert.match(cookie,/HttpOnly/);assert.match(cookie,/SameSite=Lax/);
  const data=await r.json();assert(!data.data.refreshToken);assert(data.data.accessToken);
  const tokenCookie=cookie.split(';')[0];
  r=await fetch(base+'/refresh',{method:'POST',headers:{'Content-Type':'application/json',Origin:'http://attacker.test',Cookie:tokenCookie},body:'{}'});assert.equal(r.status,403);
  const concurrent=await Promise.all([1,2].map(()=>fetch(base+'/refresh',{method:'POST',headers:{Origin:'http://localhost:5173',Cookie:tokenCookie}})));
  assert.deepEqual(concurrent.map(response=>response.status).sort(),[200,409]);
  const conflict=concurrent.find(response=>response.status===409);
  assert.equal(conflict.headers.get('set-cookie'),null);assert.equal(conflict.headers.get('retry-after'),'1');
  assert.equal((await conflict.json()).details.code,'REFRESH_ALREADY_ROTATED');
  await f.service.verifyToken(data.data.accessToken,'staff');
  r=await fetch(base+'/logout',{method:'POST',headers:{Origin:'http://localhost:5173',Cookie:tokenCookie}});assert.equal(r.status,200);
  await assert.rejects(()=>f.service.verifyToken(data.data.accessToken,'staff'),e=>e.statusCode===401);
 }finally{await new Promise(resolve=>server.close(resolve));f.store.close();}
});

test('SSO callbacks bind state in the path or query and reject missing state, mismatch and replay',async()=>{
 const f=fixture(),app=express();app.use(express.json());
 app.use('/api/student/auth',createAuthRouter('student',createAuthController('student',f.service,{frontendOrigin:'http://localhost:5173'}),f.service));app.use(errorHandler);
 const server=createServer(app);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}/api/student/auth`;
 const begin=async()=>{const r=await fetch(base+'/microsoft/login',{redirect:'manual'});assert.equal(r.status,302);const callback=new URL(new URL(r.headers.get('location')).searchParams.get('callbackUrl'));return{state:callback.pathname.split('/').at(-1),cookie:r.headers.get('set-cookie').split(';')[0]};};
 const callback=async(attempt,extra,pathState)=>fetch(base+'/microsoft/callback'+(pathState?'/'+pathState:'')+'?'+new URLSearchParams({accessToken:ssoToken(),...extra}),{redirect:'manual',headers:attempt?{Cookie:attempt.cookie}:{}});
 try{
  for(const withState of [true,false]){
   const attempt=await begin();const r=await callback(attempt,withState?{state:attempt.state}:{},withState?undefined:attempt.state);assert.equal(r.status,303);
   const redirect=new URL(r.headers.get('location'));assert.match(redirect.hash,/^#code=[a-f0-9]{64}$/);assert(!redirect.href.includes('accessToken'));
   const binding=r.headers.getSetCookie().find(c=>c.startsWith('dut_sso_student_handoff=')).split(';')[0];
   const redeem=await fetch(base+'/session',{method:'POST',headers:{Origin:'http://localhost:5173','Content-Type':'application/json',Cookie:binding},body:JSON.stringify({code:redirect.hash.slice(6)})});assert.equal(redeem.status,200);const data=(await redeem.json()).data;assert.equal(data.channel,'student');assert.equal(data.accessToken,ssoToken());assert.equal(data.refreshExpiresAt,null);
   assert(!redeem.headers.getSetCookie().some(c=>/^dut_web_student_refresh=[^;]+;/.test(c)));
   assert.equal((await callback(attempt,withState?{state:attempt.state}:{},withState?undefined:attempt.state)).status,401);
  }
  const mismatch=await begin();assert.equal((await callback(mismatch,{state:'0'.repeat(64)})).status,401);
  assert.equal((await callback(null,{})).status,401);
  const missing=await begin();assert.equal((await callback(missing,{})).status,401);
  const wrongPath=await begin();assert.equal((await callback(wrongPath,{},'0'.repeat(64))).status,401);
  const duplicate=await begin();const r=await fetch(base+'/microsoft/callback?'+new URLSearchParams({accessToken:ssoToken(),state:duplicate.state})+'&state='+duplicate.state,{headers:{Cookie:duplicate.cookie},redirect:'manual'});assert.equal(r.status,401);
 }finally{await new Promise(resolve=>{server.close(resolve);server.closeAllConnections();});f.store.close();}
});
