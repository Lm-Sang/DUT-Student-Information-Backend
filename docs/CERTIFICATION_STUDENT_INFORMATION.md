# Thông tin sinh viên và cơ sở cấp chứng chỉ

Cập nhật ngày 02/11/2026 cho `/api/certifications` (ngoại ngữ) và
`/api/it-certifications` (tin học).

## Dữ liệu trả cho chuyên viên

Danh sách `GET /reviewer/applications` và chi tiết
`GET /reviewer/applications/:applicationId` của cả hai API có các trường:

| Trường | Nội dung | Nguồn |
| --- | --- | --- |
| `fullName` | Họ và tên | Claim SSO đã xác minh chữ ký; profile DUT; thiếu thì `NhanThan.Hoten` |
| `studentCode` | MSSV | Profile DUT đã xác thực bằng accessToken; không lấy MSSV do client cung cấp |
| `className` | Lớp | Claim SSO đã xác minh; profile DUT; thiếu thì `NhanThan.Lop` |
| `cccd` | CCCD dạng chuỗi 12 chữ số, giữ số 0 đầu | Claim SSO đã xác minh; profile DUT; thiếu thì `NhanThan.CCCD_So`, sau đó `cmnd` nếu đủ 12 chữ số |

SQL dùng tài khoản `secondary`, database `DATA_SV1` và tham số `@studentCode`
kiểu `char(9)`:

```sql
SELECT TOP(2) MaHS AS studentCode, Hoten AS fullName, Lop AS className,
  CCCD_So AS citizenId, cmnd AS legacyIdentityNumber
FROM dbo.NhanThan WHERE MaHS = @studentCode;
```

Không giải mã JWT rồi tin claim khi chưa kiểm tra chữ ký. Profile DUT vẫn được
gọi để xác định MSSV và kiểm tra token. Nếu token có claim MSSV đã xác minh mà
không khớp profile, API từ chối. DB trường chỉ được đọc. Hai bản ghi cùng MSSV
được báo là cần đối chiếu; không tự chọn một bản ghi. CMND 9 chữ số không được
đổi thành CCCD bằng cách thêm số 0.

`GET /api/certifications/catalog` và `GET /api/it-certifications/form` trả bốn
trường trong `student`. Khi chuẩn bị và hoàn tất nộp, thiếu một trường sẽ trả
422, `details.code = CERT_STUDENT_INFORMATION_REQUIRED`, cùng `details.fields`.
Họ tên/lớp client gửi theo hợp đồng cũ vẫn được phân tích cú pháp nhưng backend
dùng thông tin đã xác thực để lưu. Không nhận CCCD do client tự khai trong body.

Ngoại ngữ lưu họ tên/lớp/CCCD trong `StudentCertificates`. Tin học lưu cả bốn
trường trong `tmCNTTChungChi_File.StudentSnapshotJson`, giữ nguyên các cột
nghiệp vụ gốc của `tmCNTTChungChi_SV`. Thông tin đã lưu không đổi khi đọc lại
hồ sơ hoặc khi danh mục thay tên. Hồ sơ cũ thiếu dữ liệu được tra bổ sung khi
xem; nếu DB trường cũng thiếu thì trường tương ứng trả `null`.
API `/api/it-certifications/records` dành cho chuyên viên cũng bổ sung bốn
trường này; dòng nhập cũ không có MSSV hợp lệ trả `null` cho phần không xác định.

## Danh mục cơ sở cấp ngoại ngữ

Hai bảng mới trong database local `Studentpage`:

- `certification.IssuingOrganizations`: mã, tên, trạng thái hoạt động, URL
  nguồn, ngày kiểm tra nguồn, revision và rowversion.
- `certification.CertificateTypeIssuers`: liên kết nhiều-nhiều giữa cơ sở cấp
  và loại chứng chỉ, có cờ hoạt động.

Mỗi loại trong `GET /api/certifications/catalog` có `issuingOrganizations`.
FE chỉ hiển thị những cơ sở đang hoạt động và liên kết với loại đó.

Request mới khi chuẩn bị hồ sơ ngoại ngữ:

```json
{
  "data": {
    "certificateTypeId": 3,
    "issuingOrganizationId": 1,
    "issuedOn": "2026-10-01",
    "result": { "overall": 6.5 },
    "notes": null
  },
  "files": [{ "fileName": "certificate.png", "contentType": "image/png", "sizeBytes": 123456 }]
}
```

Các ID trong ví dụ chỉ minh họa; lấy ID thật từ catalog. `result` theo schema
của loại đã chọn. `issuingOrganizationId` bắt buộc; cơ sở khác loại/bị tắt trả
422 `CERT_ISSUER_NOT_ALLOWED`. Liên kết còn được kiểm tra trong transaction SQL
ở bước chuẩn bị/hoàn tất. Khóa ngoại ngăn lưu cặp loại-cơ sở không hợp lệ.

