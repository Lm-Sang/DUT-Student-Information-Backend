# Xác thực SSO và JWT nội bộ

Contract hiện hành: [AUTH_CHANNELS.md](AUTH_CHANNELS.md).

- Sinh viên dùng trực tiếp token DUT SSO: kiểm tra HS256/secret key, exp, nbf nếu có
  và unique_name. Không yêu cầu issuer/audience theo contract gateway. Role và
  permission SSO không phải quyền nghiệp vụ.
- Callback phải khớp state từ đường dẫn hoặc query với cookie HttpOnly và state
  server dùng một lần. Không còn nhận callback cố định chỉ có accessToken rồi tự
  dùng state cookie. Path động hỗ trợ gateway không trả query state.
- Handoff giữ token mã hóa tối đa 60 giây; code/binding ngẫu nhiên dùng một lần.
  Frontend nhận token gốc qua JSON sau kiểm tra Origin và cookie binding.
- BE không cấp JWT/refresh sinh viên. Logout lưu hash token bị chặn đến hạn SSO;
  các adapter sinh viên xác minh trước khi gọi DUT.
- Admin/staff dùng JWT_SECRET riêng tối thiểu 32 bytes; dùng chung khóa SSO bị từ chối.
  Giữ audience, cookie và nguồn tài khoản riêng cho hai channel.
- JWT nội bộ kiểm tra issuer/audience/type/channel và phiên server, đọc lại quyền,
  trạng thái/version tài khoản. Đổi mật khẩu/quyền và logout thu hồi phiên cũ.
- Refresh trùng trong 5 giây trả 409, không phát token hoặc xóa cookie. Replay ngoài
  khoảng này thu hồi phiên. FE cần gom refresh và thử lại 409 bằng cookie mới.
- Cookie HttpOnly/SameSite=Lax, Secure ở production; kiểm tra Origin với thao tác
  dùng cookie, rate limit IP/tài khoản và no-store cho response auth.

## Giới hạn thực tế

SSO phải giữ callbackUrl path động. Nếu allowlist gateway chỉ nhận đường dẫn cố định,
cần hỗ trợ trả state từ gateway; không bỏ kiểm tra state để tương thích. Chữ ký bằng
secret key không chứng minh token được cấp riêng cho ứng dụng khi không có issuer/
audience; phạm vi token theo contract SSO người dùng đã xác nhận.

BE không thể tự thu hồi token tại DUT. FE cần điều hướng URL logout DUT; BE không
mở lại token đã logout. Các worker phải chia sẻ auth store; SQLite local phù hợp
một host, nhiều máy cần store chung. Reverse proxy cần che query accessToken khỏi
access log. Workspace này không chứa frontend để cập nhật lưu token, 409 hay logout.

Kiểm tra bằng test offline và syntax check; không kết nối DB trường, không chạy
migration/seed hoặc dùng tài khoản SSO thật. Kết quả được báo trong phiên thay đổi.
