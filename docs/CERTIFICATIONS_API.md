# Certification API — hướng dẫn tích hợp FE

Base URL: `/api/certifications`.
Collection: [certifications.postman_collection.json](data/certifications.postman_collection.json).
Tài liệu này mô tả API chức năng, không bao gồm tài khoản hoặc giao diện thử nghiệm local.

## Xác thực

Sinh viên gửi `Authorization: Bearer <DUT SSO access token>`. Backend xác thực
token bằng API hồ sơ DUT để lấy MSSV, tên, lớp; khóa tuyển sinh suy từ MSSV.
Không có sinh viên mặc định hoặc quyền tự cấp khi request thiếu token.

Các route `/reviewer` và `/management` cần backend nối adapter xác thực thật
qua `contextProvider(req, scope)` hoặc `reviewerAuthentication.actor(req, scope)`
khi gọi `createCertificationsModule`. `scope` là `student`, `reviewer` hoặc `catalog`;
adapter chuyên viên chỉ nhận hai scope sau. Chưa nối adapter thì trả 503 với
`CERT_AUTH_CONTEXT_REQUIRED`; module mặc định không cung cấp tài khoản hoặc route đăng nhập local.
FE cần thống nhất loại token/phiên chuyên viên với adapter được triển khai.

Adapter trả ngữ cảnh tin cậy: `role` (`student` hoặc `reviewer`), `source`,
`reference`, `name`, `permissions`; sinh viên có thêm `studentCode`, `cohortYear`.
Quản lý danh mục cần `permissions` chứa `certifications:catalog:manage`.
Không nhận vai trò, MSSV, khóa hoặc quyền từ dữ liệu do FE tự khai làm căn cứ xác thực.

## Database

Schema `certification` trong SQL Server local `Studentpage` có đúng tám bảng:

| Bảng | Lưu gì |
| --- | --- |
| Languages | Mã và tên ngôn ngữ, trạng thái xuất bản |
| CertificateTypes | Loại chứng chỉ, ngôn ngữ, FormSchemaJson, số cấu hình |
| CertificateLevels | Mã/tên bậc, trọng số và ID trường; liên kết loại chứng chỉ |
| RecognitionPolicies | Được nhận hay không theo khoảng khóa, lý do/văn bản |
| Applications | Chủ hồ sơ, MSSV/khóa từ server, trạng thái, lần nộp hiện tại |
| Submissions | Mỗi lần nộp, ResultJson, CatalogSnapshotJson, thông tin kê khai |
| EvidenceFiles | Metadata, ObjectKey trong evidence, trạng thái nhận và InspectionJson |
| Reviews | Người duyệt, quyết định, lý do và token hồ sơ đã xét |

Không có cột điểm dành riêng cho IELTS/TOEIC. Bảng phiên upload và kiểm tra
chất lượng riêng đã được gộp vào EvidenceFiles. Applications giữ hồ sơ xuyên
suốt; Submissions giữ các lần gửi và bổ sung.

DB chặn khoảng khóa chồng lấn, nhiều lần chuẩn bị đồng thời, sửa nội dung/ảnh
đã nộp, sửa kết quả duyệt, đổi chủ hồ sơ và chuyển trạng thái không hợp lệ.
Backend hỗ trợ cả v3 và v4. Với DB v3, TemporaryObjectKey được điền giá trị
metadata không sử dụng để tương thích ràng buộc cũ; không tạo object R2 tương ứng.
Hồ sơ đang upload theo luồng cũ cần xin URL mới. Bản mã nguồn này cần DB đã có
schema certification; không kèm script khởi tạo DB hoặc snapshot dữ liệu trường.
Không tự seed dữ liệu. Catalog đã được nhập
từ DB trường: 13 loại gốc, 40 dòng bậc; đã mở rộng thành 19 loại và 74 bậc.
HSK đủ 1–9; DELF A1–B2/DALF C1–C2; JLPT N5–N1, J-TEST; thêm TCF, HSKK, TOCFL.
NAT/TOPJ giữ trong quản trị, chưa xuất bản cho form sinh viên. Đã áp dụng quy
định thật do người dùng xác nhận: đến K23 nhận các loại đang mở; từ K24 chỉ
chặn TOEIC 2 kỹ năng. Không seed hồ sơ sinh viên.

## Quản lý danh mục và form

Người quản lý có quyền `certifications:catalog:manage`; quyền này tách khỏi
xét duyệt. Ngôn ngữ và loại mới mặc định chưa xuất bản nếu không gửi
`isPublished: true`. `isPublished` phục vụ xuất bản cấu hình, không dùng thay
cho quy định công nhận theo khóa.

Tạo ngôn ngữ:

```json
{ "code": "ru", "displayName": "Tiếng Nga", "isPublished": true }
```

