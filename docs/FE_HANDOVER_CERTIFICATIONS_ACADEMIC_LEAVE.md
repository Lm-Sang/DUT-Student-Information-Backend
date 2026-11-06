# Báo cáo bàn giao FE: Chứng chỉ và Đơn ngừng học / Gia hạn ngừng học

Nguồn dữ liệu và trạng thái mới nhất: [workflow chứng chỉ/nghỉ học](CERTIFICATIONS_ACADEMIC_LEAVE_WORKFLOW.md).
Chuyên viên/admin đọc hồ sơ và snapshot DB local; không bổ sung dữ liệu từ DB trường
khi mở danh sách/chi tiết. Admin phòng theo dõi, không duyệt tiếp sau chuyên viên.

Ngày đối chiếu: **27/10/2026**. Nội dung dựa trên code trong workspace tại thời điểm lập báo cáo, bao gồm các thay đổi đang phát triển chưa commit.

Mục đích: tổng hợp phần BE đã triển khai, hợp đồng API và công việc FE cần thực hiện để nối hai module. Phạm vi chứng chỉ gồm **ngoại ngữ và tin học**. Các chức năng dưới đây đã có trong code; điều kiện để triển khai và những phần còn thiếu được ghi riêng ở mục 6.

## 1. Tổng quan phần BE đã thực hiện

| Hạng mục | Phần đã triển khai ở BE | FE cần nối |
| --- | --- | --- |
| Xác thực sinh viên dùng chung | Nhận DUT SSO token, gọi API profile để xác thực và lấy MSSV/họ tên/lớp; context dùng chung ở module `students` | Dùng token của phiên DUT đang đăng nhập khi gọi API sinh viên |
| Chứng chỉ ngoại ngữ | Danh mục ngôn ngữ/loại/bậc, form kết quả động, chính sách công nhận theo khóa, hồ sơ, upload ảnh, nộp/bổ sung, xét duyệt, xem minh chứng | Form theo catalog, luồng upload ba bước, danh sách/chi tiết và màn hình chuyên viên |
| Chứng chỉ tin học | Danh mục và dữ liệu theo cột gốc, form kê khai, dữ liệu đã nhập, hồ sơ upload, xét duyệt | Tab tin học, năm trường kê khai, bảng dữ liệu gốc và cách đọc chi tiết riêng |
| Hạ tầng chứng chỉ | URL upload/download R2 private, kiểm tra ảnh tại BE, hàng đợi kiểm tra ảnh, thông báo SSE cho cả hai nhóm | PUT trực tiếp R2, xử lý retry/quá tải, một kết nối SSE cho trang chứng chỉ |
| Đơn ngừng học/gia hạn | Form điền sẵn, lý do/học kỳ hợp lệ, lưu/sửa nháp, xác nhận, hủy, yêu cầu bổ sung, duyệt online, nhận bản giấy | Form lập đơn, theo dõi trạng thái, màn hình xét duyệt và nhận giấy |
| Bản in đơn | Lưu snapshot khi xác nhận; dựng HTML/PDF A4 từ snapshot; cấp quyền mở PDF ngắn hạn | Nút xác nhận/in, mở PDF bằng URL BE sau khi cấp quyền in |
| Kiểm soát cập nhật | Kiểm tra quyền sở hữu, trạng thái và rowVersion khi thao tác cần chống ghi đè | Gửi đúng `If-Match`, tải lại dữ liệu khi có xung đột |
| Giao diện tham khảo | Đã có FE test sinh viên/chuyên viên trong `certification-web-test/` | Tham khảo cách gọi API để tích hợp vào FE chính |

Các API nghiệp vụ đã được đăng ký trong ứng dụng BE:

| Chức năng | Base path |
| --- | --- |
| Chứng chỉ ngoại ngữ | `/api/certifications` |
| Chứng chỉ tin học | `/api/it-certifications` |
| Đơn ngừng học / Gia hạn ngừng học | `/api/academic-leave` |

## 2. Quy ước tích hợp chung

### 2.1. URL và xác thực

BE local mặc định: `http://localhost:3003`. FE cấu hình một biến base URL theo môi trường; các path trong tài liệu được ghép với base URL này.

API sinh viên dùng:

Đăng nhập và tải form dùng token SSO/profile DUT trực tiếp. Không tự truy vấn DB
trường để bù các trường thiếu trong form chứng chỉ hoặc phần điền sẵn nghỉ học.
Trường chưa được nguồn xác minh cung cấp để trống; nộp/xác nhận vẫn kiểm tra dữ liệu bắt buộc.

```http
Authorization: Bearer <DUT_SSO_ACCESS_TOKEN>
Accept: application/json
```

Request có JSON body thêm `Content-Type: application/json`. Backend lấy danh tính từ token đã xác thực; FE không tự gán MSSV, khóa tuyển sinh, vai trò hoặc quyền để thay thế đăng nhập. Giữ MSSV, CCCD và điện thoại dạng chuỗi.

**Xác thực hiện hành:** sinh viên dùng nguyên token SSO; backend kiểm tra secret key/HS256/hạn dùng và logout, không yêu cầu issuer/audience SSO. Chứng chỉ/ngừng học phía quản trị dùng Bearer JWT BE channel admin với quyền tương ứng; API đơn dùng channel staff. Xem [AUTH_CHANNELS.md](AUTH_CHANNELS.md) để nối login, callback, refresh và logout.

Các adapter cookie thử nghiệm trước đây không phải hợp đồng auth hiện hành. Login/refresh/logout local dùng `/api/admin/auth` hoặc `/api/staff/auth` theo channel, gửi cookie với `credentials: 'include'` và Origin đúng frontend. API nghiệp vụ dùng access Bearer; không gửi token SSO sang API quản trị.

### 2.2. Response và dữ liệu đặc biệt

API JSON thành công:

```json
{ "success": true, "data": {} }
```

API JSON thất bại:

```json
{
  "success": false,
  "message": "Thông báo lỗi",
  "details": { "field": "Tên trường nếu có", "code": "Mã lỗi nếu có" }
}
```

`details`, `details.field` và `details.code` có thể không có. FE đọc dữ liệu ở `response.data` khi dùng Fetch đã parse JSON, hoặc `response.data.data` khi dùng Axios mặc định. Ngoại lệ: SSE trả stream; API in HTML trả `text/html`; API PDF trả `application/pdf`, không bọc JSON khi thành công.

