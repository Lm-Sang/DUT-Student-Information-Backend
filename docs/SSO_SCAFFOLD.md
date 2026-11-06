# Đăng nhập DUT SSO cho sinh viên

Contract hiện hành và hướng dẫn frontend ở [AUTH_CHANNELS.md](AUTH_CHANNELS.md).
Backend dùng cổng SSO DUT, không phải client Microsoft Entra trực tiếp.

Sinh viên dùng **access token SSO gốc** xuyên suốt API sinh viên và API DUT.
Backend xác minh HS256 bằng secret key, hạn dùng và danh tính; không cần
issuer/audience SSO và không phát JWT hay refresh riêng cho sinh viên.
Admin/chuyên viên đăng nhập local và nhận JWT BE với khóa độc lập.

| Method | Endpoint | Hành vi |
| --- | --- | --- |
| GET | `/api/student/auth/microsoft/login` | Tạo state/cookie 10 phút; redirect SSO với callbackUrl chứa state trong đường dẫn |
| GET | `/api/student/auth/microsoft/callback/:state?accessToken=...` | So khớp cookie/state dùng một lần, xác minh token SSO |
| GET | `/api/student/auth/microsoft/callback?state=...&accessToken=...` | Adapter cũ; state vẫn bắt buộc |
| POST | `/api/student/auth/session` | Đổi code + cookie binding trong 60 giây để nhận nguyên token SSO qua JSON |
| GET | `/api/student/auth/me` | Danh tính đã xác minh bằng Bearer SSO |
| POST | `/api/student/auth/refresh` | 403 `SSO_REAUTH_REQUIRED`; đăng nhập SSO lại |
| POST | `/api/student/auth/logout` | Chặn hash token đến hạn SSO, xóa cookie, trả URL logout DUT |
| POST | `/api/student/auth/microsoft/logout` | Alias logout cùng kiểm tra |

Callback FE chỉ mang code dùng một lần trong fragment, không chứa token SSO.
FE đổi code với cookie binding để nhận token; lưu token trong bộ nhớ, gửi Bearer
khi gọi API, xóa token và điều hướng URL DUT khi logout. SSO phải giữ đường dẫn
callback động; callback cố định chỉ trả accessToken không có state sẽ bị từ chối.

## Cấu hình

```dotenv
MICROSOFT_SSO_BASE_URL=https://sso.dut.udn.vn
MICROSOFT_SSO_STUDENT_CALLBACK_URL=http://localhost:3003/api/student/auth/microsoft/callback
MICROSOFT_SSO_JWT_SECRET=
MICROSOFT_SSO_JWT_SECRET_ENCODING=utf8
STUDENT_FRONTEND_URL=http://localhost:5173
STUDENT_SSO_FRONTEND_CALLBACK_URL=http://localhost:5173/auth/callback
JWT_SHARE_SSO_KEY=false
JWT_SECRET=
```

Khóa SSO do trường cung cấp; JWT_SECRET ngẫu nhiên riêng ít nhất 32 bytes chỉ dùng
cho admin/staff. Không dùng chung bytes khóa. Các cấu hình issuer/audience SSO cũ
không được dùng để giới hạn token DUT. Production yêu cầu HTTPS.

Logout BE chặn token tại BE, không tự thu hồi token trên hệ thống DUT khác.
Reverse proxy không được ghi query callback chứa accessToken vào access log.
Chưa xác minh gateway thật có giữ callback path động hoặc allowlist callback theo
prefix; cần kiểm tra điều này khi tích hợp SSO thực tế.
