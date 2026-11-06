# Khung đăng nhập SSO

> Đã xử lý state một lần và thu hồi JWT khi logout. Login thật vẫn chờ khóa/cấu
> hình SSO. URL callback frontend để trống theo yêu cầu; đội frontend ghép sau.
> Xem [kiểm tra bảo mật và cập nhật](SSO_SECURITY_REVIEW.md).

Đã dựng khung backend theo `D:\res\course-registration`, tham chiếu
`CourseRegistration.BackendAPI/Controllers/MicrosoftController.cs` và
`CourseRegistration.AdminAPI/Controllers/AuthController.cs`.

Luồng hiện tại dùng **cổng SSO của trường**, không phải kết nối Entra ID trực tiếp:
chuyển hướng tới `/microsoft/login?callbackUrl=...&response_mode=query`, nhận
`accessToken`, xác minh JWT HS256 và claim `unique_name`, rồi phát JWT riêng của
Student Information. Không gọi API tạo Course Registration token, không ghi Redis
`ActiveToken:*`, không tác động phiên đăng ký tín chỉ.

## API sinh viên (mặc định)

| Method | Route | Hành vi |
| --- | --- | --- |
| GET | `/api/student/auth/microsoft/login` | Lưu state phía server, cookie HttpOnly, SameSite=Lax, TTL 10 phút; redirect tới SSO |
| GET | `/api/student/auth/microsoft/callback?state=...&accessToken=...` | Tiêu thụ state một lần, xác minh SSO token; trả code ngắn hạn hoặc redirect frontend nếu đã cấu hình |
| POST | `/api/student/auth/session` | Body JSON `{ "code": "..." }`, cookie trình duyệt và Origin frontend; đổi code một lần lấy JWT |
| GET | `/api/student/auth/me` | Xem danh tính bằng `Authorization: Bearer <JWT ứng dụng>` |
| POST | `/api/student/auth/logout` | Bearer JWT bắt buộc; thu hồi phiên ngay và trả URL logout SSO |
| POST | `/api/student/auth/microsoft/logout` | Alias của POST logout; GET logout đã bỏ |

Route auth dùng `Cache-Control: no-store` và `Referrer-Policy: no-referrer`.
Callback chỉ chấp nhận token có chữ ký hợp lệ, có `exp` chưa hết hạn và có
`unique_name`; không nhận role/permission từ token SSO làm quyền nghiệp vụ.

Response `POST /session`:

```json
{
  "success": true,
  "data": {
    "token": "<JWT ứng dụng>",
    "tokenType": "Bearer",
    "expiresAt": "<ISO datetime>",
    "channel": "student",
    "user": {
      "id": "<SSO sub hoặc unique_name>",
      "microsoftId": "<unique_name viết thường>",
      "displayName": "<name hoặc null>",
      "email": "<email hoặc null>",
      "provider": "microsoft-sso",
      "localUserId": null,
      "roles": [],
      "permissions": [],
      "authorizationStatus": "pending"
    }
  }
}
```

## Callback frontend để trống, ghép sau

Theo yêu cầu, `.env` và `.env.example` có hai biến **để trống**:

```dotenv
STUDENT_SSO_FRONTEND_CALLBACK_URL=
ADMIN_SSO_FRONTEND_CALLBACK_URL=
```

Không giả định đường dẫn callback của frontend, không triển khai giao diện.
Khi URL còn trống, callback backend trả JSON `data: { code, channel,
expiresIn: 60, frontendCallbackConfigured: false }` và cookie binding HttpOnly.
Không trả JWT trực tiếp ở callback nữa.

Khi đội frontend chốt route, điền URL tuyệt đối vào biến tương ứng. URL phải
thuộc đúng origin `STUDENT_FRONTEND_URL`/`ADMIN_FRONTEND_URL`, không có query/hash.
Backend sẽ trả 303 tới `<frontend callback>#code=<mã một lần>`. Không đưa JWT hoặc
SSO accessToken lên URL frontend.