Ví dụ cấu hình IELTS với ID ngôn ngữ thực tế (IELTS đã nhập từ nguồn, không POST tạo lại):

```json
{
  "languageId": 1,
  "code": "IELTS",
  "displayName": "Anh ngữ - IELTS",
  "isPublished": true,
  "formSchema": {
    "fields": [
      { "key": "overall", "label": "Điểm tổng", "type": "number", "required": true, "min": 0, "max": 9, "step": 0.5 }
    ]
  }
}
```

Trường number có min/max/step; trường select có options, ví dụ:

```json
{ "key": "level", "label": "Cấp độ", "type": "select", "required": true, "options": ["B1", "B2"] }
```

TOEIC bốn kỹ năng khai bốn trường listening, reading, speaking, writing.
Chứng chỉ Nga hoặc ngôn ngữ khác có thể khai các trường riêng, không cần đổi
cột DB hoặc mã backend. Tối đa 20 trường; không cho tên trường trùng hoặc
thực thi biểu thức/code tùy ý. Form nhận điểm hợp lệ, không tự xét đạt chuẩn đầu ra.

PATCH quản trị gửi đủ các trường như POST và header `If-Match: "rowVersion"`
từ bản ghi vừa đọc. Không chuyển loại đã được dùng sang một ngôn ngữ khác.
Đổi mã/tên hoặc form tăng revision; bản chụp trong lần nộp cũ giữ nguyên.
Riêng `isSchoolProvided=true`, mã/tên loại và mã/tên bậc phải giữ nguyên. Chỉ loại
`isSchoolProvided=false` được đổi mã/tên. Mã trường có thể chứa khoảng trắng và chữ
hoa/thường, ví dụ `Aptis Esol`, `TOEFLiBT`; không chuẩn hóa thành mã khác.
Các mã ngôn ngữ nguồn hiện tại là LN001..LN004, không đổi thành mã ISO tự đặt.

API trả `isSchoolProvided`, `levels`, `baseCertificateTypeId`. Mỗi bậc có
`id/code/displayName/weight`; không trả bản ghi nguồn lồng trong JSON.
Ví dụ lựa chọn `{"value":"VSTEP3","label":"VSTEP B1"}`: FE hiện tên bậc,
result lưu mã bậc. Giá trị NULL/rỗng của trường được giữ trong các cột bảng.
Form chọn bậc lưu `optionsFrom: "certificateLevels"` trong DB; API đọc bảng
bậc để trả `options` cho FE. PATCH có thể gửi lại options nguyên bản hoặc tham
chiếu này; mã/tên bậc của trường không được thay đổi.

## Công nhận theo khóa

Điều kiện thật người dùng xác nhận ngày 25/10/2026 đã được lưu trong DB:

| Khóa tuyển sinh | TOEIC 2 kỹ năng (`TOEIC`) | TOEIC 4 kỹ năng (`TOEIC_FOUR`) và các loại khác đang mở |
| --- | --- | --- |
| K23 trở về trước, gồm K22, K21… | Được nộp | Được nộp |
| K24 trở đi, gồm K25, K26… | Không tiếp nhận | Được nộp |

DB có bốn quy định ngôn ngữ được tiếp nhận không giới hạn khóa và hai khoảng
riêng cho loại TOEIC: đến 2023 được nhận, từ 2024 không được nhận. Phạm vi dưới
bắt đầu 1900 là giới hạn kỹ thuật của mô hình, không phải một mốc tuyển sinh
nghiệp vụ. Năm 2023/2024 là dữ liệu cấu hình, không có if theo khóa trong code.
Không suy hạn chế cho TOEIC_FOUR từ BaseCertificateTypeId.

Quy định được lưu trong RecognitionPolicies và quản lý qua API `/management/policies`.
FE đọc eligibility từ `/catalog`, không tự hardcode mốc khóa hoặc danh sách được nhận.
Khi thay đổi chính sách sau này, cập nhật bản ghi qua API quản trị và đối chiếu
file dữ liệu triển khai trước khi chạy lại SQL áp dụng cấu hình.

Ngày nộp không thay thế khóa tuyển sinh. Sinh viên K23 vẫn nộp TOEIC 2 kỹ năng
được sau năm 2024; sinh viên K24 không được nộp loại này dù chứng chỉ cấp trước đó.

Mỗi quy định chọn **languageId hoặc certificateTypeId**, không chọn cả hai.
Ngôn ngữ phải có khoảng được công nhận; thiếu quy định không mặc định cho phép.
Loại chưa có quy định riêng kế thừa ngôn ngữ; nếu đã khai khoảng riêng thì chỉ
các khoảng được nhận mới hợp lệ. Quy định loại không vượt lệnh cấm của ngôn ngữ.