Ngày cấp chứng chỉ dùng `YYYY-MM-DD`. Các thời điểm như nộp, duyệt, hạn giấy được trả dạng ISO UTC; FE chuyển sang giờ Việt Nam để hiển thị. Giá trị `0` cần giữ nguyên, `null` hiển thị là chưa có dữ liệu.

### 2.3. Phân biệt ID và phiên bản

| Loại dữ liệu | Cách dùng |
| --- | --- |
| Hồ sơ ngoại ngữ/tin học | `id` hoặc `applicationId` dạng UUID |
| Danh mục ngoại ngữ | ID số nguyên từ API |
| Chứng chỉ tin học gốc | `data.ID` là số nguyên, khác UUID hồ sơ; chọn tên theo `TenCC`, gửi mã `MaCC` |
| Đơn ngừng học | `id` là số nguyên để gọi `/applications/:id` |
| Mã đơn ngừng học | `requestCode`, ví dụ `NH1022303771`, dùng làm `MADN` khi mở PDF |
| `rowVersion` | Chuỗi hex 16 ký tự, giữ nguyên để gửi `If-Match`; không chuyển thành số |

Các thao tác sau cần header `If-Match: "<rowVersion>"` lấy từ bản ghi vừa đọc:

- Chứng chỉ: chuyên viên xét duyệt; quản trị PATCH danh mục/chính sách.
- Academic leave: PUT sửa đơn; POST xác nhận, hủy, xét duyệt và nhận giấy.

Response chi tiết/cập nhật có `rowVersion` cũng trả header `ETag`. FE có thể lấy phiên bản ngay từ JSON. Sau mỗi lần lưu phải thay dữ liệu và phiên bản hiện tại bằng response mới. Khi nhận `409`, tải lại chi tiết và cho người dùng kiểm tra trước khi thao tác tiếp.

POST chuẩn bị upload và POST complete của chứng chỉ không yêu cầu FE gửi `If-Match`. POST tạo nháp đơn mới và POST cấp quyền in cũng không cần header này.

## 3. Module chứng chỉ — Certification

### 3.1. BE đã triển khai

- Ngoại ngữ: đọc danh mục, cấu hình trường kết quả bằng `formSchema`, kiểm tra chính sách theo khóa tại lúc chuẩn bị và hoàn tất nộp. Form hỗ trợ trường `number` và `select`.
- Catalog trả `student` để điền thông tin, `eligible`/`eligibilityMessage` theo từng loại, giới hạn file và cấu hình kiểm tra ảnh.
- Sinh viên chuẩn bị hồ sơ, PUT ảnh trực tiếp lên R2, rồi gọi complete để BE kiểm tra ảnh và chuyển sang chờ xét duyệt.
- Sinh viên xem danh sách/chi tiết và bổ sung khi được yêu cầu; chuyên viên đối chiếu ảnh và chọn kết quả xét duyệt.
- Ngoại ngữ lưu hồ sơ hiện tại tại `certification.StudentCertificates`, metadata ảnh tại `certification.EvidenceFiles`; bổ sung cập nhật cùng hồ sơ, thay ảnh và xóa kết quả duyệt cũ.
- Tin học dùng các bảng local `certification.tmCNTTChungChi`, `certification.tmCNTTChungChi_SV`, `certification.tmCNTTChungChi_File`; giữ cấu trúc dữ liệu gốc. Bổ sung sau yêu cầu chỉnh sửa có thể tạo lượt kê khai mới, khác mô hình gọn của ngoại ngữ.
- Dùng chung SSE và hàng đợi kiểm tra ảnh cho cả hai nhóm. Kiểm tra chất lượng ảnh không tự xác nhận chứng chỉ thật hoặc đạt chuẩn đầu ra; chuyên viên quyết định xét duyệt.

Chính sách đang được mô tả trong tài liệu nghiệp vụ: K23 trở về trước nhận các loại đang mở; K24 trở đi chặn TOEIC hai kỹ năng, vẫn nhận TOEIC bốn kỹ năng và các loại khác đang mở. FE **đọc kết quả eligibility từ API**, không viết cố định mốc khóa hoặc danh sách loại được nhận. Cấu hình thực tế của môi trường bàn giao cần được kiểm tra lại qua `/catalog`.

### 3.2. FE cần làm với chứng chỉ ngoại ngữ

1. Khi mở trang, gọi `GET /api/certifications/catalog` và tải danh sách hồ sơ.
2. Điền thông tin từ `data.student`; dựng lựa chọn ngôn ngữ/loại từ `data.languages[].types[]`. Với loại không hợp lệ, khóa chọn/nộp và hiển thị `eligibilityMessage`.
3. Dựng trường kết quả từ `type.formSchema.fields`: `number` theo `min/max/step`; `select` theo `options`. Option có thể là chuỗi hoặc `{value, label}`; gửi `value`, hiển thị `label`.
4. Lấy họ tên/lớp, ngày cấp và kết quả đúng cấu hình; kiểm tra ảnh trước khi xin URL. Họ tên/lớp là trường bắt buộc trong payload ngoại ngữ; MSSV và khóa đã có trong context BE.
5. Thực hiện luồng upload ở mục 3.4; chỉ báo nộp thành công sau khi complete thành công.
6. Màn hình chi tiết đọc `result`, `catalogSnapshot`, `files` và `review` trực tiếp trên hồ sơ. Dùng snapshot để hiển thị loại/kết quả đã nộp khi catalog thay đổi về sau.
7. Khi `needs_changes`, gửi lại toàn bộ thông tin và ảnh mới kèm `applicationId` cũ; sau complete tiếp tục dùng cùng ID hồ sơ.

Ví dụ body `POST /api/certifications/applications`:

```json
{
  "data": {
    "fullName": "Nguyễn Văn A",
    "className": "23T1",
    "certificateTypeId": 1,
    "issuedOn": "2026-10-01",
    "result": { "overall": 5.5 },
    "notes": ""
  },
  "files": [
    {
      "purpose": "general",
      "fileName": "chung-chi.png",
      "contentType": "image/png",
      "sizeBytes": 123456
    }
  ]
}
```

