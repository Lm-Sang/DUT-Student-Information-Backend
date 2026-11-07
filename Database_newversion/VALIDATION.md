# Kiểm tra bản xuất ngày 07/11/2026

Nguồn: SQL loopback Studentpage_Integration_20261103, SQL Server 2019 Developer
15.0.2000.5, collation SQL_Latin1_General_CP1_CI_AS. Không thay đổi DB nguồn/SSH.

- Import 01-schema.sql + 02-catalogs.sql vào DB local tạm: 56 bảng, 4 view,
  50 quyền riêng, 4 role, 11 xác nhận, 19 loại chứng chỉ, 47 cơ sở cấp, 0 tài khoản.
- View quyền auth/workflow truy vấn được; có cấu hình kỳ hiện tại/LMS và các danh
  mục loại đơn. Không có FK/CHECK bị disabled/untrusted sau import.
- Kiểm tra key ký workbook mới đủ 64 ký tự và khác key trong backup nguồn.
- Backup đầy đủ dùng COPY_ONLY, COMPRESSION, CHECKSUM; RESTORE VERIFYONLY đạt.
  Restore thử vào DB local khác rồi DBCC CHECKDB không báo lỗi; có 56 bảng/4 view,
  không có FK/CHECK bị disabled/untrusted.
- DB thử có tên ngẫu nhiên và marker sở hữu, đã dọn sau kiểm tra. sv_dut và DB
  ứng dụng được giữ nguyên; không dừng service ứng dụng để restore đè.
- Backend: kiểm tra cú pháp 386 file; offline 205 đạt, 7 test SQL opt-in bỏ qua,
  0 lỗi. Đây là lần kiểm tra offline; không gọi số bỏ qua là đã kiểm thử.
- Frontend: cú pháp + liên kết ESM đạt, 55/55 test đạt; đóng gói ngoài repo backend.

Hash của schema và seed ở manifest.json. Đã thử trên SQL Server local nêu trên;
chưa kiểm tra restore trên máy thành viên khác. SSO/DB trường/R2 cần cấu hình riêng.
