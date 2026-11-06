import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { queryLocalDatabase as query,transactionLocalDatabase as transaction,disconnectLocalDatabase } from '../../../src/infrastructure/database/local-sql-server.js';
import { assertLocalDemoTarget,localDatabaseGuardSql } from '../../../src/infrastructure/database/local-write-guard.js';
import { createAuthRepository } from '../../../src/common/auth/repositories/auth.repository.js';
import { createAuthService } from '../../../src/common/auth/services/auth.service.js';
import { createAuthStore } from '../../../src/common/auth/stores/auth.store.js';
import { hashPassword } from '../../../src/common/auth/services/password.service.js';

test('canonical auth credentials and task changes revoke both JWT channels without demo RBAC',{skip:process.env.AUTH_DB_TEST!=='1'},async()=>{
 assertLocalDemoTarget();
 const id=randomUUID(),actorId='cv:'+id,username='auth-test-'+randomUUID(),password='fixture-'+randomUUID();
 const store=createAuthStore(),repository=createAuthRepository();
 const service=createAuthService({repository,store,config:{nodeEnv:'test',jwt:{secret:'canonical-test-app-key-at-least-32-bytes',issuer:'canonical-test',adminAudience:'admin',staffAudience:'staff',expiresIn:'15m'},
  microsoftSso:{},auth:{refreshTtlSeconds:600}}});
 const write=(sql,params=[])=>transaction(localDatabaseGuardSql+sql,params);
 try {
  const hash=await hashPassword(password);
  await write(`INSERT auth.LocalAccounts(Id,Username,DisplayName,PasswordHash,Channel) VALUES(?,?,N'Canonical fixture',?,'admin');
   INSERT svc_demo.TaiKhoan(MaHS,Hoten,VaiTro,MaDV,NguonDanhTinh,HieuLuc) VALUES(?,N'Workflow identity','STAFF','115','LOCAL',1);
   INSERT auth.AccountProfiles(AccountId,StaffAccountId,AccessLevel,FieldCode) VALUES(?,?,'specialist','DT');
   INSERT auth.AccountTasks(AccountId,TaskId,FieldCode) VALUES(?,4,'DT');`,[id,username,hash,actorId,id,actorId,id]);
  const tokens=await Promise.all(['admin','staff'].map(channel=>service.loginWithPassword(channel,{username,password})));
  for(const bundle of tokens){const claims=await service.verifyToken(bundle.data.accessToken,bundle.data.channel);assert.equal(claims.localUserId,id);assert(claims.permissions.includes('requests.receive'));}
  assert.equal((await query('SELECT COUNT(*) AS n FROM svc_demo.DangNhapChuyenVien WHERE MaHS=?',[actorId])).first[0].n,0);
  await write('DELETE auth.AccountTasks WHERE AccountId=?',[id]);
  for(const bundle of tokens)await assert.rejects(()=>service.verifyToken(bundle.data.accessToken,bundle.data.channel),e=>e.statusCode===401);
  const next=await service.loginWithPassword('staff',{username,password});
  assert.deepEqual((await service.verifyToken(next.data.accessToken,'staff')).permissions,[]);
  await write('UPDATE auth.LocalAccounts SET PasswordHash=? WHERE Id=?',[await hashPassword('replacement-'+randomUUID()),id]);
  await assert.rejects(()=>service.refreshSession('staff',next.refreshToken),e=>e.statusCode===401);
 }finally{
  await write('DELETE auth.AccountTasks WHERE AccountId=?;DELETE auth.AccountProfiles WHERE AccountId=?;DELETE svc_demo.TaiKhoan WHERE MaHS=?;DELETE auth.LocalAccounts WHERE Id=?',[id,id,actorId,id]);
  store.close();await disconnectLocalDatabase();
 }
});