ID loại và `result` ở trên chỉ minh họa; lấy theo catalog thật. `sizeBytes` phải bằng số byte của `File`. Ngày cấp ngoại ngữ không được ở tương lai. Khi bổ sung hoặc xin lại URL cho hồ sơ upload dở, thêm `"applicationId": "<UUID cũ>"` ở cấp ngoài cùng.

### 3.3. FE cần làm với chứng chỉ tin học

Base path: `/api/it-certifications`. Dùng `GET /form` thay cho `/catalog`; API trả `catalog`, `fields`, `student`, `maxFiles`, `maxFileBytes`, `imageValidation`.

Form có năm trường theo thứ tự:

| Nhãn hiển thị | Key trong `data` | Quy tắc |
| --- | --- | --- |
| Số hiệu | `SoHieu` | Tùy chọn, tối đa 20 ký tự |
| Cơ sở cấp chứng chỉ | `CoSoCapCC` | Bắt buộc, tối đa 250 ký tự |
| Số vào sổ | `SoVaoSo` | Tùy chọn, tối đa 30 ký tự |
| Tên chứng chỉ | `MaCC` | Bắt buộc; hiển thị `TenCC`, gửi `MaCC` từ catalog |
| Ngày cấp | `NgayCC` | Tùy chọn, `YYYY-MM-DD` hoặc `null` |

BE tự lấy `MaHS` từ MSSV đăng nhập. Các cột lịch sử `SoNgayQD`, `GhiChu`, `MaHS_SoVaoSo` không cần dựng ô nhập trên form này. Không gửi các key của ngoại ngữ như `fullName`, `className`, `result` vào `data` tin học.

Ví dụ body `POST /api/it-certifications/applications`:

```json
{
  "data": {
    "SoHieu": "SH-001",
    "CoSoCapCC": "Trường Đại học Bách khoa",
    "SoVaoSo": "VS-001",
    "MaCC": "CNTT01",
    "NgayCC": "2026-10-01"
  },
  "files": [
    { "purpose": "general", "fileName": "tin-hoc.png", "contentType": "image/png", "sizeBytes": 123456 }
  ]
}
```

`MaCC` là ví dụ; phải chọn mã đang có trong catalog.

**Cách đọc response tin học cần tách riêng trong FE:**

- Danh sách `/applications`: mỗi item có `data` là dữ liệu chứng chỉ và `certificateTypeName`.
- Chi tiết `/applications/:applicationId`: có `currentSubmission`, `pendingSubmission`, `submissions`. Các trường dữ liệu, file và review nằm trong submission; khi tiếp tục hồ sơ có bản đang chuẩn bị thì đọc `pendingSubmission`, khi xem bản đã nộp thì đọc `currentSubmission`.
- Ngoại ngữ trả các trường trực tiếp trên hồ sơ, không có ba trường submission nói trên. FE cần ánh xạ riêng hai cấu trúc trước khi dùng chung thành phần hiển thị.
- `/records` đọc bảng dữ liệu gốc, gồm cả dòng import chưa có ảnh/workflow. Không tự gắn trạng thái `verified` cho dòng chỉ có trong records.

### 3.4. Luồng upload chung cho hai nhóm

```text
GET catalog/form → kiểm tra ảnh tại FE
  → POST applications → PUT từng file lên R2 → POST applications/:applicationId/complete
  → hiển thị hồ sơ submitted
```

Response của bước chuẩn bị có HTTP `201`, dữ liệu nằm trong `data`:

```json
{
  "applicationId": "<UUID>",
  "expiresAt": "<ISO UTC>",
  "uploads": [
    {
      "id": "<UUID file>",
      "purpose": "general",
      "fileName": "chung-chi.png",
      "url": "<URL R2 đã ký>",
      "method": "PUT",
      "headers": { "Content-Type": "image/png", "If-None-Match": "*" },
      "expiresAt": "<ISO UTC>"
    }
  ]
}
```

FE cần xử lý các điểm sau:

- Ngoại ngữ nhận **đúng một ảnh**, kể cả TOEIC bốn kỹ năng. Tin học nhận từ một ảnh đến `maxFiles` của `/form` (mặc định BE là 4); FE test hiện chọn một ảnh. FE chính đọc giới hạn runtime để quyết định số ảnh cho phép.
- Chỉ nhận ảnh JPEG/PNG. Mặc định tối đa 10 MiB mỗi ảnh, nhưng phải đọc `maxFileBytes`; đọc thêm `imageValidation` để kiểm tra kích thước/chất lượng. `blurThreshold=0` hiện chưa chặn ảnh mờ theo ngưỡng.
- Nhận diện MIME thực tế từ nội dung; đuôi `.jpg`/`.jpeg` dùng `image/jpeg`, tên file viết hoa vẫn được xử lý. Ảnh PNG mang tên `.jpg` phải khai MIME thực tế là `image/png`.
- PUT **bytes của file** với đúng URL, method và headers BE trả. Không dùng multipart/JSON; không gửi DUT token hoặc cookie đến R2. Client PUT cần tách khỏi interceptor tự thêm Authorization của API BE.
- PUT đủ file thành công mới gọi complete với body `{}`. Có URL upload hoặc PUT thành công chưa có nghĩa đã nộp hồ sơ.
- Lưu `applicationId` ngay khi prepare thành công để tiếp tục cùng hồ sơ sau lỗi hoặc reload; trạng thái cuối cùng vẫn phải đọc lại từ BE.
- Nếu PUT lỗi, URL hết hạn hoặc R2 trả `412` do key đã có, trước hết tải lại trạng thái. Nếu hồ sơ còn được sửa, prepare lại cùng `applicationId` và đầy đủ `data/files` để nhận bộ URL mới. Không cố ghi đè bằng URL cũ.
- Nếu complete mất response, lỗi tạm thời hoặc quá tải, tải lại chi tiết và retry complete trên cùng ID khi còn phù hợp; BE giữ ảnh hợp lệ cho retry. Nếu ảnh bị xác định không hợp lệ, cần chọn ảnh đạt yêu cầu và prepare/upload lại.
- `processing: true` nghĩa BE đang kiểm tra; khóa thao tác nộp/sửa trùng. Nút nộp cần hiển thị tiến độ và tránh bấm hai lần trong lúc request đang chạy.

### 3.5. Endpoint FE cần gọi

Các path dưới đây ghép sau base ngoại ngữ hoặc base tin học, trừ những dòng ghi riêng.

