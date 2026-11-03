// Isolated HTTP smoke: random process-only key, disposable SQL fixture, no school writes.
import {randomUUID,randomBytes} from 'node:crypto';import assert from 'node:assert/strict';
process.env.MICROSOFT_SSO_JWT_SECRET=randomBytes(48).toString('base64');process.env.MICROSOFT_SSO_JWT_SECRET_ENCODING='base64';process.env.MICROSOFT_SSO_JWT_ISSUER='integration-smoke-sso';process.env.MICROSOFT_SSO_JWT_AUDIENCE='integration-smoke-client';process.env.JWT_SHARE_SSO_KEY='true';process.env.ENABLE_REQUESTS_DEMO='false';process.env.ENABLE_DEMO_IMPERSONATION='false';
const [{createApp},{queryLocalDatabase:q,disconnectAllDatabases},{hashPassword},{closeAuthStore}]=await Promise.all([import('../src/app.js'),import('../src/infrastructure/database/index.js'),import('../src/modules/auth/services/password.service.js'),import('../src/modules/auth/index.js')]);
const {localDatabaseGuardSql,assertLocalDemoTarget}=await import('../src/infrastructure/database/local-write-guard.js');assertLocalDemoTarget();
const id='cv:'+randomUUID(),role='test:'+randomUUID(),username='http-'+randomUUID(),password=randomBytes(24).toString('base64url');let server;
const write=(sql,params=[])=>q(localDatabaseGuardSql+sql,params);
try{
 await write(`SET XACT_ABORT ON;BEGIN TRANSACTION;INSERT svc_demo.TaiKhoan(MaHS,Hoten,VaiTro,MaDV,NguonDanhTinh,HieuLuc)VALUES(?,N'HTTP fixture','STAFF','120','LOCAL',1);
 INSERT svc_demo.DangNhapChuyenVien(MaHS,TenDangNhap,MatKhauBam)VALUES(?,?,?);INSERT svc_demo.VaiTroRBAC(MaRole,TenRole,MoTa,NguoiTao)VALUES(?,?,N'fixture',?);
 INSERT svc_demo.VaiTroQuyen(MaRole,MaQuyen)VALUES(?,'requests.view');INSERT svc_demo.TaiKhoanVaiTro(MaHS,MaRole,NguoiGan)VALUES(?,?,?);COMMIT;`,[id,id,username,await hashPassword(password),role,role,id,role,id,role,id]);
 const app=createApp();server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const base='http://127.0.0.1:'+server.address().port;
 const call=async(path,{status=200,token,body,method}={})=>{const r=await fetch(base+path,{method:method||(body?'POST':'GET'),headers:{Origin:'http://localhost:5174','Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});const j=await r.json();assert.equal(r.status,status,JSON.stringify(j));return j.data;};
 await call('/api/staff/student-services/catalogs',{status:401});await call('/api/demo/student-requests/actors',{status:404});
 const session=await call('/api/staff/auth/login',{body:{username,password}});assert.equal(session.accessToken.split('.').length,3);
 const token=session.accessToken;assert.equal((await call('/api/staff/auth/me',{token})).channel,'staff');
 const catalog=await call('/api/staff/student-services/catalogs',{token});assert(catalog.types.length>=8);assert.equal(catalog.documents.length,11);
 assert.deepEqual(await call('/api/staff/student-services/requests',{token}),[]);
 await call('/api/student-services/catalogs',{token,status:401});
 await call('/api/staff/student-services/admin/roles',{token,body:{name:'forbidden',permissions:[]},status:403});
 await write('DELETE FROM svc_demo.VaiTroQuyen WHERE MaRole=?',[role]);await call('/api/staff/student-services/catalogs',{token,status:401});
 console.log('HTTP integration passed: DB password JWT, catalog, deny-by-default, channel isolation, management denial and immediate grant revocation.');
}finally{
 if(server)await new Promise(r=>{server.close(r);server.closeAllConnections()});
 await write(`SET XACT_ABORT ON;BEGIN TRANSACTION;DELETE FROM svc_demo.TaiKhoanVaiTro WHERE MaHS=?;DELETE FROM svc_demo.VaiTroQuyen WHERE MaRole=?;DELETE FROM svc_demo.VaiTroRBAC WHERE MaRole=?;DELETE FROM svc_demo.DangNhapChuyenVien WHERE MaHS=?;DELETE FROM svc_demo.TaiKhoan WHERE MaHS=?;COMMIT;`,[id,role,role,id,id]);closeAuthStore();await disconnectAllDatabases();
}
