# Token sinh viên và chuyên viên

Cập nhật 02/11/2026.

| Nhánh | Đăng nhập | Bearer gửi API | Cookie khôi phục phiên |
| --- | --- | --- | --- |
| Sinh viên | DUT SSO | Nguyên accessToken do SSO cấp | Chuỗi ngẫu nhiên HttpOnly, không phải JWT |
| Chuyên viên/admin | Tài khoản, mật khẩu local | JWT ứng dụng, `typ: at+jwt`, audience admin | JWT refresh HttpOnly |

Sinh viên không đăng nhập mật khẩu qua `/api/student/auth/login` (trả 403).
Token SSO không dùng được cho API chuyên viên. JWT admin không dùng được cho
API sinh viên. Role/permission từ claim SSO không trở thành quyền admin.

Luồng web sinh viên giữ state/cookie và code một lần để nhận token qua body JSON:

1. Điều hướng tới `GET /api/student/auth/microsoft/login`.
2. Gateway trả token về callback backend; backend xác minh chữ ký HS256,
   issuer, audience theo cấu hình và `exp`, rồi chuyển code về callback FE.
3. FE xóa fragment và gọi `POST /api/student/auth/session` với `{code}`,
   `credentials: include` và Origin đã cấu hình.
4. `data.accessToken` và alias `data.token` đều bằng token SSO ban đầu;
   `data.tokenSource = "sso"`. Không ký access JWT hoặc refresh JWT sinh viên.
5. Dùng `Authorization: Bearer <SSO accessToken>` cho các API sinh viên.
   API chuyển tiếp tới DUT sử dụng đúng token đó. Backend vẫn kiểm tra chữ ký,
   thời hạn và việc thu hồi tại ứng dụng trước khi xử lý.

`POST /api/student/auth/refresh` chỉ khôi phục token SSO đang còn hạn bằng cookie
HttpOnly đã xoay; không gia hạn `exp` của token và không tạo token SSO mới.
Cookie và thời hạn khôi phục được giới hạn theo `exp` SSO. Token quá hạn yêu cầu
đăng nhập SSO lại. Cookie refresh sinh viên của phiên bản trước được tự chuyển
sang cookie ngẫu nhiên khi khôi phục; Bearer JWT sinh viên cũ không được chấp nhận.
FE giữ Bearer trong bộ nhớ, không đặt token vào sessionStorage/localStorage/URL.

Bearer SSO hợp lệ có thể gọi trực tiếp API sinh viên mà không cần được đổi thành
JWT ứng dụng trước. `GET /api/student/auth/me` cũng xác thực cùng token đó.

Middleware tái sử dụng claim đã xác minh để lấy MSSV trực tiếp từ claim MSSV hoặc
UPN dạng `MSSV@sv1.dut.udn.vn`. Domain được giới hạn bằng
`MICROSOFT_SSO_STUDENT_EMAIL_DOMAINS`; không suy MSSV từ email của domain bất kỳ.
Thiếu các định dạng đó mới gọi profile DUT. Kết quả fallback được giữ tối đa
60 giây, giới hạn theo hạn token, gộp các request đồng thời và giới hạn số entry.
Chữ ký/thời hạn/thu hồi token vẫn được kiểm tra ở mọi request trước khi dùng cache.
Họ tên/lớp/CCCD/ngày sinh/điện thoại còn thiếu được đọc từ DB theo MSSV đã xác thực.

`POST /api/student/auth/logout` xóa phiên web và thu hồi token SSO tại backend này
đến khi token hết hạn. Lần đăng nhập mới qua state/code hợp lệ có thể dùng lại
token nếu gateway trả cùng token. Việc thu hồi ở đây không tác động các ứng dụng
DUT khác. Khi cùng một token được dùng ở nhiều tab, các tab đó dùng chung trạng
thái thu hồi của token tại ứng dụng.

Chuyên viên giữ luồng `/api/admin/auth/login`, `/refresh`, `/me`, `/logout`.
Tài khoản được kiểm tra trạng thái và quyền local; JWT ứng dụng chỉ được ký cho
channel admin và phương thức password. Hết hạn access JWT có thể xoay refresh;
khóa tài khoản/đổi version/đăng xuất vô hiệu phiên theo cơ chế hiện có.

Giao diện test:

- Sinh viên: `http://localhost:5173/` và `/academic-leave.html`.
- Chuyên viên: `http://localhost:5174/` và `/academic-leave.html`.
- Mỗi trang dùng chung cơ chế phiên trong `certification-web-test/public/web-auth.js`.
- `/local-api/auth/token` cũ chuyển về lỗi đăng nhập để bắt đầu luồng state/code mới.

Kiểm thử tự động dùng SSO gateway và tài khoản giả lập; không đăng nhập Microsoft
thật hoặc thay đổi dữ liệu người dùng:

```powershell
node --test tests/integration/student-sso-token.test.js
$env:AUTH_BROWSER_TEST='1'
node --test tests/integration/auth-browser.test.js
```