| Vai trò | Method và path | Mục đích |
| --- | --- | --- |
| Sinh viên | `GET /catalog` — chỉ ngoại ngữ | Catalog, form động, eligibility và giới hạn ảnh |
| Sinh viên | `GET /form` — chỉ tin học | Catalog, năm trường kê khai và giới hạn ảnh |
| Sinh viên | `POST /applications` | Chuẩn bị mới/bổ sung, nhận URL upload |
| Sinh viên | `POST /applications/:applicationId/complete` | Kiểm tra ảnh và hoàn tất nộp, body `{}` |
| Sinh viên | `GET /applications` | Danh sách của tài khoản hiện tại |
| Sinh viên | `GET /applications/:applicationId` | Chi tiết hồ sơ |
| Sinh viên | `GET /applications/:applicationId/files/:fileId/download` | Xin URL xem/tải ảnh đã complete |
| Sinh viên | `GET /records` — chỉ tin học | Dữ liệu chứng chỉ gốc của sinh viên |
| Chuyên viên | `GET /reviewer/applications` | Danh sách, mặc định lọc `submitted` |
| Chuyên viên | `GET /reviewer/applications/:applicationId` | Chi tiết để đối chiếu |
| Chuyên viên | `GET /reviewer/applications/:applicationId/files/:fileId/download` | Xin URL minh chứng |
| Chuyên viên | `POST /reviewer/applications/:applicationId/review` | Lưu kết quả xét duyệt, cần `If-Match` |
| Chuyên viên | `GET /reviewer/records` — chỉ tin học | Dữ liệu gốc toàn bộ sinh viên |

Danh sách applications nhận `page`, `pageSize`, `status`; mặc định 20 dòng/trang, `pageSize` tối đa 100. Response có `page`, `pageSize`, `totalRecords`, `totalPages`, `items`. Records tin học chỉ nhận `page`, `pageSize`.

API download trả `{url, expiresIn}` trong `data`, URL hiện có hạn 120 giây. FE dùng URL để xem ảnh; khi hết hạn gọi lại API cấp URL, không tự ghép bucket/object key.

Nếu FE làm màn hình quản trị danh mục ngoại ngữ, dùng `/api/certifications/management/catalog` và POST/PATCH `/management/languages`, `/management/types`, `/management/policies`. Cần quyền `certifications:catalog:manage`; PATCH gửi đủ dữ liệu và `If-Match`. Danh mục có `isSchoolProvided` cần tuân thủ khóa định danh nguồn trường. Hợp đồng đầy đủ nằm trong [CERTIFICATIONS_API.md](CERTIFICATIONS_API.md).

### 3.6. Trạng thái và màn hình xét duyệt

| `status` | Nhãn gợi ý | Thao tác sinh viên | Thao tác chuyên viên |
| --- | --- | --- | --- |
| `uploading` | Chưa nộp | Tiếp tục/sửa để nộp; khóa khi `processing=true` | Xem, chưa xét duyệt |
| `submitted` | Chờ kiểm tra online | Xem | Xác nhận tiếp nhận sang `processing` / Yêu cầu bổ sung / Từ chối |
| `processing` | Đang xử lý | Xem | Chấp nhận `verified` / Từ chối |
| `needs_changes` | Cần bổ sung | Sửa, chọn lại ảnh, nộp bổ sung cùng ID | Xem |
| `verified` | Đã xác nhận chứng chỉ | Xem | Xem |
| `rejected` | Đã từ chối | Xem | Xem |

Body xét duyệt dùng chung hai nhóm:

```json
{
  "decision": "verified",
  "reason": "",
  "verificationMethod": "document_comparison"
}
```

Khi `submitted`, `decision` nhận `processing`, `needs_changes`, `rejected`; khi `processing`, nhận `verified`, `rejected`. Bổ sung/từ chối bắt buộc `reason` (tối đa 2000 ký tự). Khi `verified`, `verificationMethod` bắt buộc là `document_comparison`, `issuer_lookup` hoặc `other`; thao tác khác có thể bỏ trường này. FE gửi `If-Match` của **hồ sơ**, không lấy phiên bản từ file/submission. Không thể chấp nhận thẳng từ `submitted`.

### 3.7. SSE cập nhật kết quả

- Sinh viên mở `GET /api/certifications/events` với Bearer token.
- Chuyên viên mở `GET /api/certifications/reviewer/events` bằng cơ chế xác thực chuyên viên.
- Hai nhóm ngoại ngữ/tin học dùng chung kênh này; không có `/api/it-certifications/events`. Academic leave chưa có kênh SSE.

Event `certificate.updated` có payload:

```json
{ "kind": "it", "applicationId": "<UUID>", "status": "verified", "rowVersion": "<16-hex>" }
```

`kind` là `language` hoặc `it`. FE gọi lại API danh sách/chi tiết tương ứng, vì event chỉ báo thay đổi. Khi nhận `connected` hoặc reconnect, tải lại trạng thái hiện tại; BE chưa có replay sự kiện.

FE dùng Fetch streaming để gửi Bearer header cho sinh viên; `EventSource` gốc không đặt được header Authorization tùy ý. Mỗi trang giữ một kết nối, đóng khi rời trang/ẩn tab/đăng xuất, reconnect có backoff và tải lại dữ liệu khi quay lại. Gộp sự kiện đến dồn và tránh tải lại ghi đè form đang thao tác. Không đưa token vào query string.

## 4. Module Academic leave — Đơn ngừng học / Gia hạn ngừng học

### 4.1. BE đã triển khai

