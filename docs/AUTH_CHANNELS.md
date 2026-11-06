# Xác thực cho hai frontend

Sinh viên dùng nguyên access token do DUT SSO trả về; admin và chuyên viên dùng
JWT do backend cấp. Không chuyển token SSO thành JWT sinh viên.

| Channel | Đăng nhập | Bearer API | API sử dụng |
| --- | --- | --- | --- |
| student | DUT SSO qua `/api/student/auth` | Access token SSO gốc | Toàn bộ API sinh viên và API DUT |
| staff | Mật khẩu local qua `/api/staff/auth/login` | JWT BE, audience staff | `/api/admin/requests` và URL chuyên viên tương thích |
| admin | Mật khẩu local qua `/api/admin/auth/login`, bật `ENABLE_ADMIN_AUTH=true` | JWT BE, audience admin | Chứng chỉ, ngừng học, organization phía admin |

Staff/admin dùng cùng nguồn tài khoản `auth.LocalAccounts` và phân quyền phòng/tác vụ
trong `auth.AccountProfiles`/`auth.AccountTasks`. Chỉ chuyên viên có profile auth được
dùng kênh staff; không đọc `DangNhapChuyenVien` hoặc role/quyền demo. Hai kênh giữ
audience và cookie riêng. Prefix `/api/admin`
không tự đổi channel. FE chọn client/token theo bảng; không thử token còn lại để
vượt lỗi quyền. Một tài khoản auth có thể dùng hai channel theo vai trò; không dùng
token của channel này thay cho channel kia.

Quản lý tài khoản và giao tác vụ chỉ qua `/api/admin/organization`. Không còn API
tạo tài khoản/gán role của demo trong nhóm requests. Tài khoản thiếu profile auth
bị từ chối; không có nhánh cộng quyền cũ. Bản ghi người xử lý trong workflow được
giữ để bảo toàn liên kết/lịch sử, không phải nguồn credential hoặc quyền.

## Sinh viên

1. Mở `GET /api/student/auth/microsoft/login` bằng điều hướng trình duyệt.
2. BE tạo state ngẫu nhiên, lưu server và cookie HttpOnly/SameSite=Lax trong 10 phút.
   `callbackUrl` gửi SSO có dạng `/api/student/auth/microsoft/callback/<state>`.
   SSO chỉ cần thêm `?accessToken=...`, không cần trả issuer, audience hay query state.
   SSO/reverse proxy phải giữ nguyên toàn bộ đường dẫn callback động.
3. Callback so khớp state trong đường dẫn với cookie và tiêu thụ state một lần.
   URL cũ `/microsoft/callback?state=...&accessToken=...` vẫn được hỗ trợ.
   Callback chỉ có accessToken tại đường dẫn cố định bị từ chối: cookie một mình
   không ràng buộc token với lượt đăng nhập và có thể dẫn tới login CSRF.
4. BE kiểm tra chữ ký **HS256** bằng `MICROSOFT_SSO_JWT_SECRET`, `exp`, `nbf` nếu có
   và danh tính `unique_name`. Không yêu cầu hay đối chiếu issuer/audience SSO.
   `MICROSOFT_SSO_JWT_SECRET_ENCODING=utf8|base64` quyết định cách đọc bytes khóa.
   Role/permission trong SSO không được dùng làm quyền xử lý nội bộ.
5. BE chuyển code dùng một lần trong fragment `#code=...` về
   `STUDENT_SSO_FRONTEND_CALLBACK_URL`. Nếu chưa cấu hình callback FE, trả code qua JSON.
   Code sống 60 giây và cần cookie binding. Token chỉ lưu mã hóa trong handoff ngắn hạn.
6. FE gọi `POST /api/student/auth/session`, body `{ "code": "..." }`,
   `credentials: 'include'`, Origin đúng `STUDENT_FRONTEND_URL`.
   `data.accessToken` (và alias `data.token`) **bằng nguyên token SSO gốc**;
   `expiresAt` là hạn SSO, `refreshExpiresAt=null`. Không cấp refresh cookie sinh viên;
   cookie refresh từ phiên cũ được xóa.
7. FE dùng `Authorization: Bearer <DUT_SSO_ACCESS_TOKEN>` cho mọi module sinh viên.
   Các adapter profile/bảng điểm DUT chuyển tiếp nguyên token này. Token hợp lệ cũng
   dùng trực tiếp được mà không phải đăng ký một phiên JWT nội bộ.

Backend xác minh chữ ký, hạn dùng và danh sách logout ở mỗi request trước khi đọc
hồ sơ trường. Quyền sở hữu hồ sơ, liên kết MSSV duy nhất và quyền SQL vẫn được giữ.
Cache liên kết hồ sơ theo hash token không bỏ qua xác thực ở request tiếp theo.