Thu hẹp khoảng cũ trước khi thêm khoảng mới. DB từ chối các khoảng cùng đối
tượng chồng lấn. Backend kiểm tra khi xin URL và trước khi nhận hồ sơ; dùng
revision và khóa SQL để không ghi nhận một bộ quy định đã thay đổi giữa chừng.
Hồ sơ đã nộp/duyệt vẫn lưu và xem được qua bản chụp đã áp dụng.

## Nộp chứng chỉ

Base URL: `/api/certifications`.

1. GET /catalog khi mở form: nhận loại, formSchema, eligibility theo khóa và
   `maxFiles`, `maxFileBytes`, `imageValidation: {maxPixels, minImageSide, blurThreshold}`.
   FE kiểm tra toàn bộ ảnh tại thiết bị: định dạng thực PNG/JPEG, dung lượng,
   giải mã, kích thước, độ tương phản và độ mờ; có ảnh lỗi thì chưa xin URL.
2. POST /applications gửi thông tin + metadata ảnh đã qua kiểm tra, nhận URL PUT cho từng ảnh.
3. PUT bytes từng ảnh trực tiếp vào `certifications/evidence/` trên R2.
4. POST /applications/{applicationId}/complete kiểm tra toàn bộ ảnh và nộp.

Một ảnh có ba request trong thao tác Nộp; GET danh mục là thao tác mở form.
Không có API nháp, tạo phiên bản, complete từng file hoặc submit riêng.

Ví dụ body chuẩn bị:

```json
{
  "data": {
    "fullName": "Nguyễn Văn A",
    "className": "24T1",
    "certificateTypeId": 1,
    "issuedOn": "2026-01-01",
    "result": { "overall": 4.5 }
  },
  "files": [
    { "purpose": "general", "fileName": "certificate.png", "contentType": "image/png", "sizeBytes": 123456 }
  ]
}
```

ID/size là ví dụ, phải lấy ID thật và số byte chính xác. MSSV và cohortYear lấy
từ context server; nếu gửi studentCode thì phải khớp. Không nhận cohortYear từ
body. Không còn trường scores/scoreMode. Chỉ gửi result theo form đã đọc:

- IELTS: `{ "overall": 4.5 }`.
- Loại tự cấu hình cấp độ có thể dùng `{ "level": "B1" }`; VSTEP nguồn trường
  dùng `{ "level": "VSTEP3" }`, hiển thị nhãn nguyên bản `VSTEP B1`.
- TOEIC bốn kỹ năng: `{ "listening": 300, "reading": 300, "speaking": 130, "writing": 140 }`.