- Hai loại đơn: `leave` và `extension`. Bốn lý do: `medical` (chữa bệnh), `accident` (tai nạn), `military` (nghĩa vụ quân sự), `maternity` (thai sản).
- Lấy học kỳ chính hiện tại từ cấu hình trường; chỉ cho chọn kỳ trước, kỳ hiện tại hoặc kỳ sau. Mỗi lần đề nghị từ 1 đến 4 kỳ, không tính kỳ hè vào thời lượng.
- Gia hạn phải liên kết đơn cùng chủ sở hữu đã được chấp nhận cuối cùng ở `approved`; bắt đầu nối tiếp kỳ cuối của đơn trước và lập ở học kỳ hiện tại.
- Một sinh viên chỉ có một đơn đang `draft`/`submitted`/`needs_changes`/`received`/`processing` cùng lúc; kiểm tra khoảng thời gian trùng khi xác nhận. Một đơn cha chỉ có một đơn kế tiếp chưa hủy/chưa từ chối; muốn gia hạn tiếp thì nối tới đơn đã chấp nhận gần nhất.
- Lưu tại `academic_leave.Applications` trong DB local. Mã đơn là `NH + MSSV + số thứ tự riêng của sinh viên`, ví dụ `NH1022303771`; sửa/in lại không cấp mã mới.
- Lúc xác nhận, BE lấy lại thông tin và lưu snapshot. Chi tiết/bản in dùng dữ liệu đã chốt. Bổ sung rồi xác nhận lại cập nhật snapshot trên cùng đơn và xóa kết quả duyệt cũ.
- Xác nhận sẽ tiếp nhận online chuyển sang `received`, ghi mốc nộp giấy +3 ngày. Qua mốc vẫn giữ `received`; `overdue: true` chỉ để hiển thị, không chặn nhận giấy muộn.
- Dựng HTML/PDF từ snapshot; PDF trả trực tiếp khi yêu cầu, không lưu file PDF trong DB hoặc R2.

`received` là đã xác nhận sẽ tiếp nhận, đang chờ giấy; nhận giấy chuyển `processing`; `approved` là chấp nhận cuối cùng. Thao tác này không tự cập nhật quyết định/trạng thái học tập vào DB trường.

### 4.2. FE cần làm khi mở form

Gọi `GET /api/academic-leave/form`. Dữ liệu trả về trong `data`:

| Field | FE sử dụng |
| --- | --- |
| `prefill.student` | Hiển thị họ tên, MSSV, ngày sinh, CCCD, điện thoại, lớp |
| `prefill.academicRows` | Hiển thị bảng học kỳ: `semester`, `credits`, `gpa`, `conduct` |
| `reasons` | Dựng danh sách lý do theo `code`/`label` |
| `semesters` | Dựng ba kỳ theo `code`, `label`, `position`; có thể mặc định `position=current` |
| `minSemesterCount`, `maxSemesterCount` | Giới hạn số kỳ |
| `eligibleParents` | Danh sách đơn trước có thể chọn khi gia hạn |
| `paperSubmissionDays` | Thông báo thời hạn nộp giấy |

Thông tin cá nhân và bảng điểm là dữ liệu từ nguồn, dùng để đối chiếu. FE không gửi lại snapshot hoặc các thông tin này trong body lập đơn. Nếu thiếu thông tin, báo người dùng kiểm tra nguồn; lúc xác nhận BE yêu cầu đủ họ tên/lớp/điện thoại, ngày sinh hợp lệ và CCCD 12 chữ số, nếu thiếu trả `422`.

BE đã chuẩn hóa dòng kỳ hè `XX21` vào kỳ 2 `XX20`, ưu tiên số liệu kỳ chính nếu có cả hai. FE hiển thị `academicRows` trả về, không cộng/gộp lại điểm hoặc tín chỉ. Ba học kỳ lựa chọn chỉ áp dụng **kỳ bắt đầu**, không cắt bảng điểm còn ba dòng.

### 4.3. Luồng lập đơn và xác nhận

1. Tải `/form` và `/applications`.
2. Người dùng chọn loại đơn, lý do, kỳ bắt đầu, số kỳ và nội dung bổ sung. Với gia hạn, chọn từ `eligibleParents`, lấy `parent.returnSemester.code` làm kỳ bắt đầu và khóa sửa kỳ này. Nếu kỳ nối tiếp không thuộc `form.semesters`, báo chưa thể lập gia hạn với đơn đó.
3. `POST /applications` lưu nháp, nhận lại `id`, `requestCode`, `rowVersion` và trạng thái.
4. Sửa đơn bằng `PUT /applications/:id`, gửi **đầy đủ payload** và `If-Match` mới nhất; không dùng PATCH.
5. Khi người dùng xác nhận lập đơn, nếu có thay đổi chưa lưu thì lưu trước; gọi `POST /applications/:id/confirm` với `{}` và `If-Match` của lần lưu vừa xong.
6. Dùng response để cập nhật trạng thái `submitted`, khóa sửa và bật nút in theo `canPrint`.
7. Nếu chuyên viên yêu cầu bổ sung, sửa và xác nhận lại **cùng ID/mã đơn**. Muốn hủy, dùng `/cancel`; chỉ áp dụng khi `draft` hoặc `needs_changes`.

Body tạo/sửa đơn:

```json
{
  "kind": "leave",
  "parentApplicationId": null,
  "reasonCode": "medical",
  "startSemesterCode": "2610",
  "semesterCount": 2,
  "content": "Thông tin bổ sung"
}
```

Mã kỳ `2610` là ví dụ; phải lấy từ `/form`. `kind=extension` bắt buộc có `parentApplicationId` số nguyên của đơn trước; `kind=leave` dùng `null`. `content` tối đa 2000 ký tự. Không gửi `studentCode`, `snapshot`, `status`, `requestCode`, thông tin chuyên viên hoặc hạn nộp giấy; request có key ngoài hợp đồng sẽ bị từ chối.

Response chi tiết ngoài các trường nội dung còn có `status`, `statusLabel`, `reasonLabel`, `rowVersion`, `snapshot`, `studentConfirmedAt`, `reviewerName`, `reviewNote`, `reviewedAt`, `paperDeadlineAt`, `paperReceivedAt`, `printUrl`, `startSemester`, `endSemester`, `returnSemester`, `overdue`, `canEdit`, `canPrint`. FE ưu tiên các nhãn/cờ BE trả để điều khiển hiển thị; thao tác vẫn được BE kiểm tra lại.

### 4.4. Endpoint cần nối

Tất cả path ghép sau `/api/academic-leave`.

