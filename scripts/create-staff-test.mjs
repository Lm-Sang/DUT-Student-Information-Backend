// Creates a local-only specialist fixture, without hardcoded passwords or admin grants.
import{randomUUID,randomBytes}from'node:crypto';
import{queryLocalDatabase as q,disconnectLocalDatabase}from'../src/infrastructure/database/local-sql-server.js';
import{assertLocalDemoTarget,localDatabaseGuardSql}from'../src/infrastructure/database/local-write-guard.js';
import{hashPassword}from'../src/common/auth/services/password.service.js';
const username='chuyenvien.test';
try{
 assertLocalDemoTarget();
 if((await q('SELECT 1 AS Found FROM svc_demo.DangNhapChuyenVien WHERE TenDangNhap=?',[username])).first.length)throw Error('Test account already exists. Existing password and roles were not changed.');
 const id='cv:'+randomUUID(),role='local-test-specialist',password='Dut!'+randomBytes(12).toString('base64url');
 await q(`SET XACT_ABORT ON;${localDatabaseGuardSql}BEGIN TRY BEGIN TRANSACTION;
 INSERT svc_demo.TaiKhoan(MaHS,Hoten,VaiTro,MaDV,NguonDanhTinh,HieuLuc) VALUES(?,N'Chuyên viên thử nghiệm','STAFF','120','LOCAL',1);
 INSERT svc_demo.DangNhapChuyenVien(MaHS,TenDangNhap,MatKhauBam)VALUES(?,?,?);
 IF NOT EXISTS(SELECT 1 FROM svc_demo.VaiTroRBAC WHERE MaRole=?)
 INSERT svc_demo.VaiTroRBAC(MaRole,TenRole,MoTa,NguoiTao)VALUES(?,N'Chuyên viên kiểm thử local',N'Xử lý các loại đơn đã cấu hình. Không quản trị tài khoản hoặc phân quyền.',?);
 INSERT svc_demo.VaiTroQuyen(MaRole,MaQuyen)SELECT ?,q.MaQuyen FROM svc_demo.QuyenRBAC q
 WHERE (q.MaQuyen IN('requests.view','requests.receive','requests.print','requests.complete','requests.cancel','workbook.export','workbook.import') OR q.MaQuyen LIKE 'work:%')
 AND NOT EXISTS(SELECT 1 FROM svc_demo.VaiTroQuyen p WHERE p.MaRole=? AND p.MaQuyen=q.MaQuyen);
 INSERT svc_demo.TaiKhoanVaiTro(MaHS,MaRole,NguoiGan)VALUES(?,?,?);
 INSERT svc_demo.LichSuRBAC(MaNguoiThucHien,ThaoTac,MaRole,MaTaiKhoan,MoTa)VALUES(?,'CREATE_TEST_ACCOUNT',?,?,N'Tạo chuyên viên kiểm thử local theo yêu cầu.');
 COMMIT TRANSACTION;END TRY BEGIN CATCH IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;THROW;END CATCH;`,
 [id,id,username,await hashPassword(password),role,role,id,role,role,id,role,id,id,role,id]);
 console.log(JSON.stringify({username,password,role,scope:'Local request processing and printing; no account/role administration'}));
}finally{await disconnectLocalDatabase()}