Response 201: `{applicationId, expiresAt, uploads: [{id, purpose, fileName, url, method, headers, expiresAt}]}`.
PUT đúng file/headers đã khai, bao gồm `Content-Type` và `If-None-Match: *`;
không gửi token backend, multipart hoặc JSON lên R2. Điều kiện được ký cùng URL,
R2 trả 412 khi key đã tồn tại: không thể ghi đè ảnh đã nhận bằng URL còn hạn.
Tham chiếu: [R2 conditional PutObject](https://developers.cloudflare.com/r2/api/s3/extensions/).
Khi PUT lỗi hoặc mất response, FE xin URL mới cho cùng hồ sơ rồi upload lại.
Sau khi tất cả PUT thành công, complete bằng JSON `{}`.

Response complete/get chứa `id, status, rowVersion, currentSubmission,
pendingSubmission, submissions`. currentSubmission là lần đã nhận gần nhất;
pendingSubmission là phần đang chuẩn bị; submissions là lịch sử đã nộp.

Backend đọc và kiểm tra lại ảnh tại ObjectKey, chỉ nhận nếu tất cả file đạt điều kiện,
rồi ghi files/submission/application trong một transaction. Mất response có
thể retry complete, không sinh bản trùng. Ảnh lưu R2, DB lưu metadata và kết quả.
Inspection needs_review chưa xác nhận chứng chỉ thật; quyết định do chuyên viên.

Giới hạn mặc định: 4 ảnh JPEG/PNG, mỗi ảnh tối đa 10 MiB. Cần bucket R2 private,
cấu hình CORS cho PUT từ FE và cho phép headers `Content-Type`, `If-None-Match`.
Không tạo object temporary trên R2, không copy hoặc dọn file tạm trong luồng mới.
Không đặt lifecycle xóa toàn bộ evidence: prefix này có cả ảnh đã nhận và ảnh đang upload.
Ảnh bị backend xác định không hợp lệ được xóa; lỗi DB/R2 tạm thời giữ ảnh hợp lệ
để retry complete. Ảnh upload bỏ dở hoặc từ URL cũ cần tác vụ đối soát DB/R2
riêng để dọn sau hạn URL; tác vụ này chưa được triển khai.
Kiểm tra FE là bước phản hồi sớm, backend vẫn xác minh nội dung khi complete.
Mặc định blurThreshold=0 chưa tự chặn ảnh mờ khi chưa hiệu chỉnh ngưỡng;
chất lượng đọc được không xác nhận chứng chỉ thật hoặc đủ nội dung.

## Trạng thái và bổ sung

| Trạng thái | Có sửa/thay ảnh? |
| --- | --- |
| uploading | Có, chưa nộp |
| submitted | Không, chờ duyệt |
| needs_changes | Có, tạo lần bổ sung |
| verified | Không |
| rejected | Không |

Bổ sung/xin lại URL dùng POST /applications với applicationId cấp ngoài cùng
và toàn bộ data/files. Khi bổ sung, hồ sơ vẫn needs_changes, currentSubmission
vẫn là bản cũ cho tới khi complete thành công. Chuyên viên không sửa hộ kết quả.

Xét duyệt gửi decision, verificationMethod và If-Match của **application.rowVersion**.
needs_changes và rejected phải có reason. Mỗi lần nộp chỉ có một quyết định;
hai chuyên viên không được ghi đè. Hồ sơ rejected phải kết thúc, không mở quyền sửa.

## API hiện tại

| Nhóm | Method | Path |
| --- | --- | --- |
| Sinh viên | GET | /catalog |
| Sinh viên | POST | /applications |
| Sinh viên | POST | /applications/{applicationId}/complete |
| Sinh viên | GET | /applications |
| Sinh viên | GET | /applications/{applicationId} |
| Sinh viên | GET | /applications/{applicationId}/files/{fileId}/download |
| Chuyên viên | GET | /reviewer/applications |
| Chuyên viên | GET | /reviewer/applications/{applicationId} |
| Chuyên viên | GET | /reviewer/applications/{applicationId}/files/{fileId}/download |
| Chuyên viên | POST | /reviewer/applications/{applicationId}/review |
| Quản trị | GET | /management/catalog |
| Quản trị | POST / PATCH | /management/languages và /management/languages/{id} |
| Quản trị | POST / PATCH | /management/types và /management/types/{id} |
| Quản trị | POST / PATCH | /management/policies và /management/policies/{id} |

Danh sách hỗ trợ page, pageSize, status. Sinh viên chỉ đọc hồ sơ của mình.
Chuyên viên mặc định xem hàng đợi submitted. URL xem ảnh hết hạn sau 120 giây.

Có 17 API backend; collection có thêm PUT R2 và GET ảnh trực tiếp. Nhóm quản trị
chỉ dùng khi thay danh mục/quy định, không phải bước nộp của sinh viên.

## Cấu hình và sử dụng collection

Chỉ import file collection ở đầu tài liệu, theo Postman v2.1 và giữ URL đầy đủ.
Ba thư mục: Quản lý danh mục, Sinh viên, Chuyên viên. Đọc quản lý danh mục trước;
không tạo lại mã trường hoặc các quy định đã nhập. Quy định thật đã áp dụng,
có thể đọc /catalog và thử nộp ngay theo khóa của tài khoản.
Chỉ tạo ngôn ngữ/loại mới khi cần bổ sung ngoài nguồn.

Đặt fileBytes chính xác. Ở PUT chọn Body binary. Với nhiều ảnh, đổi uploadIndex
và file tương ứng. Các POST từ Apidog tạo dữ liệu thật, không tự rollback.

Điền `studentAccessToken` bằng DUT SSO token. Các biến `reviewerAccessToken` và
`managementAccessToken` chỉ dùng khi adapter triển khai xác thực bằng Bearer;
nếu adapter dùng cookie thì điều chỉnh auth tương ứng và gửi credentials.
Không lưu token thật vào collection hoặc Git.

GET `/catalog` có `student` để FE điền thông tin và `imageValidation` để kiểm tra
ảnh trước khi xin URL. Token sai bị từ chối; token sinh viên không cấp quyền xét duyệt.

Backend cần `LOCAL_DB_NAME=Studentpage` trên SQL Server local, Windows Authentication
và ODBC driver tương ứng. Cấu hình R2 qua `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`,
`R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`; bật `CERTIFICATIONS_R2_PRIVATE_CONFIRMED`
sau khi xác nhận bucket private. Không đưa thông tin bí mật vào FE.

Lỗi chính: 400 body/cấu hình sai; 403 quyền/MSSV không khớp; 409 trạng thái,
token hoặc khoảng khóa xung đột; 410 URL hết hạn; 413 quá giới hạn metadata;
415 gửi sai JSON; 422 kết quả/ảnh/chính sách không hợp lệ; 428 thiếu If-Match;
502 R2 không đọc/xử lý được; 503 DB/storage chưa sẵn sàng.