| Vai trò | Method và path | Body / lưu ý |
| --- | --- | --- |
| Sinh viên | `GET /form` | Form và dữ liệu điền sẵn |
| Sinh viên | `GET /applications?page=1&status=submitted` | Có thể bỏ `status` để xem mọi trạng thái |
| Sinh viên | `POST /applications` | Payload tạo nháp, HTTP 201 |
| Sinh viên | `GET /applications/:id` | Chi tiết đơn |
| Sinh viên | `PUT /applications/:id` | Payload sửa đầy đủ + `If-Match` |
| Sinh viên | `POST /applications/:id/confirm` | `{}` + `If-Match` |
| Sinh viên | `POST /applications/:id/cancel` | `{}` + `If-Match` |
| Sinh viên | `GET /applications/:id/print` | HTML từ snapshot, có xác thực |
| Sinh viên | `POST /print-session` | `{ "MADN": "<requestCode>" }`, Bearer + credentials include |
| Chuyên viên | `GET /reviewer/applications` | Có `page`, `status`; FE gửi `status=submitted` nếu muốn hàng chờ |
| Chuyên viên | `GET /reviewer/applications/:id` | Chi tiết để xét duyệt |
| Chuyên viên | `POST /reviewer/applications/:id/review` | `{decision,note}` + `If-Match` |
| Chuyên viên | `POST /reviewer/applications/:id/receive-paper` | `{}` + `If-Match` |
| Chuyên viên | `GET /reviewer/applications/:id/print` | HTML có xác thực |
| Chuyên viên | `POST /reviewer/print-session` | `{ "MADN": "<requestCode>" }`, dùng phiên chuyên viên |
| Phiên in đã cấp quyền | `GET /print?MADN=<requestCode>` | PDF inline, không parse JSON khi thành công |

Danh sách chỉ nhận `page` và `status`, cố định **20 dòng/trang**; không gửi `pageSize` hoặc query tìm kiếm tự đặt. Response có `page`, `pageSize`, `totalRecords`, `items`; chưa có `totalPages`, FE tính `Math.ceil(totalRecords / pageSize)`. Danh sách không có snapshot đầy đủ, cần gọi chi tiết khi mở đơn.

### 4.5. Trạng thái, xét duyệt và nhận giấy

| `status` | Nhãn gợi ý | Sinh viên | Chuyên viên |
| --- | --- | --- | --- |
| `draft` | Bản nháp | Sửa, xác nhận, hủy | Xem |
| `submitted` | Chờ kiểm tra online | Xem/in | Xác nhận sẽ tiếp nhận `received`, yêu cầu bổ sung, từ chối |
| `needs_changes` | Cần bổ sung | Sửa, xác nhận lại, hủy | Xem |
| `received` | Đã xác nhận sẽ tiếp nhận · chờ giấy | Xem/in, thấy mốc +3 ngày | Xác nhận nhận giấy; không được từ chối ở bước này |
| `processing` | Đã nhận giấy · đang xử lý | Xem/in | Chấp nhận `approved` / Từ chối |
| `approved` | Đã chấp nhận | Xem/in | Xem |
| `rejected` | Không duyệt | Xem | Xem |
| `cancelled` | Đã hủy | Xem | Xem |

Body xét duyệt:

```json
{ "decision": "received", "note": "Đã kiểm tra online, xác nhận sẽ tiếp nhận bản giấy" }
```

Khi `submitted`, `decision` nhận `received`, `needs_changes`, `rejected`; khi `processing`, nhận `approved`, `rejected`. Bổ sung/từ chối bắt buộc `note` (tối đa 1000 ký tự). Module này dùng **`note`** và kết quả cuối **`approved`**, không dùng `reason`/`verified`.

BE ghi `receivedAt` và mốc `paperDeadlineAt=receivedAt+3 ngày` khi xác nhận sẽ tiếp nhận. `overdue` chỉ để hiển thị, không khóa nhận giấy. Nút nhận giấy gọi `/receive-paper` đưa đơn sang `processing`, tự ghi thời điểm/người nhận; thao tác in không đồng nghĩa đã nhận giấy. Không cho từ chối trong giai đoạn chờ giấy.

Academic leave hiện chưa có SSE. FE tải lại danh sách/chi tiết sau thao tác, khi quay lại trang hoặc khi người dùng bấm tải lại; không dùng sự kiện của chứng chỉ để suy trạng thái đơn.

### 4.6. Mở và in PDF

Luồng FE cần thực hiện khi người dùng bấm **In đơn**:

1. Kiểm tra `canPrint`; mở tab trống ngay trong sự kiện click để tránh bị trình duyệt chặn popup.
2. Sinh viên gọi `POST /api/academic-leave/print-session` với Bearer token, `credentials: 'include'` và body `{ "MADN": row.requestCode }`. Chuyên viên dùng `/reviewer/print-session` với phiên chuyên viên.
3. BE đặt cookie in HttpOnly, SameSite Strict, hạn 5 phút; response `data` là `{url, expiresInSeconds: 300}`.
4. Chuyển tab đã mở tới URL BE trả, ghép với base URL BE. PDF mở inline trong trình xem của trình duyệt để tải/in.
5. Nếu cấp quyền hoặc render lỗi, hiển thị lỗi và cho bấm in lại. Nếu xác nhận đã thành công nhưng PDF lỗi, giữ đơn vừa nộp và chỉ retry bước in, không tạo/xác nhận đơn mới.

FE/API phải cùng site để cookie SameSite Strict được gửi; local `localhost` khác cổng đáp ứng điều này. Tránh trộn `localhost` và `127.0.0.1`. Khi deploy hai site khác nhau, cần BE thống nhất lại cơ chế truy cập PDF trước khi nối.

URL in có dạng `/api/academic-leave/print?MADN=NH1022303771`, không chứa token. Chỉ biết mã không đủ quyền mở. Khi cookie hết hạn hoặc đơn được xác nhận lại sau bổ sung, bấm In để cấp quyền mới. Cookie hiện cấp cho một mã đơn tại một thời điểm trên cùng trình duyệt; mở mã khác có thể cần cấp lại quyền cho mã cũ.

## 5. Xử lý lỗi và hành vi FE dùng chung