Đăng nhập dùng claims SSO/profile DUT đã xác minh. Khi tải form chứng chỉ hoặc
phần điền sẵn nghỉ học, nếu SSO thiếu CCCD hợp lệ thì backend tra
`DATA_SV1.dbo.NhanThan` theo `SoThe` bằng MSSV đã xác thực; chỉ nhận bản ghi khớp
duy nhất, ưu tiên `CCCD_So`, sau đó `cmnd` có đủ 12 chữ số. Lỗi kết nối DB trả
`503` khi tải form, không thay đổi phiên đăng nhập. Thông tin chưa có ở nguồn vẫn để trống.
Nộp/xác nhận hồ sơ vẫn kiểm tra trường bắt buộc. Nghiệp vụ đơn giấy có adapter DB
trường riêng để đọc dữ liệu lập/in đơn; đó không phải điều kiện xác thực SSO.

Không có refresh sinh viên: `POST /api/student/auth/refresh` trả 403 với
`details.code=SSO_REAUTH_REQUIRED`. Hết hạn thì đăng nhập DUT SSO lại. Giữ token trong
bộ nhớ client; không đưa token vào URL frontend, log hoặc storage lâu dài.

FE test nhiều trang tại [certification-web-test](../../certification-web-test/) giữ
token SSO trong sessionStorage theo từng tab và hạn SSO để chuyển module/F5/callback.
Không dùng localStorage, không lưu JWT local admin/staff. Token được xóa khi hết hạn,
API trả 401 hoặc logout; không gọi refresh sinh viên. Script cùng origin vẫn có thể
đọc sessionStorage, nên đây là cơ chế giữ phiên của frontend test, không phải cookie HttpOnly.

## Logout sinh viên

Gọi `POST /api/student/auth/logout` với Bearer SSO hiện tại. BE lưu hash token bị
thu hồi đến đúng hạn SSO trong auth store và xóa cookie state/handoff/refresh cũ.
Mọi API BE từ chối token đó dù vẫn đúng chữ ký. Danh sách thu hồi không lưu token rõ.
Cookie refresh cũ không thay thế Bearer SSO khi logout.

FE xóa token trong bộ nhớ và điều hướng tới `data.url` BE trả để hoàn tất logout DUT.
BE không thể tự thu hồi token tại hệ thống DUT bên ngoài. SSO phải cấp token mới
cho lần đăng nhập sau; token đã logout tại BE không được mở lại trước khi hết hạn.
Các worker cùng host phải dùng chung `AUTH_DATABASE_PATH`; nhiều máy cần store
chung phù hợp để danh sách thu hồi có hiệu lực trên mọi máy.

## Admin/chuyên viên

- Đặt `JWT_SHARE_SSO_KEY=false` và `JWT_SECRET` ngẫu nhiên riêng ít nhất 32 bytes,
  khác khóa SSO sau khi decode. Cấu hình dùng chung khóa bị từ chối với 503.
  Local login hoạt động độc lập khi chưa cấu hình SSO.
- JWT BE kiểm tra HS256, issuer BE, audience đúng channel, `typ`, `tokenUse`, hạn dùng,
  `sid`, `sub`, `jti` và phiên server. Access mặc định 1 giờ (tối đa 1 giờ);
  phiên refresh mặc định 7 ngày, hạn cố định không kéo dài mỗi lần refresh.
- Refresh token chỉ qua cookie HttpOnly/SameSite=Lax, Secure trong production;
  gọi login/refresh/logout với `credentials: 'include'` và Origin đúng frontend.
  Staff dùng `STAFF_FRONTEND_URL`, admin dùng `ADMIN_FRONTEND_URL`.
- Mỗi lần xác minh access/refresh đều đọc lại trạng thái, mật khẩu, role và quyền DB.
  Khóa tài khoản, đổi mật khẩu hoặc quyền làm mất hiệu lực phiên cũ.
- FE gom refresh thành một request và đồng bộ giữa tab. Nếu hai request dùng cùng
  refresh cookie trong 5 giây, request đầu xoay token, request sau trả **409** với
  `details.code=REFRESH_ALREADY_ROTATED`, `Retry-After: 1`; không trả token mới, không
  xóa cookie và không thu hồi phiên. FE chờ request đầu xong rồi thử lại với cookie mới,
  không coi 409 này là logout. Replay token cũ sau 5 giây thu hồi phiên với 401.
- Logout thu hồi phiên hiện tại và xóa cookie; access/refresh của phiên đó ngừng hoạt động.
  Logout không đăng xuất mọi thiết bị.
- Đổi sang khóa riêng làm JWT nội bộ ký bằng khóa cũ không còn hợp lệ; đăng nhập lại.
  Không đổi mật khẩu, role hoặc schema tài khoản SQL.

## Code và kiểm tra

- [Service xác thực](../src/common/auth/services/auth.service.js)
- [Cookie/callback/logout](../src/common/auth/controllers/auth.controller.js)
- [Auth store](../src/common/auth/stores/auth.store.js)
- [Actor đơn sinh viên](../src/common/student-requests/middlewares/request-actor.js)
- [Context gọi profile DUT](../src/common/students/middlewares/dut-student-context.js)

Chạy `npm test` và `npm run check` offline. Test SQL thật là opt-in; không chạy
migration, seed hay đăng nhập SSO thật để kiểm tra thay đổi này.
