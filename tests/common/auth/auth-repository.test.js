import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createAuthRepository } from '../../../src/common/auth/repositories/auth.repository.js';
import { createRequestActorResolver } from '../../../src/common/student-requests/middlewares/request-actor.js';
import { createLocalPermissionContext } from '../../../src/common/auth/middlewares/auth.middleware.js';

function fixture({profile=true,level='specialist'}={}) {
  const queries=[];
  const query=async sql=>{
    queries.push(sql);
    if(sql.includes('PasswordHash AS passwordHash'))return {first:[{id:'11111111-1111-4111-8111-111111111111',username:'Auth User',displayName:'Auth user',passwordHash:'auth-hash',storedChannel:'admin',isActive:1,accountVersion:'0x0000000000000001'}]};
    if(sql.includes('AS accountId'))return {first:profile?[{accountId:'11111111-1111-4111-8111-111111111111',staffAccountId:'cv:workflow',accessLevel:level,fieldCode:'DT',active:1,fieldActive:1,revision:1}]:[]};
    if(sql.includes('auth.AccountRoles'))return {first:[]};
    if(sql.includes('auth.PermissionDefinitions')&&!sql.includes('vEffectivePermissions'))return {first:[{id:4}]};
    if(sql.includes('vEffectivePermissions'))return {first:[{taskId:4,permission:'requests.view'},{taskId:4,permission:'work:STUDENT_CARD'}]};

    assert.fail('Unexpected repository query');
  };
  return {repository:createAuthRepository({query}),queries};
}

test('admin and staff channels read the same canonical auth credential with separate channel versions',async()=>{
  const {repository,queries}=fixture();
  const admin=await repository.findLocalByUsername('Auth User'),staff=await repository.findStaffByUsername('Auth User');
  assert.equal(staff.id,admin.id);assert.equal(staff.passwordHash,'auth-hash');
  assert.equal(admin.channel,'admin');assert.equal(staff.channel,'staff');assert.notEqual(admin.version,staff.version);
  assert.deepEqual(staff.permissions,['requests.view','work:STUDENT_CARD']);assert.equal(staff.requestActorId,'cv:workflow');
  assert(queries.every(sql=>!sql.includes('svc_demo')&&!sql.includes('VaiTroRBAC')));
});

test('missing auth profile never falls back to legacy roles and managers cannot log in as staff',async()=>{
  const {repository}=fixture({profile:false});
  assert.equal(await repository.findLocalByUsername('legacy'),null);assert.equal(await repository.findStaffByUsername('legacy'),null);
  assert.equal(await repository.findStaffById('cv:old-demo-session'),null);
  for(const level of ['super_admin','department_admin'])assert.equal(await fixture({level}).repository.findStaffByUsername('manager'),null);
  await assert.rejects(()=>fixture().repository.createLocalAccount({channel:'admin',roles:['admin']}),e=>e.statusCode===400);
});

test('workflow identity does not grant authority; only the current auth task permissions are accepted',async()=>{
  const profile={active:true,fieldActive:true,accessLevel:'specialist',taskIds:[4]};
  const auth={verifyToken:async()=>({authMethod:'password',identity:{requestActorId:'cv:workflow'},organization:profile,permissions:['requests.view','work:STUDENT_CARD']})};
  const service={sessionActor:async()=>({id:'cv:workflow',role:'STAFF',permissions:['rbac.staff.manage','requests.reassign'],workPermissions:['ANYTHING']})};
  const resolver=createRequestActorResolver({channel:'staff',auth,service});
  const req={headers:{authorization:'Bearer auth-token'}};
  const actor=await resolver(req);assert.deepEqual(actor.permissions,['requests.view','work:STUDENT_CARD']);assert.deepEqual(actor.workPermissions,['STUDENT_CARD']);
  profile.taskIds=[1];await assert.rejects(()=>resolver(req),e=>e.statusCode===403);
  profile.taskIds=[4];profile.accessLevel='department_admin';await assert.rejects(()=>resolver(req),e=>e.statusCode===403);
  await assert.rejects(()=>createLocalPermissionContext('certifications:review',{verifyToken:async()=>({authMethod:'password',permissions:['certifications:review']})},1)(req),e=>e.statusCode===403);
});
