## Chứng chỉ tin học

Base URL: **`/api/it-certifications`**. Dùng chung xác thực DUT, R2 private và
kiểm tra ảnh với ngoại ngữ. Tin học dùng đúng cấu trúc DB gốc `tmProxDUT`.

### DB local và nhập dữ liệu gốc

Chạy [it-certifications.sql](sql/it-certifications.sql) trên **Studentpage**:

| Bảng | Vai trò |
| --- | --- |
| `dbo.tmCNTTChungChi` | Sao chép danh mục gốc: ID, MaCC, TenCC |
| `dbo.tmCNTTChungChi_SV` | Sao chép đủ 10 cột chứng chỉ sinh viên gốc |
| `dbo.tmCNTTChungChi_File` | Bảng bổ sung duy nhất: liên kết chứng chỉ, metadata R2, phiên upload, kiểm tra ảnh và xét duyệt |

Đối chiếu trực tiếp metadata nguồn ngày 26/10/2026: giữ nguyên tên, thứ tự cột,
kiểu dữ liệu, độ dài, collation, nullable và identity. Nguồn không có PK, index,
FK, trigger hoặc default trên hai bảng nghiệp vụ; bản sao cũng không thêm chúng.
`tmCNTTChungChi.ID` là `IDENTITY(1,1)`; `tmCNTTChungChi_SV.ID` là
`int NOT NULL`, **không tự tăng**. API cấp ID mới bằng MAX(ID)+1 trong transaction
khóa bảng. Khi import, giữ ID gốc và thực hiện ngoài thời gian có request ghi.

DB cho phép NULL giống nguồn để nhập dữ liệu cũ. API kê khai mới yêu cầu MaHS,
MaCC và **CoSoCapCC**; không thêm NOT NULL vào bảng gốc. MaHS_SoVaoSo được giữ
nguyên nếu truyền, không tự ghép. Không suy ra ngày sinh, điểm thi hoặc khóa thi.

Script chỉ tạo cấu trúc. Nhập catalog với cột ID, MaCC, TenCC và IDENTITY_INSERT
nếu giữ ID gốc; nhập chứng chỉ với đủ 10 cột dưới đây. Mã chứng chỉ lịch sử không
còn trong catalog vẫn nhập được vì không thêm FK; kê khai mới phải chọn mã trong
catalog hiện tại. Không tự gán trạng thái được công nhận cho dữ liệu import.

API không còn dùng bốn bảng it_certification.Applications/Submissions/EvidenceFiles/
Reviews. Chạy [script dọn schema cũ](sql/it-certifications-remove-empty-legacy.sql)
nếu cả bốn bảng trống; script từ chối khi có dữ liệu. Schema ngoại ngữ không thay đổi.

### Form và request

`GET /form` trả catalog (ID, MaCC, TenCC đọc từ tmCNTTChungChi), fields, student,
giới hạn file và kiểm tra ảnh. Họ tên/lớp chỉ hiển thị từ hồ sơ đăng nhập.

| Cột gốc / key trong data | Kiểu SQL | Kê khai mới |
| --- | --- | --- |
| ID | int NOT NULL | API cấp, không gửi lên |
| MaHS | nvarchar(9) NULL | Bắt buộc, 9 chữ số, khớp MSSV đăng nhập |
| MaCC | nvarchar(10) NULL | Bắt buộc, chọn từ catalog |
| SoHieu | nvarchar(20) NULL | Số hiệu, tùy chọn |
| SoVaoSo | nvarchar(30) NULL | Số vào sổ, tùy chọn |
| SoNgayQD | nvarchar(250) NULL | Số/ngày quyết định, tùy chọn |
| GhiChu | nvarchar(250) NULL | Ghi chú, tùy chọn |
| CoSoCapCC | nvarchar(250) NULL | **Bắt buộc nhập cơ sở cấp** |
| NgayCC | date NULL | Ngày cấp YYYY-MM-DD, tùy chọn |
| MaHS_SoVaoSo | nvarchar(100) NULL | Giữ đúng trường gốc, tùy chọn |

Ví dụ `POST /applications`:

