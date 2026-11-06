# Kiểm tra cấu hình và bảo mật SSO — 09/10/2026

## Cập nhật sau khi xử lý

Các kết quả bên dưới ghi nhận bản khung **trước khi sửa**. Bản hiện tại đã:

- Lưu state TTL 10 phút, tiêu thụ nguyên tử một lần phía server bằng SQLite;
  callback replay/hết hạn/state giả đều bị từ chối.
- Lưu phiên JWT theo jti; POST logout thu hồi ngay. Kiểm thử token cũ trả 401,
  kể cả worker khác dùng chung SQLite; phiên giữ được qua restart.
- Chuẩn bị API đổi code TTL 60 giây, một lần, ràng buộc cookie và Origin.
  Hai URL callback frontend để trống theo yêu cầu; chưa ghép giao diện frontend.
- Từ chối đăng nhập production nếu thiếu issuer/audience, khóa yếu hoặc URL HTTP.
- Kiểm thử gateway HTTP mô phỏng có/không giữ state và tham số logout.

30/30 kiểm thử đạt. Chưa có khóa/cấu hình SSO thật nên chưa xác minh gateway
trường. Xem hợp đồng frontend và yêu cầu kho phiên tại [SSO_SCAFFOLD.md](SSO_SCAFFOLD.md).
Triển khai nhiều máy cần thay SQLite bằng kho chung; rate limiting và bảo vệ
file phiên thuộc cấu hình triển khai. Không tuyên bố đã kiểm thử production.

## Kết luận

Backend khởi động và bộ test chạy được. Đăng nhập SSO thật **chưa chạy được với
`.env` hiện tại**, và chưa đủ bằng chứng để khẳng định chỉ còn cấu hình máy chủ SSO.
Đây vẫn là khung auth, chưa phải luồng đăng nhập frontend hoàn chỉnh hoặc phiên
đăng nhập sẵn sàng triển khai production. Việc phân quyền tiếp tục để người dùng
bổ sung theo yêu cầu trước đó.

Không sửa `.env`, không ghi giá trị khóa/mật khẩu vào báo cáo. `.env` đang được
Git ignore và không nằm trong danh sách file tracked.

## Cấu hình thực tế

| Mục | Kết quả |
| --- | --- |
| `JWT_SECRET` | Có giá trị, ít nhất 32 byte; độ dài không chứng minh độ ngẫu nhiên |
| `JWT_EXPIRES_IN` | `1h` |
| `MICROSOFT_SSO_JWT_SECRET` | Đang trống: login trả 503 trước khi redirect |
| `MICROSOFT_SSO_JWT_ISSUER` | Trống: chưa ràng buộc issuer SSO |
| `MICROSOFT_SSO_JWT_AUDIENCE` | Trống: chưa ràng buộc audience SSO |
| Callback sinh viên | `http://localhost:3003/api/student/auth/microsoft/callback`, khớp origin APP_URL và đường dẫn backend |
| Frontend sinh viên / CORS | `http://localhost:5173`, khớp cấu hình local |
| Môi trường | Development, HTTP localhost; chưa phải cấu hình production |
| Auth admin | Tắt mặc định; `.env` chưa khai báo cờ nhưng fallback là false |

Khóa SSO phải do quản trị gateway cung cấp, không thay bằng `JWT_SECRET` của backend.
Issuer/audience phải lấy từ hợp đồng token thật; không đoán theo URL gateway.
`MICROSOFT_SSO_ME_PATH` có cấu hình nhưng chưa được gọi; code hiện xác minh JWT
bằng khóa SSO, không xác minh token qua endpoint `/me`.

## Bằng chứng chạy tại máy local

Khởi tạo app dùng chính cấu hình `.env`, lắng nghe cổng ngẫu nhiên trên loopback:

| Request | Status |
| --- | --- |
| `GET /api/health` | 200 |
| `GET /api/student/auth/microsoft/login` | 503: SSO authentication is not configured |
| `GET /api/student/auth/me` không có bearer token | 401 |
| `GET /api/admin/auth/microsoft/login` | 404 |
| `GET /api/student/auth/microsoft/logout` | 200: chỉ trả URL và hướng dẫn xóa token |

24/24 kiểm thử hiện có đạt. Các test auth dùng khóa giả riêng, không xác nhận
SSO thật đã chấp nhận callback hoặc khóa trong `.env` đúng với gateway.

