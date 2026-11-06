# Kết quả kiểm tra bản xuất

Xuất ngày 06/11/2026 từ DB local `sv_dut`, SQL Server `15.0.2200.2` (2019), bằng SMO 15. Không chạy migration hoặc seed trên DB nguồn.

- Schema: 54 bảng, giữ tên, kiểu dữ liệu, collation, index, default, trigger và constraint từ DB nguồn.
- Bản chia sẻ: schema + danh mục theo allowlist trong [script xuất](../scripts/database/export-local-db.ps1). Đã dựng thử vào DB local mới: 4 ngôn ngữ, 19 loại chứng chỉ, 4 tác vụ, 0 tài khoản.
- Bản dữ liệu đầy đủ local: đã import thử cùng schema vào DB mới, xác nhận có 4 tài khoản và 5 hồ sơ chứng chỉ như nguồn. File này bị Git bỏ qua.
- Sau cả hai lần import: không có foreign key hoặc check constraint nào bị disabled/untrusted. DB thử đã được xóa sau kiểm tra; DB nguồn được giữ nguyên.
- Bộ test offline backend: 203 test, 199 đạt, 4 bỏ qua, 0 lỗi. Kiểm tra cú pháp đạt cho 368 file JavaScript. Dùng Node 24.21.0 trực tiếp do npm shim trên máy không tìm được phiên bản Node đã cài.

`DBCC CHECKCONSTRAINTS` tổng hợp gặp lỗi collation nội bộ SQL Server khi kết hợp các schema có collation khác nhau. Việc import vẫn thành công và mọi constraint được kiểm tra lại bằng `WITH CHECK CHECK CONSTRAINT ALL`; đã xác minh metadata không còn constraint bị tắt/chưa tin cậy. Chưa thử trên máy khác hoặc SQL Server phiên bản khác, chưa kiểm tra tích hợp live với DB trường/R2.
