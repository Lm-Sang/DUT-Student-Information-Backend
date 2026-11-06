import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { queryLocalDatabase as query,disconnectLocalDatabase } from '../../../src/infrastructure/database/local-sql-server.js';
import { assertLocalDemoTarget,localDatabaseGuardSql } from '../../../src/infrastructure/database/local-write-guard.js';
import { createAuthRepository } from '../../../src/common/auth/repositories/auth.repository.js';
import { createAuthService } from '../../../src/common/auth/services/auth.service.js';
import { createAuthStore } from '../../../src/common/auth/stores/auth.store.js';
import { hashPassword } from '../../../src/common/auth/services/password.service.js';

const enabled=process.env.AUTH_DB_TEST==='1';
test('SQL staff passwords, normalized RBAC and direct grant changes revoke sessions without altering existing accounts',{skip:!enabled},async()=>{
 assertLocalDemoTarget();
 const id='cv:'+randomUUID(),role='test:'+randomUUID(),permission='auth-test:'+randomUUID(),username='test-'+randomUUID();
 const store=createAuthStore({filename:':memory:'});
 const config={nodeEnv:'test',jwt:{shareSsoKey:true,secret:'',issuer:'sql-test-app',studentAudience:'sql-student',adminAudience:'sql-admin',staffAudience:'sql-staff',expiresIn:'15m'},
 microsoftSso:{jwtSecret:'sql-test-shared-key-at-least-32-bytes',jwtSecretEncoding:'utf8',jwtIssuer:'sql-test-sso',jwtAudience:'sql-sso-client'},auth:{refreshTtlSeconds:600}};
 const repository=createAuthRepository(),service=createAuthService({config,repository,store});
 const write=(sql,params)=>query(localDatabaseGuardSql+sql,params);
 try{
  const password='test-password-'+randomUUID();const hash=await hashPassword(password);
  await write(`SET XACT_ABORT ON;BEGIN TRY BEGIN TRANSACTION;
   INSERT svc_demo.TaiKhoan(MaHS,Hoten,VaiTro,MaDV,NguonDanhTinh,HieuLuc) VALUES(?,N'Fixture auth SQL','STAFF','120','LOCAL',1);
   INSERT svc_demo.DangNhapChuyenVien(MaHS,TenDangNhap,MatKhauBam) VALUES(?,?,?);
   INSERT svc_demo.QuyenRBAC(MaQuyen,TenQuyen,Nhom) VALUES(?,N'Fixture auth',N'Test');
   INSERT svc_demo.VaiTroRBAC(MaRole,TenRole,MoTa,NguoiTao) VALUES(?,?,N'Fixture only',?);
   INSERT svc_demo.VaiTroQuyen(MaRole,MaQuyen) VALUES(?,?);
   INSERT svc_demo.TaiKhoanVaiTro(MaHS,MaRole,NguoiGan) VALUES(?,?,?);
   COMMIT TRANSACTION;END TRY BEGIN CATCH IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;THROW;END CATCH;`,[id,id,username,hash,permission,role,role,id,role,permission,id,role,id]);
  const bundle=await service.loginWithPassword('staff',{username,password});
  let claims=await service.verifyToken(bundle.data.accessToken,'staff');
  assert.equal(claims.identity.requestActorId,id);assert(claims.permissions.includes(permission));assert(claims.roles.includes(role));
  await write('DELETE FROM svc_demo.VaiTroQuyen WHERE MaRole=? AND MaQuyen=?',[role,permission]);
  await assert.rejects(()=>service.verifyToken(bundle.data.accessToken,'staff'),e=>e.statusCode===401);
  const next=await service.loginWithPassword('staff',{username,password});
  assert(!(await service.verifyToken(next.data.accessToken,'staff')).permissions.includes(permission));
  const replacement=await hashPassword('replacement-'+randomUUID());
  await write('UPDATE svc_demo.DangNhapChuyenVien SET MatKhauBam=? WHERE MaHS=?',[replacement,id]);
  await assert.rejects(()=>service.refreshSession('staff',next.refreshToken),e=>e.statusCode===401);
  await assert.rejects(()=>service.loginWithPassword('staff',{username,password}),e=>e.statusCode===401);
 }finally{
  await write(`SET XACT_ABORT ON;BEGIN TRY BEGIN TRANSACTION;
    DELETE FROM svc_demo.TaiKhoanVaiTro WHERE MaHS=?;
    DELETE FROM svc_demo.VaiTroQuyen WHERE MaRole=?;
    DELETE FROM svc_demo.VaiTroRBAC WHERE MaRole=?;
    DELETE FROM svc_demo.QuyenRBAC WHERE MaQuyen=?;
    DELETE FROM svc_demo.DangNhapChuyenVien WHERE MaHS=?;
    DELETE FROM svc_demo.TaiKhoan WHERE MaHS=?;
    COMMIT TRANSACTION;END TRY BEGIN CATCH IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;THROW;END CATCH;`,[id,role,role,permission,id,id]);
  store.close();await disconnectLocalDatabase();
 }
});
