# Database_newversion

Bản xuất SQL Server local để thành viên khác dựng môi trường backend. `01-schema.sql` giữ cấu trúc DB thực tế; `02-catalogs.sql` chứa danh mục cấu hình, không chứa tài khoản, hồ sơ sinh viên hoặc URL minh chứng. Không chứa login SQL Server hay mật khẩu kết nối.

## Dựng DB mới

Cần SQL Server 2019 trở lên, `sqlcmd`, quyền tạo database. Chạy từ thư mục gốc repo, trên database mới và rỗng; lệnh không ghi đè DB hiện có:

```powershell
sqlcmd -S localhost,1433 -E -C -b -Q "CREATE DATABASE [sv_dut];"
sqlcmd -S localhost,1433 -E -C -b -f 65001 -d sv_dut -i Database_newversion/01-schema.sql
sqlcmd -S localhost,1433 -E -C -b -f 65001 -d sv_dut -i Database_newversion/02-catalogs.sql
```

Nếu máy đã có `sv_dut`, dùng SQL instance khác hoặc tên local được guard hỗ trợ `Studentpage_Integration_20261103` và đổi `LOCAL_DB_NAME` tương ứng. Không chạy bộ này lên DB trường.

Sau đó sao chép [cấu hình mẫu](../.env.example) thành `.env`, đặt `LOCAL_DB_HOST=localhost`, `LOCAL_DB_PORT=1433`, `LOCAL_DB_NAME=sv_dut`, rồi `npm ci`. Tạo tài khoản quản trị riêng theo [hướng dẫn tổ chức và phân quyền](../docs/AUTH_ORGANIZATION.md); không có tài khoản/mật khẩu dùng chung trong bản xuất. Các chức năng đọc DB trường và file R2 vẫn cần cấu hình kết nối riêng; SQL không chứa file upload.

## Xuất lại từ DB local

Script dùng Windows authentication và thư viện SMO cài cùng SQL Server/SSMS. Truyền đúng thư mục chứa các DLL SMO trên máy:

```powershell
powershell -NoProfile -File scripts/database/export-local-db.ps1 -Database sv_dut -SmoDirectory "C:/Program Files/Microsoft SQL Server/150/Setup Bootstrap/SQL2019/x64" -IncludePrivateData
```

`local-data.private.sql` là toàn bộ dữ liệu local, chỉ lưu trên máy và bị Git bỏ qua. Muốn khôi phục bản đầy đủ vào DB mới, chạy `01-schema.sql` rồi `local-data.private.sql` **thay cho** `02-catalogs.sql`. Bản dữ liệu này có thông tin cá nhân/tài khoản, chỉ chuyển qua kênh riêng phù hợp. Tạm dừng ghi vào ứng dụng khi xuất để các bảng có dữ liệu nhất quán; đây là script chuyển dữ liệu, không thay thế backup transaction của SQL Server.

Các bản xuất phản ánh DB local tại thời điểm chạy, không tự áp dụng migration. Xem [quy tắc thời hạn](../docs/REQUEST_REGULATIONS.md) cho thay đổi API tính hạn mà không đổi schema.
