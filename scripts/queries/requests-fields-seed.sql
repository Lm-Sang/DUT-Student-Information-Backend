SET NOCOUNT ON;
IF DB_NAME()<>N'sv_dut' THROW 51000,'Local sv_dut required',1;
SET XACT_ABORT ON;
BEGIN TRANSACTION;
INSERT svc_demo.TaiKhoan(MaHS,Hoten,VaiTro,MaDV,SoThe)
SELECT s.* FROM (VALUES
 (N'student-a',N'Nguyễn Minh Anh (SV thử A)','STUDENT',NULL,N'DEMO0001'),
 (N'student-b',N'Trần Hoàng Nam (SV thử B)','STUDENT',NULL,N'DEMO0002'),
 (N'staff-ctsv',N'Chuyên viên CTSV A','STAFF','120',NULL),
 (N'staff-ctsv-b',N'Chuyên viên CTSV B','STAFF','120',NULL),
 (N'staff-dt',N'Chuyên viên Đào tạo','STAFF','115',NULL),
 (N'staff-lms',N'Chuyên viên hỗ trợ LMS','STAFF','IT',NULL)
)s(MaHS,Hoten,VaiTro,MaDV,SoThe) WHERE NOT EXISTS(SELECT 1 FROM svc_demo.TaiKhoan a WHERE a.MaHS=s.MaHS);
INSERT svc_demo.NhanThan(MaHS,Hoten,SoThe,Lop,NgaySinh,SoCCCD,DienThoai,NoiSinh,GioiTinh,DanToc,TenNganhTQ,LoaiAnh,NguonDuLieu,TongTinChiChuongTrinh,TinChiTichLuy,DiemTBCTL,DiemTBRL)
SELECT a.MaHS,CASE WHEN a.MaHS='student-a' THEN N'Nguyễn Minh Anh' ELSE N'Trần Hoàng Nam' END,a.SoThe,N'23DEMO1','20040215',N'000000000001',N'0000000000',N'Đà Nẵng',
 CASE WHEN a.MaHS='student-a' THEN N'Nữ' ELSE N'Nam' END,N'Kinh',N'Công nghệ thông tin (thử nghiệm)','DEMO','LOCAL_DEMO',130,114,3.5,85
FROM svc_demo.TaiKhoan a WHERE a.VaiTro='STUDENT' AND NOT EXISTS(SELECT 1 FROM svc_demo.NhanThan p WHERE p.MaHS=a.MaHS);
INSERT svc_demo.KetQuaHocTapHocKy(MaHS,IDCode,ThuTu,TenKH,SoTinChi,SoTinChiHocLai,DiemTBCHB,DiemTBC,DiemTBCTL,CoDiemDuoi5,DiemRL)
SELECT MaHS,'2610',0,N'HK1 / 2026-2027',18,0,8.4,3.5,3.5,N'Không',85 FROM svc_demo.NhanThan p
WHERE NOT EXISTS(SELECT 1 FROM svc_demo.KetQuaHocTapHocKy k WHERE k.MaHS=p.MaHS);
COMMIT TRANSACTION;