```json
{
  "data": {
    "MaHS": "102240377",
    "MaCC": "CNTT01",
    "SoHieu": "SH-001",
    "SoVaoSo": "VS-001",
    "SoNgayQD": null,
    "GhiChu": null,
    "CoSoCapCC": "Trường Đại học Bách khoa",
    "NgayCC": "2026-10-01",
    "MaHS_SoVaoSo": null
  },
  "files": [
    {"purpose": "general", "fileName": "tin-hoc.png", "contentType": "image/png", "sizeBytes": 123456}
  ]
}
```

MSSV và số byte trên là ví dụ. purpose có thể bỏ qua; nếu gửi chỉ nhận general.
Các key cũ fullName/className/studentCode/birthDate/theoryScore/practicalScore/
examSession trong data không còn hỗ trợ. FE cần chuyển sang key gốc.

### Upload, xem dữ liệu và xét duyệt

1. FE đọc form/catalog và kiểm tra ảnh theo giới hạn backend.
2. POST /applications trả 201: `{applicationId, expiresAt, uploads}`.
3. PUT từng File lên URL R2 với headers đã ký: Content-Type và If-None-Match: *.
   Không gửi token DUT đến R2.
4. POST /applications/{applicationId}/complete, body {}, sau khi PUT đủ.

Ảnh ở `certifications/evidence/it/`. Mỗi lần kê khai lưu một dòng chứng chỉ gốc;
mỗi ảnh có một dòng metadata file. Chỉnh bản nháp cập nhật dòng chứng chỉ của bản
nháp; bổ sung sau needs_changes tạo dòng chứng chỉ và nhóm file mới để giữ lịch sử.
Chuẩn bị upload không đồng nghĩa đã được duyệt.

| Nhóm | Method | Path từ base URL tin học |
| --- | --- | --- |
| Sinh viên | GET | /form |
| Sinh viên | GET | /records |
| Sinh viên | POST | /applications |
| Sinh viên | POST | /applications/{applicationId}/complete |
| Sinh viên | GET | /applications |
| Sinh viên | GET | /applications/{applicationId} |
| Sinh viên | GET | /applications/{applicationId}/files/{fileId}/download |
| Chuyên viên | GET | /reviewer/records |
| Chuyên viên | GET | /reviewer/applications |
| Chuyên viên | GET | /reviewer/applications/{applicationId} |
| Chuyên viên | GET | /reviewer/applications/{applicationId}/files/{fileId}/download |
| Chuyên viên | POST | /reviewer/applications/{applicationId}/review |

`GET /records?page=1&pageSize=20` đọc trực tiếp bảng chứng chỉ gốc, gồm cả dòng
import chưa có file. Sinh viên chỉ xem MaHS của mình; chuyên viên xem toàn bộ.
Trả page, pageSize, totalRecords, totalPages, items; items giữ đủ 10 key cột gốc
và giá trị NULL. Records không nhận filter status.

Danh sách applications nhận page, pageSize, status; chuyên viên mặc định submitted.
Applications chỉ gồm hồ sơ có upload. Mỗi item có data chứa dòng chứng chỉ gốc,
cùng id UUID, studentCode, status, rowVersion và thời điểm. Chi tiết trả
currentSubmission, pendingSubmission, submissions; mỗi submission có **data**
chứa đủ 10 key gốc. Phân biệt data.ID số nguyên với UUID của metadata file.

Trạng thái: uploading → submitted → verified, needs_changes hoặc rejected.
Bổ sung: gửi applicationId, các trường gốc và toàn bộ ảnh. Verified/rejected khóa sửa.
Xét duyệt dùng `If-Match: "<rowVersion>"`, body `{decision, reason, verificationMethod}`;
reason bắt buộc với needs_changes/rejected. verificationMethod nhận
`document_comparison`, `issuer_lookup` hoặc `other`. URL xem ảnh chỉ cấp cho ảnh
đã complete; response không lộ bucket/key. Lỗi DB/R2 ở complete có thể retry và
giữ ảnh hợp lệ. URL hết hạn trả 410; xin URL mới cho cùng applicationId.

Kiểm thử SQL trong schema tạm: đặt `IT_CERT_DB_TEST=1` rồi chạy
`node --test tests/integration/it-certifications.test.js`.