Hợp đồng để đội frontend ghép:

1. Điều hướng trình duyệt tới `GET /api/student/auth/microsoft/login`.
2. Tại route callback frontend, đọc code từ fragment rồi xóa fragment bằng
   `history.replaceState` trước khi gọi API/tải script bên thứ ba.
3. Gọi `POST /api/student/auth/session` với JSON `{ code }`,
   `credentials: 'include'` để gửi cookie binding. Browser tự gửi Origin;
   backend chỉ chấp nhận đúng origin frontend đã cấu hình.
4. Dùng JWT trả về làm Bearer cho API. Không lưu token trong URL.
5. Logout bằng `POST /api/student/auth/logout` với Bearer JWT; xóa token phía
   frontend sau khi backend thu hồi phiên rồi điều hướng tới `data.url`.

Code có TTL 60 giây, ràng buộc cookie trình duyệt, chỉ đổi được một lần. Không
đổi code được qua curl chỉ có code hoặc từ origin khác. Nếu frontend/API ở hai
site khác nhau, SameSite=Lax không gửi cookie qua fetch; cần triển khai cùng site
(ví dụ subdomain cùng tên miền, cùng scheme) hoặc reverse proxy API dưới cùng
site. Không tự nới cookie sang SameSite=None khi chưa chốt kiến trúc frontend.

## Cấu hình để nối SSO thật

1. Điền `MICROSOFT_SSO_JWT_SECRET` do quản trị SSO cung cấp.
2. Điền `JWT_SECRET` riêng của backend, khác khóa SSO.
3. Đăng ký `MICROSOFT_SSO_STUDENT_CALLBACK_URL` tại SSO. Callback phải cùng host
   với API login để trình duyệt gửi cookie state.
4. Xác nhận gateway giữ query `state` đã nằm trong `callbackUrl` khi thêm
   `accessToken`. Source tham chiếu chưa chứng minh hành vi này; cần kiểm tra thật.
   Nếu gateway chỉ cho callback URL khớp tuyệt đối hoặc bỏ query, cần thống nhất
   cơ chế trả state với quản trị SSO trước khi nối frontend.
5. Cấu hình `MICROSOFT_SSO_JWT_ISSUER` và `MICROSOFT_SSO_JWT_AUDIENCE` theo thông
   tin gateway. Development cho phép để trống; production từ chối đăng nhập
   nếu thiếu issuer/audience hoặc khóa ký dưới 32 byte.
6. Production cần HTTPS và `NODE_ENV=production` để cookie có cờ Secure. Proxy
   phải tránh ghi query callback chứa `accessToken` vào access log.

Thiếu khóa trả `503`, token/state sai trả `401`, thiếu `accessToken` với state
hợp lệ trả `400`. Không dùng khóa placeholder hay token giả cho môi trường thật.

## Kho state, code và phiên

Yêu cầu **Node.js >= 24**, dùng SQLite tích hợp, không cần cài Redis hoặc tạo
bảng SQL Server. `AUTH_DATABASE_PATH` mặc định `.data/auth.sqlite`; thư mục
`.data/` được Git ignore. State/code dùng khóa hash và TTL phía server, tiêu thụ
bằng một câu lệnh SQLite `DELETE ... RETURNING`. JWT chỉ được chấp nhận khi phiên
`jti` còn trong kho; logout xóa phiên nên token bị từ chối ngay.

Phiên giữ được qua restart. Nhiều tiến trình trên **cùng máy** phải dùng cùng
đường dẫn SQLite trên ổ đĩa local. Nếu deploy container, gắn volume bền vững.
Nếu chạy trên nhiều máy, thay `auth.store.js` bằng kho chung có thao tác consume
nguyên tử (Redis/SQL); không dùng SQLite qua network share. File chứa dữ liệu
xác thực, gồm JWT trong thời gian code chờ đổi: giới hạn quyền truy cập cho tài
khoản chạy backend và không đưa file vào source/artifact công khai. Xóa kho sẽ
vô hiệu hóa tất cả phiên. Token phát trước thay đổi này cũng không còn hợp lệ.

