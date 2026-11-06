import assert from 'node:assert/strict';
import {test} from 'node:test';
import {scryptSync} from 'node:crypto';
import express from 'express';
import {createServer} from 'node:http';
import {createAuthService} from '../../../src/common/auth/services/auth.service.js';
import {createAuthStore} from '../../../src/common/auth/stores/auth.store.js';
import {createAuthRepository} from '../../../src/common/auth/repositories/auth.repository.js';
import {createAuthController} from '../../../src/common/auth/controllers/auth.controller.js';
import {createAuthRouter} from '../../../src/common/auth/routes/auth.routes.js';
import {parsePasswordUpdate} from '../../../src/common/auth/dto/auth.request.dto.js';
import {verifyPassword} from '../../../src/common/auth/services/password.service.js';
import {AppError} from '../../../src/shared/errors/app-error.js';
import {errorHandler} from '../../../src/shared/middlewares/error-handler.middleware.js';

const password='old-test-password-123',next='new-test-password-456';
const salt='ab'.repeat(16),hash=`scrypt$${salt}$${scryptSync(password,salt,32).toString('hex')}`;
function fixture(t){
 const accounts=['reviewer','manager'].map(username=>({id:'cv:'+username,requestActorId:'cv:'+username,username,
  displayName:username,passwordHash:hash,channel:'staff',isActive:true,roles:[],permissions:username==='manager'?['rbac.staff.manage']:[],version:'v1',accountVersion:1}));
 const find=(field,value)=>{const a=accounts.find(a=>a[field]===value);return a?{...a,permissions:[...a.permissions]}:null;};
 const writes=[];let rejectWrite=false;
 const repository={findStaffByUsername:async value=>find('username',value),findStaffById:async value=>find('id',value),
  async updateStaffPassword(data){
   if(rejectWrite)throw new AppError('changed concurrently',409);
   const account=accounts.find(a=>a.id===data.account.id);assert.equal(account.passwordHash,data.account.passwordHash);
   writes.push(data);account.passwordHash=data.passwordHash;account.version='v'+(++account.accountVersion);
  }};
 const store=createAuthStore();t.after(()=>store.close());
 const config={nodeEnv:'test',jwt:{shareSsoKey:true,issuer:'password-test-app',studentAudience:'student',staffAudience:'staff',adminAudience:'admin',expiresIn:'15m'},
  microsoftSso:{jwtSecret:'password-test-key-with-at-least-32-bytes'},auth:{refreshTtlSeconds:3600}};
 const service=createAuthService({config,repository,store});
 const login=async(username='reviewer',value=password)=>service.loginWithPassword('staff',{username,password:value});
 const claims=async bundle=>service.verifyToken(bundle.data.accessToken,'staff');
 return {accounts,service,store,writes,login,claims,rejectWrite:()=>rejectWrite=true};
}

test('self change requires current password and a different strong password without accepting target IDs',async t=>{
 const f=fixture(t),bundle=await f.login(),claims=await f.claims(bundle);
 for(const body of [{currentPassword:'wrong',newPassword:next},{currentPassword:password,newPassword:password},
  {currentPassword:password,newPassword:'short'},{currentPassword:password,newPassword:next,targetId:'cv:manager'}]) {
  await assert.rejects(()=>f.service.updateStaffPassword(claims,body),e=>e.statusCode===400);
 }
 assert.equal(f.writes.length,0);assert.equal((await f.claims(bundle)).localUserId,'cv:reviewer');
});

test('self change stores a modern hash and revokes every old access and refresh session',async t=>{
 const f=fixture(t),one=await f.login(),two=await f.login();
 const result=await f.service.updateStaffPassword(await f.claims(one),{currentPassword:password,newPassword:next});
 assert.equal(result.requiresLogin,true);assert.match(f.accounts[0].passwordHash,/^scrypt\$131072\$/);
 assert(await verifyPassword(next,f.accounts[0].passwordHash));
 for(const bundle of [one,two]){
  await assert.rejects(()=>f.claims(bundle),e=>e.statusCode===401);
  await assert.rejects(()=>f.service.refreshSession('staff',bundle.refreshToken),e=>e.statusCode===401);
 }
 await assert.rejects(()=>f.login(),e=>e.statusCode===401);assert.equal((await f.login('reviewer',next)).data.channel,'staff');
});