## Các việc còn thiếu trong backend và tích hợp

1. **State chưa được tiêu thụ một lần phía server.** Thử với khóa/token giả riêng:
   callback đầu trả 200, gửi lại cùng query và cookie đã giữ lại vẫn trả 200.
   Xóa cookie trên response chỉ giúp trình duyệt xóa bản cookie thông thường;
   không ngăn client giữ và gửi lại. Cần lưu state có TTL và consume nguyên tử,
   dùng kho chung nếu chạy nhiều instance. Giới hạn 10 phút hiện do cookie ở
   trình duyệt, chưa được kiểm tra độc lập phía server.
2. **Logout chưa thu hồi JWT.** Sau khi gọi logout, dùng bearer token đã phát
   gọi `/me` vẫn trả 200. Đây là giới hạn đã ghi trong AUTH-03, không phải logout
   hoàn chỉnh. Cần session store/denylist hoặc cơ chế thu hồi tương đương trước
   khi yêu cầu logout vô hiệu hóa token ngay.
3. **Callback frontend chưa triển khai.** Backend trả JSON token; trình duyệt
   chưa tự quay lại app với phiên đăng nhập. Cần cơ chế callback frontend và
   lưu phiên/token phù hợp. Đây là việc phía ứng dụng, không phải config SSO.
4. **Issuer/audience SSO chưa bắt buộc.** Đang kiểm tra chữ ký, HS256 và expiry,
   nhưng bỏ kiểm tra issuer/audience nếu để trống cấu hình. Production cần
   ràng buộc đúng issuer/audience đã xác nhận với gateway.
5. **Hợp đồng gateway chưa kiểm thử thực tế.** Cần biết callbackUrl có được đăng
   ký/giữ nguyên query `state`, token có đúng HS256/unique_name/exp, và logout
   có nhận `postLogoutRedirectUri`. Source Course Registration không đủ để
   chứng minh gateway đang chạy hỗ trợ toàn bộ các hành vi này.
6. **Cấu hình production:** cần URL HTTPS thật, NODE_ENV=production, CORS đúng
   origin frontend, khóa ngẫu nhiên đủ mạnh, giới hạn tần suất auth tại API hoặc
   reverse proxy, không ghi query chứa accessToken vào log. Source hiện chưa có
   middleware giới hạn tần suất và chưa kiểm tra đầy đủ URL/khóa ở startup.

Repository auth hiện chỉ trả danh tính SSO và quyền pending; chưa ánh xạ tài
khoản SQL hoặc xác nhận đó là sinh viên nội bộ. Đây là phần AUTH-01/02 được chủ
động để lại theo yêu cầu, không tự xem người đăng nhập là sinh viên hay admin có
quyền nghiệp vụ. Bảo vệ bản ghi cá nhân vẫn cần được gắn vào API nghiệp vụ sau này.

## Các kiểm tra đã có

- JWT ứng dụng tách khỏi JWT SSO; không dùng phiên Course Registration.
- Pin thuật toán HS256; kiểm tra chữ ký/expiry; token ứng dụng có issuer,
  audience, subject và jti.
- Student/admin có audience riêng; admin không mount mặc định.
- Cookie state HttpOnly, SameSite=Lax; Secure khi NODE_ENV=production.
- Response auth no-store/no-referrer; không đưa stack trace hoặc khóa vào lỗi.
- Quyền pending không vượt qua middleware requirePermissions.

Không coi các kiểm tra này là chứng nhận an toàn toàn bộ hệ thống.

## Nguồn đối chiếu và giới hạn kiểm tra

[OWASP OAuth2 Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/OAuth2_Cheat_Sheet.html)
khuyến nghị state dùng một lần và gắn với user agent khi cần state để chống CSRF.
[OWASP REST Security](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html)
nêu cơ chế denylist để JWT không còn được chấp nhận sau khi kết thúc phiên.

`npm audit --omit=dev` không lấy được kết quả vì kết nối audit endpoint npm thất
bại trong môi trường này; chưa kết luận dependencies không có lỗ hổng.
Chưa thử tài khoản thật, chưa xác minh khóa SSO, chưa kiểm thử frontend/reverse
proxy/triển khai nhiều instance. Không thay đổi cấu hình SSO bên ngoài.