Kho giới hạn 50.000 entry và dọn entry hết hạn mỗi lần ghi. Vẫn cần giới hạn
tần suất login/callback ở reverse proxy khi deploy. Logout chỉ thu hồi phiên
hiện tại; đăng xuất mọi thiết bị/refresh token và thu hồi khi đổi quyền là việc sau.

## Admin độc lập, tắt mặc định

`ENABLE_ADMIN_AUTH=false` là mặc định. `src/server.js` chỉ import
`src/modules/auth/admin/index.js` khi bật cờ này. Luồng sinh viên không import
module admin; nếu không dùng admin, có thể xóa thư mục `src/modules/auth/admin/`
và nhánh import tùy chọn trong server.

Nếu cần dùng sau này, bật `ENABLE_ADMIN_AUTH=true`, cấu hình callback admin và
frontend admin. Route tương ứng nằm dưới `/api/admin/auth`. Hai nhánh dùng
audience JWT và cookie state riêng; token sinh viên không dùng được ở nhánh admin
và ngược lại. Đăng nhập qua nhánh admin vẫn chỉ xác minh danh tính, **không tự cấp
quyền Admin**. Module nghiệp vụ `src/modules/admin/` có sẵn vẫn là khung rỗng.

## Note: bổ sung các cấp quyền sau

Theo yêu cầu, chưa định nghĩa các cấp quyền. Tất cả danh tính mới đều có
`authorizationStatus: pending`, `roles: []`, `permissions: []` và chưa có tài khoản
nội bộ. Các điểm cần bổ sung:

- **AUTH-01 — Ánh xạ tài khoản:** triển khai `authRepository.resolveIdentity()`
  để tìm tài khoản nội bộ bằng danh tính SSO đã xác minh; xác định liên kết MSSV,
  cán bộ, tình trạng tài khoản. Chưa đoán MSSV từ email, chưa tạo bảng/ghi database.
- **AUTH-02 — Các cấp quyền:** bạn quyết định danh sách role, permission và nguồn
  cấp quyền. Chỉ trả `authorizationStatus: active` khi đã xác nhận quyền nội bộ;
  không lấy quyền từ tham số URL hoặc mặc định mọi người là admin.
- **AUTH-02 — Bảo vệ nghiệp vụ:** gắn `authenticate('student')` và
  `requirePermissions('permission.do.ban.dinh.nghia')` lên từng route cần bảo vệ;
  thêm kiểm tra quyền trên bản ghi (ví dụ sinh viên chỉ xem hồ sơ của mình).
  Guard hiện từ chối tài khoản pending. Public API tiếp tục công khai.
- **AUTH-03 — Mở rộng phiên:** logout đã thu hồi JWT hiện tại. Bổ sung refresh
  token, đăng xuất mọi thiết bị, thu hồi phiên khi khóa tài khoản/đổi quyền;
  quyền vẫn là snapshot trong JWT.
- **AUTH-04 — Trước triển khai thực tế:** đội frontend ghép callback, thử gateway thật,
  xác nhận issuer/audience, bổ sung giới hạn tần suất đăng nhập và audit phù hợp.

## Kiểm thử

`npm test` gồm kiểm thử auth: state giả/hết hạn/replay đồng thời, code một lần
và binding/Origin, code hết hạn, callback frontend để trống hoặc redirect đã
cấu hình, logout thu hồi đúng phiên, restart và hai worker dùng cùng SQLite,
production từ chối cấu hình yếu, và gateway HTTP mô phỏng giữ/bỏ state cùng
tham số logout. Các test dùng khóa riêng và SQLite tạm, không gọi SSO hoặc
SQL Server thật. Gateway mô phỏng không chứng minh gateway trường hỗ trợ hợp đồng.