Chi tiết trả thêm `issuingOrganizationId` và `issuingOrganization` (bản chụp
danh mục tại lúc nộp). Danh sách trả `issuingOrganizationId` và
`issuingOrganizationName`. Hồ sơ cũ chưa có cơ sở cấp trả `null`; hồ sơ upload
dở phải chọn cơ sở cấp rồi chuẩn bị lại trước khi hoàn tất.

Quản lý danh mục dùng quyền hiện có `certifications:catalog:manage`:

- `GET /api/certifications/management/catalog`: có thêm `issuers`.
- `POST /api/certifications/management/issuers`: thêm cơ sở cấp.
- `PATCH /api/certifications/management/issuers/:catalogId`: sửa cơ sở cấp,
  bắt buộc `If-Match` của bản ghi hiện tại.

Body thêm/sửa gồm `code`, `displayName`, `isActive`, `sourceUrl` (HTTPS),
`verifiedOn` (`YYYY-MM-DD`), `certificateTypeIds` (mảng ID các loại liên kết).
Không xóa cơ sở đang được tham chiếu; tắt `isActive` để ngừng nhận hồ sơ mới.

## Migration và nguồn danh mục ban đầu

Chạy tuần tự, có thể chạy lại:

1. [Migration cột/bảng/ràng buộc](sql/certifications-student-information-issuers.sql).
2. [Seed cơ sở cấp và liên kết](sql/certifications-issuers-seed.sql).

Đã áp dụng cho DB local `Studentpage` trong phiên làm việc này. Seed chỉ thêm
mã/liên kết chưa có, giữ thay đổi do người quản lý thực hiện. Ngày kiểm tra
nguồn là 02/11/2026. Không thay chính sách công nhận hoặc trạng thái xuất bản
loại chứng chỉ của DUT. Cơ sở cấp khác địa điểm tổ chức thi/đơn vị luyện thi;
ví dụ TOEIC liên kết ETS, không tự coi mọi trung tâm luyện TOEIC là đơn vị cấp.

| Loại | Danh mục ban đầu và nguồn chính thức |
| --- | --- |
| VSTEP | 38 đơn vị theo [danh sách Cục Quản lý chất lượng công bố 31/03/2025](https://vqa.moet.gov.vn/vi/thong-bao-quan-ly-khao-thi/thong-bao/cuc-quan-ly-chat-luong-cong-bo-danh-sach-cac-don-vi-to-chuc-thi-danh-gia-nang-luc-tieng-anh-theo-khung-nang-luc-ngoai-ngu-6-bac-dung-cho-viet-nam-du-lieu-cap-nhat-den-thang-03-2025-43.html). Đây là danh sách nguồn tại thời điểm công bố, cần quản lý cập nhật khi có quyết định mới. |
| IELTS | British Council, IDP; [IELTS](https://ielts.org/about-ielts). |
| TOEIC/TOEIC 4 kỹ năng/TOEFL | ETS; [TOEIC](https://www.ets.org/toeic/test-takers/scores.html), [TOEFL](https://www.ets.org/toefl/test-takers/ibt/faq/score-reports.html). Không bật lại các loại TOEFL hiện đang tắt. |
| Aptis ESOL | British Council; [kết quả và chứng chỉ](https://www.britishcouncil.vn/thi/aptis/ket-qua). |
| JLPT | Japan Foundation / JEES; [JLPT](https://www.jlpt.jp/e/faq/). |
| HSK/HSKK | Chinese Testing International; [dịch vụ chứng nhận](https://admin.chinesetest.cn/gospquestion.do?con=HSK). |
| DELF/DALF, TCF | Bộ Giáo dục Pháp (DELF/DALF); France Éducation international (TCF); [FEI](https://www.france-education-international.fr/hub/diplomes-tests?langue=fr). |
| J-TEST | 日本語検定協会・J.TEST事務局; [J.TEST](https://j-test.jp/). |
| TOCFL | Bộ Giáo dục Đài Loan, SC-TOP quản lý; [thông báo chứng chỉ](https://depart.moe.edu.tw/LA/News_Content.aspx?n=A2B4856EC48AD4BB&s=BA82EB1A6A12D2F1&sms=93C0F3C6842B8327). |

Kiểm tra SQL dùng schema tạm riêng, không tạo hồ sơ thật hoặc ghi R2:

```powershell
$env:CERT_STUDENT_DB_TEST='1'
node --test tests/integration/certification-student-information-sql.test.js
```
