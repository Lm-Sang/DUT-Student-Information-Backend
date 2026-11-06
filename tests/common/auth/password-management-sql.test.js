import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { queryLocalDatabase as query,transactionLocalDatabase as transaction,disconnectLocalDatabase } from '../../../src/infrastructure/database/local-sql-server.js';
import { assertLocalDemoTarget,localDatabaseGuardSql } from '../../../src/infrastructure/database/local-write-guard.js';
import { createAuthRepository } from '../../../src/common/auth/repositories/auth.repository.js';
import { createAuthService } from '../../../src/common/auth/services/auth.service.js';
import { createAuthStore } from '../../../src/common/auth/stores/auth.store.js';
import { hashPassword } from '../../../src/common/auth/services/password.service.js';

test('canonical auth password change/reset enforce hierarchy, CAS, audit and cross-channel revocation',{skip:process.env.AUTH_DB_TEST!=='1'},async()=>{
 assertLocalDemoTarget();
 const manager=randomUUID(),target=randomUUID(),actorId='cv:'+target;
 const managerName='manager-test-'+randomUUID(),username='target-test-'+randomUUID();
 const old='initial-'+randomUUID(),changed='changed-'+randomUUID(),reset='reset-'+randomUUID();
 const repository=createAuthRepository(),store=createAuthStore();
 const service=createAuthService({repository,store,config:{nodeEnv:'test',jwt:{secret:'canonical-password-app-key-at-least-32-bytes',issuer:'canonical-password',adminAudience:'admin',staffAudience:'staff',expiresIn:'15m'},microsoftSso:{},auth:{refreshTtlSeconds:600}}});
 const write=(sql,params=[])=>transaction(localDatabaseGuardSql+sql,params);
 try{
  const hash=await hashPassword(old);
  await write(`INSERT auth.LocalAccounts(Id,Username,DisplayName,PasswordHash,Channel) VALUES(?,?,N'Manager fixture',?,'admin'),(?,?,N'Specialist fixture',?,'admin');
   INSERT svc_demo.TaiKhoan(MaHS,Hoten,VaiTro,MaDV,NguonDanhTinh,HieuLuc) VALUES(?,N'Workflow fixture','STAFF','115','LOCAL',1);
   INSERT auth.AccountProfiles(AccountId,AccessLevel,FieldCode) VALUES(?,'department_admin','DT');
   INSERT auth.AccountProfiles(AccountId,StaffAccountId,AccessLevel,FieldCode) VALUES(?,?,'specialist','DT');
   INSERT auth.AccountTasks(AccountId,TaskId,FieldCode) VALUES(?,4,'DT');`,[manager,managerName,hash,target,username,hash,actorId,manager,target,actorId,target]);
  const login=(name,password,channel='staff')=>service.loginWithPassword(channel,{username:name,password});
  const staff=await login(username,old),admin=await login(username,old,'admin'),managerSession=await login(managerName,old,'admin');
  await service.updateStaffPassword(await service.verifyToken(staff.data.accessToken,'staff'),{currentPassword:old,newPassword:changed});
  for(const bundle of [staff,admin])await assert.rejects(()=>service.verifyToken(bundle.data.accessToken,bundle.data.channel),e=>e.statusCode===401);
  const afterChange=await login(username,changed);
  await service.updateStaffPassword(await service.verifyToken(managerSession.data.accessToken,'admin'),{newPassword:reset},{targetId:target});
  await assert.rejects(()=>service.verifyToken(afterChange.data.accessToken,'staff'),e=>e.statusCode===401);
  await assert.rejects(()=>login(username,changed),e=>e.statusCode===401);
  assert.equal((await login(username,reset)).data.user.localUserId,target);
  const audit=(await query('SELECT Action FROM auth.AccountSecurityEvents WHERE TargetId=? ORDER BY Action',[target])).first;
  assert.deepEqual(audit.map(row=>row.Action),['CHANGE_PASSWORD','RESET_PASSWORD']);
  const actor=await repository.findLocalById(manager),account=await repository.findLocalById(target);
  await write('UPDATE auth.LocalAccounts SET PasswordHash=? WHERE Id=?',[hash,target]);
  await assert.rejects(()=>repository.updateStaffPassword({actor,account,passwordHash:hash,reset:true}),e=>e.statusCode===409);
  await write("UPDATE auth.AccountProfiles SET AccessLevel='specialist' WHERE AccountId=?",[manager]);
  await assert.rejects(()=>repository.updateStaffPassword({actor,account:{...account,passwordHash:hash},passwordHash:hash,reset:true}),e=>e.statusCode===403);
 }finally{
  await write(`DELETE auth.AccountSecurityEvents WHERE ActorId IN(?,?) OR TargetId IN(?,?);
   DELETE auth.AccountTasks WHERE AccountId IN(?,?);DELETE auth.AccountProfiles WHERE AccountId IN(?,?);
   DELETE svc_demo.TaiKhoan WHERE MaHS=?;DELETE auth.LocalAccounts WHERE Id IN(?,?);`,[manager,target,manager,target,manager,target,manager,target,actorId,manager,target]);
  store.close();await disconnectLocalDatabase();
 }
});
