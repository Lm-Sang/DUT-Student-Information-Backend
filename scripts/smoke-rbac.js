import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {queryLocalDatabase as query,disconnectLocalDatabase} from '../src/infrastructure/database/local-sql-server.js';
import {cleanupRequests} from './lib/cleanup-requests.js';
import {cleanupRbacFixtures} from './lib/cleanup-rbac-fixtures.js';
const base='http://127.0.0.1:3003/api/demo/student-requests',suffix=randomUUID().slice(0,8),roles=[],actors=[],requests=[];
let checks=0;
async function call(path,token,body,method=body?'POST':'GET',expected=200){const response=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});const result=await response.json();assert.equal(response.status,expected,path+': '+JSON.stringify(result));checks++;return result.data;}
const demo=id=>call('/session',null,{actorId:id}).then(s=>s.token);
async function role(admin,label,permissions){const r=await call('/admin/roles',admin,{name:'QA RBAC '+suffix+' '+label,description:'Isolated integration fixture',permissions,active:true},'POST',201);roles.push(r.id);return r;}
async function account(admin,label,roleIds){const username='qa-rbac-'+suffix+'-'+label,password='QA-local-'+randomUUID();const a=await call('/admin/staff',admin,{username,password,name:'QA RBAC '+label,department:'CTSV',roleIds},'POST',201);actors.push(a.id);assert(!JSON.stringify(a).includes(password));assert(!a.passwordHash);return{...a,username,password};}
const current=(admin,id)=>call('/admin/staff',admin).then(r=>r.staff.find(p=>p.id===id));
const detail=(token,r)=>call('/requests/'+r.id,token);
async function create(student,typeCode='DonSV01'){const payload=typeCode==='CONFIRMATION'?{documentCode:'01',quantity:1,feeMode:'PAID',serviceSpeed:'NORMAL',additionalInfo:'QA RBAC only'}:{reasonCode:'LOST_OR_DAMAGED'};const r=await call('/requests',student,{typeCode,payload,idempotencyKey:randomUUID()},'POST',201);requests.push(r.id);return r;}
const command=(token,r,action,status=200)=>call('/requests/'+r.id+'/actions',token,{action,version:r.version,idempotencyKey:randomUUID()},'POST',status);
try{
 const admin=await demo('admin-demo'),student=await demo('student-a');
 const original=await call('/admin/staff',admin);assert(original.roles.some(r=>r.id.startsWith('legacy:')));
 const basic=['requests.view','requests.receive','requests.print','requests.complete','requests.cancel','workbook.export','workbook.import'];
 assert(original.permissions.every(p=>!basic.includes(p.key)));assert.equal(original.defaultPermissions.length,7);
 await call('/admin/roles',student,{name:'Invalid',permissions:[],active:true},'POST',403);
 await call('/admin/roles',admin,{name:'Invalid',permissions:['root.*'],active:true},'POST',400);
 const paperScope=await role(admin,'paper scope',['work:DonSV01']);
 const confirmationScope=await role(admin,'confirmation scope',['work:CONFIRMATION:01']);
 assert.deepEqual(paperScope.permissions,['work:DonSV01']);
 await call('/admin/roles',admin,{name:paperScope.name,description:'',permissions:[],active:true},'POST',409);
 const a=await account(admin,'a',[paperScope.id]),b=await account(admin,'b',[paperScope.id]),empty=await account(admin,'empty',[]);
 assert.equal(a.identitySource,'LOCAL');assert.equal(a.role,'STAFF');assert(basic.every(key=>a.permissions.includes(key)));
 assert(basic.every(key=>empty.permissions.includes(key)));assert.deepEqual(empty.workPermissions,[]);
 assert(!(await call('/actors')).some(p=>p.id===a.id));await call('/session',null,{actorId:a.id},'POST',401);
 await call('/staff/session',null,{username:a.username,password:'wrong-password'},'POST',401);
 const login=await call('/staff/session',null,{username:a.username,password:a.password}),token=login.token;
 assert(login.actor.permissions.includes('requests.receive'));assert(!JSON.stringify(login).includes('scrypt$'));
 await call('/admin/staff',token,undefined,'GET',403);
 await call('/admin/staff',admin,{username:'qa-rbac-'+suffix+'-bad',password:'short',name:'QA',department:'CTSV',roleIds:[]},'POST',400);
 let first=await create(student);first=await command(token,first,'receive');assert(first.actions.includes('complete'));
 const exportFile=(r=first)=>fetch(base+'/workbook/export',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({ids:[r.id]})});
 assert.equal((await exportFile()).status,200);checks++;
 let printed=await fetch(base+'/requests/'+first.id+'/print',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({version:first.version,idempotencyKey:randomUUID()})});assert.equal(printed.status,403);checks++;
 let confirmation=await create(student,'CONFIRMATION');await call('/requests/'+confirmation.id,token,undefined,'GET',404);
 let person=await current(admin,a.id);await call('/admin/staff/'+a.id+'/roles',admin,{version:person.permissionVersion,roleIds:[paperScope.id,confirmationScope.id]},'PUT');
 await call('/admin/staff/'+a.id+'/roles',admin,{version:person.permissionVersion,roleIds:[]},'PUT',409);
 const refreshed=await call('/me',token);assert(basic.every(key=>refreshed.permissions.includes(key)));assert.equal(refreshed.roles.length,2);assert(refreshed.workPermissions.includes('CONFIRMATION:01'));
 confirmation=await command(token,confirmation,'receive');
 printed=await fetch(base+'/requests/'+confirmation.id+'/print',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({version:confirmation.version,idempotencyKey:randomUUID()})});assert.equal(printed.status,200);await printed.arrayBuffer();checks++;
 confirmation=await detail(token,confirmation);assert(confirmation.printedAt);
 let scope=await call('/admin/roles/'+confirmationScope.id,admin,{name:confirmationScope.name,description:'Remove scope while session stays open',permissions:[],active:true,version:confirmationScope.version},'PUT');
 assert.equal((await exportFile(confirmation)).status,403);checks++;assert(!(await call('/me',token)).workPermissions.includes('CONFIRMATION:01'));
 await command(token,confirmation,'result',403);
 await call('/admin/roles/'+confirmationScope.id,admin,{name:scope.name,description:'',permissions:[],active:true,version:1},'PUT',409);
 const history=await call('/admin/roles/'+confirmationScope.id+'/history',admin);assert.equal(history.length,2);assert(history.find(h=>h.version===1).permissions.includes('work:CONFIRMATION:01'));assert.deepEqual(history.find(h=>h.version===2).permissions,[]);
 scope=await call('/admin/roles/'+confirmationScope.id,admin,{name:scope.name,description:'Restore scope',permissions:['work:CONFIRMATION:01'],active:true,version:scope.version},'PUT');
 confirmation=await command(token,confirmation,'result');assert.equal(confirmation.status,'COMPLETED');
 let paperRole=await call('/admin/roles/'+paperScope.id,admin,{name:paperScope.name,description:'Temporarily disabled',permissions:paperScope.permissions,active:false,version:paperScope.version},'PUT');
 let me=await call('/me',token);assert(basic.every(key=>me.permissions.includes(key)));assert(!me.workPermissions.includes('DonSV01'));await command(token,first,'complete',403);
 paperRole=await call('/admin/roles/'+paperScope.id,admin,{name:paperRole.name,description:'Restored',permissions:paperRole.permissions,active:true,version:paperRole.version},'PUT');
 first=await command(token,first,'complete');assert.equal(first.status,'COMPLETED');assert.equal(first.printedAt,null);
 const bt=(await call('/staff/session',null,{username:b.username,password:b.password})).token;
 const next=await create(student);const race=await Promise.all([token,bt].map(t=>fetch(base+'/requests/'+next.id+'/actions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+t},body:JSON.stringify({action:'receive',version:next.version,idempotencyKey:randomUUID()})})));assert.equal(race.filter(r=>r.status===200).length,1);checks++;
 const emptyToken=(await call('/staff/session',null,{username:empty.username,password:empty.password})).token;
 assert.deepEqual(await call('/requests',emptyToken),[]);await call('/requests/'+first.id,emptyToken,undefined,'GET',404);
 const manager=await role(admin,'limited manager',['rbac.staff.manage']);person=await current(admin,b.id);await call('/admin/staff/'+b.id+'/roles',admin,{version:person.permissionVersion,roleIds:[manager.id]},'PUT');
 assert((await call('/admin/staff',bt)).roles.length>0);await call('/admin/roles',bt,{name:'Escalation',permissions:[],active:true},'POST',403);
 person=await current(admin,b.id);await call('/admin/staff/'+b.id+'/roles',bt,{version:person.permissionVersion,roleIds:[paperScope.id]},'PUT',403);
 assert((await call('/me',bt)).permissions.includes('rbac.staff.manage'));
 const credential=(await query('SELECT MatKhauBam FROM svc_demo.DangNhapChuyenVien WHERE MaHS=?',[a.id])).first[0].MatKhauBam;assert(credential.startsWith('scrypt$'));assert(!credential.includes(a.password));
 const names=(await call('/admin/staff',admin)).roles.map(r=>r.id);assert(original.roles.every(r=>names.includes(r.id)));checks++;
 console.log(JSON.stringify({passed:true,httpChecks:checks,localAccounts:actors.length,newRoles:roles.length,defaultOperationsVerified:true,scopeAndRoleDisableGuardsVerified:true,oldRolesRetained:true,passwordsHashed:true,schoolWrites:0}));
}finally{await cleanupRequests(requests);await cleanupRbacFixtures(actors,roles);await disconnectLocalDatabase();}