| HTTP / tình huống | FE xử lý |
| --- | --- |
| `400` | Hiển thị lỗi nhập liệu từ `message`; gắn vào trường nếu có `details.field`; kiểm tra key/query ngoài hợp đồng |
| `401` ở API nghiệp vụ | Yêu cầu đăng nhập lại theo vai trò, hủy kết nối SSE và dữ liệu phiên cũ |
| `401` ở link PDF | Cấp lại print-session từ màn hình đang đăng nhập rồi mở lại PDF |
| `403` | Thông báo không có quyền/tài khoản không phù hợp; kiểm tra có dùng nhầm token sinh viên ở FE chuyên viên |
| `404` | Báo không tìm thấy hoặc không truy cập được hồ sơ; cập nhật lại danh sách |
| `409` | Tải lại chi tiết/trạng thái/rowVersion; giữ nội dung đang nhập để người dùng đối chiếu trước khi thử tiếp |
| `410` ở complete chứng chỉ | Phiên upload hết hạn; đọc lại hồ sơ rồi prepare lại cùng ID nếu còn được sửa |
| R2 `412` | Key đã tồn tại; kiểm tra trạng thái và xin bộ URL mới khi cần, không ghi đè URL cũ |
| `413` / `415` | Kiểm tra dung lượng metadata và Content-Type; file gửi trực tiếp R2, JSON gửi BE |
| `422` | Hiển thị lý do chính sách/kết quả/ảnh/hồ sơ nguồn không đạt; hướng dẫn sửa đúng nguyên nhân |
| `428` | Bổ sung `If-Match` từ bản ghi mới nhất rồi cho thao tác lại |
| `429` | Giảm request, đợi theo `Retry-After` nếu có; tránh tạo nhiều kết nối SSE |
| `502` / `503` | Thông báo dịch vụ nguồn/DB/R2/PDF/adapter chưa sẵn sàng; cho thử lại theo `Retry-After` nếu có |
| Mất mạng/mất response | Đọc lại hồ sơ trước khi retry; tiếp tục cùng ID đã cấp |

Với `CERT_IMAGE_QUEUE_FULL` / `CERT_IMAGE_QUEUE_TIMEOUT`, giữ ID và retry complete sau khoảng chờ; không tạo hồ sơ mới. API PDF khi thất bại có thể trả JSON lỗi, FE không mặc định mọi response của URL in đều là PDF.

FE cần thống nhất loading, trạng thái rỗng, lỗi, khóa nút lúc đang lưu và xử lý đổi tài khoản. Khi đổi token/tài khoản, bỏ dữ liệu hồ sơ và kết nối thuộc phiên cũ. Các thông báo API cần được hiển thị bằng text, dữ liệu cá nhân không đưa vào log hoặc URL.

## 6. Điều kiện bàn giao và phần còn cần BE / triển khai hoàn thiện

| Hạng mục | Hiện trạng / việc cần thực hiện | Bên thực hiện chính |
| --- | --- | --- |
| Xác thực chuyên viên thật | Module mặc định chưa nối adapter; cần thống nhất phiên/quyền và cấu hình trước khi FE chuyên viên dùng trên môi trường triển khai | BE + bên quản lý SSO/quyền; FE nối theo hợp đồng đã chốt |
| SQL migration | Các tài liệu API/test có tham chiếu `docs/sql/academic-leave.sql`, migration chứng chỉ ngoại ngữ/tin học, nhưng **workspace tại ngày lập báo cáo chưa có thư mục `docs/sql`**. Cần bổ sung bộ migration và xác minh DB đích | BE |
| Postman collection | Tài liệu chứng chỉ dẫn `docs/data/certifications.postman_collection.json`, nhưng file chưa có trong workspace hiện tại; nếu bàn giao collection cần bổ sung | BE |
| R2 | Cần bucket private, cấu hình secret chỉ ở BE, CORS cho origin FE và các header PUT `Content-Type`, `If-None-Match`. FE không giữ R2 credential | BE / triển khai |
| CORS BE và URL FE | Khai báo origin FE sinh viên/chuyên viên qua cấu hình; cookie dùng credentials không đi với wildcard origin. Giữ FE/API cùng site cho luồng in hiện tại | BE / triển khai + FE |
| Nguồn dữ liệu đơn | BE cần kết nối profile DUT, API thống kê điểm, DB nhân thân và cấu hình học kỳ trường. FE lấy dữ liệu điền đơn qua `/form` | BE / triển khai |
| Chromium và font PDF | `puppeteer-core` cần Chrome/Edge/Chromium có sẵn; có thể đặt `PDF_BROWSER_EXECUTABLE`, cài font tiếng Việt. Nhiều instance cần thống nhất `LEAVE_PRINT_COOKIE_SECRET` | BE / triển khai |
| SSE nhiều instance | Broker hiện trong một process Node; muốn nhiều instance cần pub/sub dùng chung và cấu hình proxy hỗ trợ streaming | BE / triển khai |
| Giới hạn xử lý ảnh/PDF | Có queue giới hạn trong process; chưa có bằng chứng benchmark tải thật trong lần soạn báo cáo này | BE / triển khai; FE xử lý chờ/quá tải |
| Dọn ảnh bỏ dở | Chưa có tác vụ đối soát DB/R2 riêng cho ảnh upload bỏ dở | BE |
| Đơn/quyết định cũ | Academic leave chưa có luồng nhập đơn cũ, đồng bộ quyết định sang hệ thống trường hoặc xử lý ngoại lệ gia hạn hạn nộp giấy | BE + chủ nghiệp vụ khi có yêu cầu |
| Ý nghĩa số liệu học tập | Cần chủ nghiệp vụ xác nhận ý nghĩa GPA và tín chỉ trước khi dùng bản in chính thức; không tự suy thành GPA tích lũy hoặc tín chỉ đã đạt | Chủ nghiệp vụ + BE |

Phần đã có code chưa đồng nghĩa môi trường production đã sẵn sàng. Báo cáo này không xác nhận tình trạng DB/R2/SSO thật; cần kiểm tra trên môi trường bàn giao sau khi hoàn tất các điều kiện trên.

## 7. Danh sách công việc bàn giao cho FE

### 7.1. Công việc cần triển khai

