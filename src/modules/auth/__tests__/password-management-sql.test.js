import assert from 'node:assert/strict';
import {test} from 'node:test';
import {randomUUID} from 'node:crypto';
import {queryLocalDatabase as query,disconnectLocalDatabase} from '../../../infrastructure/database/local-sql-server.js';
import {assertLocalDemoTarget,localDatabaseGuardSql} from '../../../infrastructure/database/local-write-guard.js';
import {createAuthRepository} from '../repositories/auth.repository.js';
import {createAuthService} from '../services/auth.service.js';
import {createAuthStore} from '../stores/auth.store.js';
import {hashPassword} from '../services/password.service.js';

test('local SQL password changes/reset enforce CAS, live RBAC, audit and session revocation',{skip:process.env.AUTH_DB_TEST!=='1'},async()=>{
 assertLocalDemoTarget();
 const manager='cv:'+randomUUID(),target='cv:'+randomUUID(),role='test:'+randomUUID();
 const username='test-'+randomUUID(),managerName='test-'+randomUUID();
 const old='old-'+randomUUID(),changed='changed-'+randomUUID(),reset='reset-'+randomUUID();
 const store=createAuthStore(),repository=createAuthRepository();
 const service=createAuthService({repository,store,config:{nodeEnv:'test',jwt:{shareSsoKey:true,issuer:'password-sql',studentAudience:'student',staffAudience:'staff',adminAudience:'admin',expiresIn:'15m'},
  microsoftSso:{jwtSecret:'password-sql-key-with-more-than-32-bytes'},auth:{refreshTtlSeconds:600}}});
 const write=(sql,params=[])=>query(localDatabaseGuardSql+sql,params);
 try{
  const initialHash=await hashPassword(old);
  await write(`SET XACT_ABORT ON;BEGIN TRANSACTION;
   INSERT svc_demo.TaiKhoan(MaHS,Hoten,VaiTro,MaDV,NguonDanhTinh,HieuLuc) VALUES(?,N'Password test manager','STAFF','120','LOCAL',1),(?,N'Password test target','STAFF','120','LOCAL',1);
   INSERT svc_demo.DangNhapChuyenVien(MaHS,TenDangNhap,MatKhauBam) VALUES(?,?,?),(?,?,?);
   INSERT svc_demo.VaiTroRBAC(MaRole,TenRole,MoTa,NguoiTao) VALUES(?,?,N'Test only',?);
   INSERT svc_demo.VaiTroQuyen(MaRole,MaQuyen) VALUES(?,'rbac.staff.manage');
   INSERT svc_demo.TaiKhoanVaiTro(MaHS,MaRole,NguoiGan) VALUES(?,?,?);COMMIT;`,
   [manager,target,manager,managerName,initialHash,target,username,initialHash,role,role,manager,role,manager,role,manager]);
  const login=(name,value)=>service.loginWithPassword('staff',{username:name,password:value});
  const one=await login(username,old),two=await login(username,old),admin=await login(managerName,old);
  await service.updateStaffPassword(await service.verifyToken(one.data.accessToken,'staff'),{currentPassword:old,newPassword:changed});
  for(const session of [one,two]){
   await assert.rejects(()=>service.verifyToken(session.data.accessToken,'staff'),e=>e.statusCode===401);
   await assert.rejects(()=>service.refreshSession('staff',session.refreshToken),e=>e.statusCode===401);
  }
  await assert.rejects(()=>login(username,old),e=>e.statusCode===401);
  const afterChange=await login(username,changed);
  await service.updateStaffPassword(await service.verifyToken(admin.data.accessToken,'staff'),{newPassword:reset},{targetId:target});
  await assert.rejects(()=>service.verifyToken(afterChange.data.accessToken,'staff'),e=>e.statusCode===401);
  await assert.rejects(()=>service.refreshSession('staff',afterChange.refreshToken),e=>e.statusCode===401);
  await assert.rejects(()=>login(username,changed),e=>e.statusCode===401);
  assert.equal((await login(username,reset)).data.channel,'staff');
  assert.equal((await service.verifyToken(admin.data.accessToken,'staff')).localUserId,manager);
  const audit=(await query('SELECT ThaoTac,MoTa FROM svc_demo.LichSuRBAC WHERE MaTaiKhoan=? ORDER BY ThaoTac',[target])).first;
  assert.deepEqual(audit.map(x=>x.ThaoTac),['CHANGE_PASSWORD','RESET_PASSWORD']);
  for(const value of [old,changed,reset,initialHash])assert(!JSON.stringify(audit).includes(value));
  const actor=await repository.findStaffById(manager),account=await repository.findStaffById(target);
  await write('UPDATE svc_demo.DangNhapChuyenVien SET MatKhauBam=? WHERE MaHS=?',[initialHash,target]);
  await assert.rejects(()=>repository.updateStaffPassword({actor,account,passwordHash:initialHash,reset:true}),e=>e.statusCode===409);
  await write('DELETE FROM svc_demo.VaiTroQuyen WHERE MaRole=?',[role]);
  await assert.rejects(()=>repository.updateStaffPassword({actor,account: {...account,passwordHash:initialHash},passwordHash:initialHash,reset:true}),e=>e.statusCode===403);
 }finally{
  await write(`SET XACT_ABORT ON;BEGIN TRANSACTION;
   DELETE FROM svc_demo.LichSuRBAC WHERE MaTaiKhoan IN(?,?);
   DELETE FROM svc_demo.TaiKhoanVaiTro WHERE MaHS IN(?,?);
   DELETE FROM svc_demo.VaiTroQuyen WHERE MaRole=?;DELETE FROM svc_demo.VaiTroRBAC WHERE MaRole=?;
   DELETE FROM svc_demo.DangNhapChuyenVien WHERE MaHS IN(?,?);DELETE FROM svc_demo.TaiKhoan WHERE MaHS IN(?,?);COMMIT;`,
   [manager,target,manager,target,role,role,manager,target,manager,target]);
  store.close();await disconnectLocalDatabase();
 }
});
