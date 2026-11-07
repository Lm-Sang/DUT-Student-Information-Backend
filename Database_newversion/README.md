# Database_newversion — 07/11/2026

Bản mới nhất xuất từ DB ứng dụng local Studentpage_Integration_20261103, dùng với
nhánh feat/granular-rbac-native-ui. Máy thành viên có thể dựng dưới tên sv_dut.
Schema có 56 bảng, 4 view; giữ index, constraint, collation, procedure và dấu phiên
bản migration. Danh mục có 50 quyền riêng, 4 role, 11 xác nhận, LMS, 19 chứng chỉ
ngoại ngữ, 47 cơ sở cấp, danh mục chương trình/học kỳ và cấu hình cần thiết.

## Dựng DB sạch

Cần SQL Server 2019 trở lên và sqlcmd. Chỉ chạy trên DB mới/rỗng ở local.
Không chạy script lên DB đang có dữ liệu hoặc DB trường.

```powershell
sqlcmd -S localhost,1433 -E -C -b -Q "IF DB_ID(N'sv_dut') IS NOT NULL THROW 51000,'Database already exists',1; CREATE DATABASE [sv_dut] COLLATE SQL_Latin1_General_CP1_CI_AS;"
sqlcmd -S localhost,1433 -E -C -b -f 65001 -d sv_dut -i Database_newversion/01-schema.sql
sqlcmd -S localhost,1433 -E -C -b -f 65001 -d sv_dut -i Database_newversion/02-catalogs.sql
```

Sau đó sao chép .env.example thành .env, dùng LOCAL_DB_HOST=localhost,
LOCAL_DB_PORT=1433, LOCAL_DB_NAME=sv_dut, Windows authentication và npm.cmd ci.
Tạo admin riêng theo [hướng dẫn auth](../docs/AUTH_ORGANIZATION.md).
Nếu đã có sv_dut, dùng instance local khác hoặc DB local được guard hỗ trợ;
không ghi đè DB cũ. Đây là snapshot dựng mới, không phải migration cho DB đang chạy.

## Dữ liệu chia sẻ

01-schema.sql chứa schema, 02-catalogs.sql chỉ chứa danh mục theo allowlist.
Không có tài khoản, hash mật khẩu, hồ sơ sinh viên, lịch sử hoặc file minh chứng.
CauHinh chỉ xuất các key được cho phép. Key ký Excel được sinh mới khi import;
không mang key thật của DB nguồn sang môi trường khác. Các marker migration được
xuất để chạy lại CLI không diễn giải nhầm trạng thái workflow đã nâng cấp.

Bản .bak đầy đủ được lưu riêng ngoài Git cho chuyển nội bộ, có cả dữ liệu/tài khoản
local. Restore .bak thay cho bộ SQL này, không chạy 02-catalogs.sql chồng lên backup.
Backup SQL không gồm file R2; kết nối DB trường, DUT SSO, R2 vẫn cần cấu hình riêng.

## Xuất lại

Script dùng Windows authentication, chỉ chấp nhận SQL loopback và hai DB local
được hỗ trợ. Dùng Windows PowerShell cùng các DLL SMO cài bởi SQL Server/SSMS:

```powershell
powershell -NoProfile -File scripts/database/export-local-db.ps1 -Database Studentpage_Integration_20261103 -SmoDirectory "C:/Program Files/Microsoft SQL Server/150/Setup Bootstrap/SQL2019/x64"
```

Có thể truyền -OutputDirectory để chọn thư mục xuất. Không dùng -IncludePrivateData
cho file đưa lên Git; file local-data.private.sql được gitignore trong thư mục này.
Script chỉ đọc DB nguồn, không tự chạy migration hoặc seed. Nên tạm dừng thay đổi
catalog khi xuất. Bản .bak dùng COPY_ONLY/CHECKSUM là bản phục hồi dữ liệu nhất quán.

Xem [VALIDATION.md](VALIDATION.md) và [manifest.json](manifest.json) cho kết quả/hash.

Hash trong manifest tính theo văn bản UTF-8 với xuống dòng LF; chuẩn hóa CRLF
của Windows sang LF trước khi so sánh hash.
