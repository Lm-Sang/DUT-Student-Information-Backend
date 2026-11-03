import assert from 'node:assert/strict';
import { test } from 'node:test';
import { scryptSync } from 'node:crypto';
import express from 'express';
import jwt from 'jsonwebtoken';
import { createServer } from 'node:http';
import { createAuthService } from '../services/auth.service.js';
import { createAuthStore } from '../stores/auth.store.js';
import { createAuthController } from '../controllers/auth.controller.js';
import { createAuthRouter } from '../routes/auth.routes.js';
import { verifyPassword, hashPassword } from '../services/password.service.js';
import { errorHandler } from '../../../shared/middlewares/error-handler.middleware.js';

const secret = 'test-only-shared-sso-key-at-least-32-bytes';
const password = 'fixture-password-long-enough';
const salt = 'ab'.repeat(16);
const legacyHash = `scrypt$${salt}$${scryptSync(password,salt,32).toString('hex')}`;
function fixture() {
  const config={nodeEnv:'test',jwt:{secret:'',shareSsoKey:true,issuer:'test-app',studentAudience:'test-student',adminAudience:'test-admin',staffAudience:'test-staff',expiresIn:'15m'},
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

test('shared decoded SSO key signs staff JWT while issuer, audience, type, channel and session separate privileges',async()=>{
 const f=fixture();try{
  const bundle=await f.service.loginWithPassword('staff',{username:'reviewer',password});
  const claims=jwt.verify(bundle.data.accessToken,secret,{algorithms:['HS256'],issuer:'test-app',audience:'test-staff'});
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
  await assert.rejects(()=>f.service.refreshSession('staff',b.refreshToken),e=>e.statusCode===401);
  await assert.rejects(()=>f.service.verifyToken(rotated.data.accessToken,'staff'),e=>e.statusCode===401);
  const next=await f.service.loginWithPassword('staff',{username:'reviewer',password});
  f.service.logoutSession('staff',next.refreshToken);
  await assert.rejects(()=>f.service.verifyToken(next.data.accessToken,'staff'),e=>e.statusCode===401);
 }finally{f.store.close();}
});

test('expired or tampered SSO is rejected and web refresh cannot extend the upstream SSO expiry',async()=>{
 const f=fixture();try{
  await assert.rejects(()=>f.service.exchangeToken('student',ssoToken().slice(0,-3)+'bad'),e=>e.statusCode===401);
  const expired=jwt.sign({unique_name:'123456789@sv.dut.udn.vn'},secret,{issuer:'test-sso',audience:'test-sso-client',expiresIn:-1});
  await assert.rejects(()=>f.service.exchangeToken('student',expired),e=>e.statusCode===401);
  const pending=await f.service.exchangeToken('student',ssoToken());const h=f.service.createHandoff('student',pending);const b=f.service.redeemHandoff('student',h.code,h.binding);
  f.advance(3600001);const refreshed=await f.service.refreshSession('student',b.refreshToken);
  await assert.rejects(()=>f.service.getSsoAccessToken(refreshed.data.accessToken),e=>e.statusCode===401);
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
  r=await fetch(base+'/logout',{method:'POST',headers:{Origin:'http://localhost:5173',Cookie:tokenCookie}});assert.equal(r.status,200);
  await assert.rejects(()=>f.service.verifyToken(data.data.accessToken,'staff'),e=>e.statusCode===401);
 }finally{await new Promise(resolve=>server.close(resolve));f.store.close();}
});