- [ ] Cấu hình base URL BE, client sinh viên và client chuyên viên; nối DUT SSO/phiên chuyên viên theo môi trường.
- [ ] Tạo trang chứng chỉ với hai tab ngoại ngữ/tin học, danh sách, lọc trạng thái, phân trang và chi tiết.
- [ ] Dựng form ngoại ngữ theo schema/eligibility và form tin học theo năm trường; tách cách đọc DTO hai nhóm.
- [ ] Tích hợp kiểm tra ảnh, prepare → PUT R2 → complete; tiến độ, tiếp tục hồ sơ dở và nộp bổ sung cùng ID.
- [ ] Tạo màn hình xét duyệt chứng chỉ, xem ảnh bằng URL ngắn hạn, bắt buộc lý do khi cần, gửi `If-Match`.
- [ ] Nối một kênh SSE chung cho chứng chỉ, reconnect và đồng bộ lại dữ liệu khi quay lại trang.
- [ ] Tạo trang đơn ngừng học/gia hạn: điền sẵn, lý do, ba kỳ, số kỳ, chọn đơn cha, lưu/sửa nháp, xác nhận và hủy.
- [ ] Tạo chi tiết đơn với snapshot, kết quả duyệt, hạn giấy, trạng thái quá hạn, nút in và quyền sửa theo BE.
- [ ] Tạo màn hình chuyên viên duyệt đơn và xác nhận nhận giấy đúng hạn.
- [ ] Nối print-session → mở PDF, xử lý popup/cookie hết hạn/lỗi render.
- [ ] Áp dụng loading/lỗi/quyền truy cập/đổi phiên và cập nhật rowVersion sau mỗi thao tác.
- [ ] Làm màn hình quản trị catalog/chính sách nếu nằm trong phạm vi FE được giao; có phân quyền riêng.

### 7.2. Checklist kiểm tra khi nối xong

- [ ] Thiếu/sai/hết token không đọc được hồ sơ sinh viên; tài khoản khác không đọc được hồ sơ không thuộc mình.
- [ ] Catalog ngoại ngữ phản ánh đúng eligibility của tài khoản; kết quả number/select được gửi đúng kiểu và đúng giá trị.
- [ ] Ngoại ngữ chỉ nhận một ảnh; tin học tuân thủ giới hạn `/form`; thử ảnh sai định dạng/dung lượng và MIME khác đuôi.
- [ ] PUT R2 dùng đúng headers, không mang Authorization; chỉ complete sau khi upload đủ.
- [ ] Upload lỗi, hết hạn, complete lỗi tạm thời hoặc mất response vẫn tiếp tục cùng hồ sơ, không phát sinh hồ sơ mới do retry.
- [ ] Chuyên viên yêu cầu bổ sung; sinh viên sửa/nộp lại; trạng thái và kết quả mới hiển thị đúng ở cả hai phía.
- [ ] Chứng chỉ verified/rejected khóa sửa; review cùng rowVersion ở hai tab chỉ một thao tác được chấp nhận.
- [ ] SSE nhận thay đổi hai nhóm, reconnect tải lại dữ liệu, đổi tab/đăng xuất không tạo kết nối trùng.
- [ ] Đơn ngừng học: lưu nháp → xác nhận → xác nhận sẽ tiếp nhận online → chờ giấy (+3 ngày) → nhận giấy/processing → chấp nhận hoặc từ chối.
- [ ] Đơn cần bổ sung giữ ID/mã cũ khi xác nhận lại; đơn nháp/cần bổ sung hủy được, đơn đã nộp không hiện nút hủy.
- [ ] Gia hạn chỉ chọn đơn cha hợp lệ, kỳ nối tiếp nằm trong ba kỳ cho phép, số kỳ 1–4; xử lý lỗi trùng thời gian/đơn đang mở.
- [ ] Thiếu CCCD/thông tin nguồn báo rõ lỗi xác nhận; điểm `0`/`null` và dòng kỳ hè được hiển thị theo dữ liệu BE.
- [ ] PDF mở sau xác nhận, in lại không tạo đơn/mã mới; cookie hết hạn hoặc xác nhận lại thì cấp quyền in mới.
- [ ] Qua mốc +3 ngày vẫn chờ giấy và nhận giấy được; chỉ từ chối ở submitted/processing, approved là kết quả cuối.

## 8. Tài liệu và mã tham khảo

- [API chứng chỉ chi tiết](CERTIFICATIONS_API.md).
- [API đơn ngừng học/gia hạn, snapshot và PDF](ACADEMIC_LEAVE_API.md).
- [Đối chiếu nguồn dữ liệu điền đơn](STUDENT_FORM_DATA_AUDIT.md).
- [Cách chạy FE test local](../certification-web-test/README.md).
- [FE chứng chỉ sinh viên](../certification-web-test/public/app.js), [FE chuyên viên](../certification-web-test/public/reviewer.js), [helper upload một ảnh hiện tại](../certification-web-test/public/upload.js), [kiểm tra ảnh](../certification-web-test/public/image-validation.js), [SSE](../certification-web-test/public/realtime.js).
- [FE tham khảo đơn ngừng học/gia hạn và mở PDF](../certification-web-test/public/academic-leave.js).

Chạy local sau khi có Node.js **≥24** và cấu hình BE/DB/R2 phù hợp:

```powershell
npm.cmd start
```

Terminal thứ hai:

```powershell
npm.cmd run certifications:fe
```

Trang sinh viên: `http://localhost:5173/` (ngoại ngữ), `http://localhost:5173/?kind=it` (tin học), `http://localhost:5173/academic-leave.html` (đơn ngừng học). Trang chuyên viên tương ứng ở cổng `5174`, đăng nhập tài khoản trong `auth` local với task được giao; admin phòng chỉ theo dõi. Chạy FE test bằng `npm run certifications:fe`, backend chạy riêng.

FE test thực hiện ghi dữ liệu khi nộp/xét duyệt; dùng môi trường và hồ sơ thử nghiệm đã thống nhất.

**Tình trạng kiểm chứng khi soạn báo cáo:** đã đối chiếu route, DTO, controller, service, mapper, middleware và mã FE test. Repo đã có test cho upload/complete/review, SSE, tin học, quy tắc đơn, snapshot/điểm và quyền in PDF. Lần này thử chạy nhóm test liên quan nhưng trình chạy báo `Node.js v>=24.0.0 is not installed or cannot be found`, nên chưa có kết quả chạy test mới. Các test SQL và browser PDF thật cần điều kiện riêng; không coi việc có mã test là đã kiểm chứng DB/SSO/R2/PDF thật của môi trường bàn giao.

## Quy t?c th?i h?n v? DB local

Xem [quy t?c th?i h?n ch?ng ch?/h?c v?](REQUEST_REGULATIONS.md) v? m?c ti?p nh?n, x? l?, tr? k?t qu? v? tag qu? h?n trong API danh s?ch/chi ti?t. B? [Database_newversion](../Database_newversion/README.md) ch?a c?u tr?c, danh m?c DB local v? h??ng d?n d?ng m?i tr??ng.
