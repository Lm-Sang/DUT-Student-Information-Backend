import assert from 'node:assert/strict';
import {test} from 'node:test';
import {parseRole,parseAccount,parseAssignments,hasPermission,legacyFunctions,defaultStaffPermissions} from '../../../src/common/student-requests/rules/rbac.js';
import {actionsFor,canRead,canPrintRequest} from '../../../src/common/student-requests/rules/request-rules.js';
import {hashStaffPassword,verifyStaffPassword} from '../../../src/common/student-requests/services/staff-password.service.js';
import {createRbacService} from '../../../src/common/student-requests/services/rbac.service.js';
test('staff operations deny by default and require explicit function and work grants',()=>{
 const request={typeCode:'DonSV01',studentId:'s',status:'SUBMITTED'},actor={id:'cv',role:'STAFF',workPermissions:['DonSV01'],permissions:[]};
 assert.deepEqual(actionsFor(actor,request),[]);actor.permissions=[...defaultStaffPermissions];assert.deepEqual(actionsFor(actor,request),['receive','cancel']);assert.deepEqual(actionsFor({...actor,workPermissions:[]},request),[]);assert(canRead(actor,request));assert.deepEqual(actionsFor({id:'s',role:'STUDENT'},request),['cancel']);
 for(const key of defaultStaffPermissions){assert(hasPermission(actor,key));assert(!hasPermission({role:'STUDENT'},key));}
 assert(!hasPermission(actor,'rbac.roles.manage'));assert(!hasPermission(actor,'rbac.staff.manage'));assert(!hasPermission(actor,'requests.reassign'));
 assert(!canPrintRequest(actor,{TypeCode:'DonSV01',AssignedStaffId:'cv',Status:'RECEIVED'}));assert(!canPrintRequest({...actor,permissions:[...legacyFunctions]},{TypeCode:'DonSV01',AssignedStaffId:'cv',Status:'RECEIVED'}));
 const confirmation={TypeCode:'CONFIRMATION',Payload:{documentCode:'01'},AssignedStaffId:'cv',Status:'RECEIVED'},confirmationActor={...actor,workPermissions:['CONFIRMATION:01']};assert(canPrintRequest(confirmationActor,confirmation));assert(!canPrintRequest({...confirmationActor,workPermissions:[]},confirmation));assert(!canPrintRequest({...confirmationActor,id:'other'},confirmation));
});
test('role editing exposes only configurable scopes and management rights and preserves old role records',async()=>{
 const old={id:'old',permissions:['requests.view','work:DonSV01'],active:true},catalog=[{key:'requests.view'},{key:'workbook.export'},{key:'work:DonSV01'},{key:'rbac.roles.manage'}];let saved;
 const repo={roles:async()=>[old],permissions:async()=>catalog,saveRole:async(...args)=>{saved=args[2];}};
 const service=createRbacService(repo,{}),admin={id:'admin',role:'STAFF',permissions:['rbac.roles.manage']},overview=await service.overview(admin);
 assert.deepEqual(overview.permissions.map(p=>p.key),catalog.map(p=>p.key));assert.deepEqual(overview.defaultPermissions,[]);assert.deepEqual(old.permissions,['requests.view','work:DonSV01']);
 await service.save(admin,'old',{name:'QA',permissions:['requests.view','workbook.export','work:DonSV01'],active:false,version:1});assert.deepEqual(saved.permissions,['requests.view','work:DonSV01','workbook.export']);assert.equal(saved.active,false);
});
test('role validation rejects invented permissions, duplicate keys, stale versions and hidden admin fields',()=>{
 const value={name:'Role tiếng Việt',description:'',active:true,permissions:['requests.view']};assert.equal(parseRole(value,['requests.view']).name,value.name);
 for(const input of [{...value,permissions:['root.*']},{...value,permissions:['requests.view','requests.view']},{...value,role:'ADMIN'},{...value,active:'true'}])assert.throws(()=>parseRole(input,['requests.view']));assert.throws(()=>parseRole(value,['requests.view'],true));assert.throws(()=>parseAssignments({roleIds:['invented'],version:1},['known']));
});
test('account validation does not permit native role/source spoofing or short passwords',()=>{
 const value={name:'Chuyên viên',username:'Staff.Test',password:'qa-password-long-enough-1',department:'CTSV',roleIds:[]};assert.equal(parseAccount(value,[]).username,'staff.test');assert.throws(()=>parseAccount({...value,role:'ADMIN'},[]));assert.throws(()=>parseAccount({...value,password:'short'},[]));assert.throws(()=>parseAccount({...value,roleIds:['unknown']},[]));
});
test('password hashes use independent salts, verify correctly and never contain the password',async()=>{
 const password='qa-password-long-enough',a=await hashStaffPassword(password),b=await hashStaffPassword(password);assert.notEqual(a,b);assert(!a.includes(password));assert(await verifyStaffPassword(password,a));assert(!await verifyStaffPassword('wrong',a));assert(!await verifyStaffPassword(password,null));
});
test('unprivileged users cannot read management data, create roles, create accounts or assign them',async()=>{
 const service=createRbacService({roles:()=>assert.fail('no DB access')},{}),actor={role:'STAFF',permissions:[]};for(const action of [()=>service.overview(actor),()=>service.save(actor,null,{}),()=>service.createAccount(actor,{}),()=>service.assign(actor,'cv',{})])await assert.rejects(action,e=>e.statusCode===403);assert(!hasPermission({role:'ADMIN'},'rbac.roles.manage'));assert(!hasPermission(actor,'rbac.roles.manage'));
});