test('reset requires current DB management permission and revokes target sessions while preserving manager session',async t=>{
 const f=fixture(t),target=await f.login(),manager=await f.login('manager'),managerClaims=await f.claims(manager);
 await assert.rejects(()=>f.service.updateStaffPassword({channel:'student',authMethod:'sso'},{newPassword:next},{targetId:'cv:manager'}),e=>e.statusCode===403);
 await assert.rejects(async()=>f.service.updateStaffPassword(await f.claims(target),{newPassword:next},{targetId:'cv:manager'}),e=>e.statusCode===403);
 await assert.rejects(()=>f.service.updateStaffPassword(managerClaims,{newPassword:next},{targetId:'cv:manager'}),e=>e.statusCode===400);
 await assert.rejects(()=>f.service.updateStaffPassword(managerClaims,{newPassword:next},{targetId:'cv:missing'}),e=>e.statusCode===404);
 const result=await f.service.updateStaffPassword(managerClaims,{newPassword:next},{targetId:'cv:reviewer'});
 assert.equal(result.requiresLogin,true);await assert.rejects(()=>f.claims(target),e=>e.statusCode===401);
 await assert.rejects(()=>f.service.refreshSession('staff',target.refreshToken),e=>e.statusCode===401);
 assert.equal((await f.claims(manager)).localUserId,'cv:manager');assert(f.writes[0].reset);
 f.accounts[1].permissions=[];f.accounts[1].version='revoked';
 await assert.rejects(()=>f.service.updateStaffPassword(managerClaims,{newPassword:next},{targetId:'cv:reviewer'}),e=>e.statusCode===401);
});

test('failed concurrent password updates do not revoke a still-valid session',async t=>{
 const f=fixture(t),bundle=await f.login();f.rejectWrite();
 await assert.rejects(async()=>f.service.updateStaffPassword(await f.claims(bundle),{currentPassword:password,newPassword:next}),e=>e.statusCode===409);
 assert.equal((await f.claims(bundle)).localUserId,'cv:reviewer');assert.equal(f.accounts[0].passwordHash,hash);
});

test('password update DTO rejects arrays, missing old passwords, extra fields and oversized input',()=>{
 for(const body of [null,[],{newPassword:next},{currentPassword:password,newPassword:'x'.repeat(129)},
  {currentPassword:password,newPassword:next+'\0'},{currentPassword:password,newPassword:next,permissions:['admin']}])assert.throws(()=>parsePasswordUpdate(body));
 assert.deepEqual(parsePasswordUpdate({newPassword:next},{reset:true}),{newPassword:next});
});

test('SQL password mutation checks loopback, live permissions and compare-and-swap inside the audited transaction',async()=>{
 let statement,parameters,guarded=0;
 const repository=createAuthRepository({guard:()=>guarded++,query:async(sql,params)=>{statement=sql;parameters=params;return{};}});
 const actor={id:'cv:manager',accountVersion:4,passwordHash:'old-manager-hash'},account={id:'cv:reviewer',passwordHash:'old-target-hash'};
 await repository.updateStaffPassword({actor,account,passwordHash:'new-target-hash',reset:true});
 assert.equal(guarded,1);assert(statement.includes('DB_NAME()')); // The executor owns the TypeORM transaction.
 assert(statement.includes('UPDLOCK,HOLDLOCK'));assert(statement.includes("MaQuyen='rbac.staff.manage'"));
 assert(statement.includes('c.MatKhauBam=?'));assert(statement.includes('LichSuRBAC'));assert(!statement.includes('new-target-hash'));
 assert.equal(parameters.at(-2),'RESET_PASSWORD');assert(!parameters.at(-1).includes('hash'));
 const denied=createAuthRepository({guard:()=>{throw Error('wrong DB');},query:()=>assert.fail('must not query')});
 await assert.rejects(()=>denied.updateStaffPassword({actor,account,passwordHash:'hash'}),/wrong DB/);
});

test('HTTP password routes require JWT and frontend Origin; successful self change clears refresh cookie',async t=>{
 const f=fixture(t),app=express();
 for(const channel of ['staff','student'])app.use('/api/'+channel+'/auth',createAuthRouter(channel,createAuthController(channel,f.service,{frontendOrigin:'http://localhost:5173'}),f.service));
 app.use(errorHandler);const server=createServer(app);await new Promise(r=>server.listen(0,'127.0.0.1',r));
 t.after(()=>new Promise(r=>{server.close(r);server.closeAllConnections();}));
 const bundle=await f.login(),token=bundle.data.accessToken;
 const call=(path,{authorization='Bearer '+token,origin='http://localhost:5173',body={currentPassword:password,newPassword:next}}={})=>fetch('http://127.0.0.1:'+server.address().port+path,
  {method:'POST',headers:{Authorization:authorization,Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
 assert.equal((await call('/api/staff/auth/change-password',{authorization:''})).status,401);
 assert.equal((await call('/api/staff/auth/change-password',{origin:'http://evil.test'})).status,403);
 assert.equal((await call('/api/student/auth/change-password')).status,404);
 assert.equal((await call('/api/staff/auth/accounts/cv:manager/reset-password',{body:{newPassword:next}})).status,403);
 const response=await call('/api/staff/auth/change-password');assert.equal(response.status,200);
 assert.match(response.headers.get('set-cookie'),/dut_web_staff_refresh=;.*Expires=Thu, 01 Jan 1970/);
 const text=await response.text();assert(!text.includes(next));assert(!text.includes('passwordHash'));
});
