# Đổi và reset mật khẩu chuyên viên

Áp dụng cho tài khoản local trong `svc_demo.DangNhapChuyenVien`, bao gồm tài khoản quản trị `admin.test` dùng kênh đăng nhập chuyên viên. Sinh viên tiếp tục dùng SSO; tài khoản admin cũ trong `auth.LocalAccounts` là kênh riêng và không được thay đổi bởi các API này.

## API

Các API nhận application Bearer JWT kênh `staff`, yêu cầu `Origin` đúng FE chuyên viên và trả `Cache-Control: no-store`.

| API | Body | Quyền |
| --- | --- | --- |
| `POST /api/staff/auth/change-password` | `{ "currentPassword": "...", "newPassword": "..." }` | Tài khoản local đã đăng nhập; chỉ thay đổi mật khẩu của chính mình |
| `POST /api/staff/auth/accounts/:id/reset-password` | `{ "newPassword": "..." }` | Quyền hiện hành `rbac.staff.manage`; đặt lại mật khẩu tài khoản chuyên viên local khác |

Mật khẩu mới từ 12 đến 128 ký tự, khác mật khẩu đang dùng. FE yêu cầu nhập lại mật khẩu mới để xác nhận. Sai mật khẩu hiện tại trả 400 để không làm mất phiên; thiếu/hết hạn JWT trả 401, thiếu quyền trả 403, không có tài khoản có hiệu lực trả 404, tài khoản đích vừa đổi mật khẩu trả 409. Có giới hạn số lần thử theo tài khoản và IP.

Reset tài khoản của chính mình qua API quản trị bị từ chối; sử dụng Đổi mật khẩu và cung cấp mật khẩu hiện tại. Mật khẩu reset do quản trị viên nhập, không được trả lại trong response. Chưa có tính năng gửi mật khẩu qua email hoặc bắt buộc đổi mật khẩu ở lần đăng nhập kế tiếp.

## Lưu trữ và thu hồi phiên

- Dùng scrypt có salt ngẫu nhiên theo chuẩn auth hiện hành, không lưu mật khẩu thuần.
- Cập nhật hash, tăng `PhienBanQuyen` và ghi `LichSuRBAC` trong cùng transaction ở DB local; action là `CHANGE_PASSWORD` hoặc `RESET_PASSWORD`.
- Transaction kiểm tra lại tài khoản/người thao tác, hash và phiên bản đang dùng; reset còn kiểm tra quyền RBAC hiện hành. Không ghi hash hoặc mật khẩu trong lịch sử.
- Thu hồi tất cả session của tài khoản bị đổi/reset. Access JWT và refresh token cũ đều không dùng được; kiểm tra hash/version cũng có hiệu lực giữa các tiến trình API. Reset không đăng xuất admin đang thực hiện thao tác.
- Đổi mật khẩu thành công xóa refresh cookie của phiên hiện tại và đưa FE về đăng nhập.
- Chỉ ghi SQL Server loopback trong DB được cho phép. Không thay đổi schema SQL, không ghi DB trường qua SSH và không thay đổi danh sách role/quyền đã gán.

## Giao diện và kiểm thử

- Chuyên viên: nút **Đổi mật khẩu** cạnh **Đăng xuất**.
- Admin có `rbac.staff.manage`: **Tài khoản & role → chọn chuyên viên → Reset mật khẩu**. Chỉ hiện reset khi tài khoản có tên đăng nhập local; tài khoản của chính admin có hướng dẫn dùng nút Đổi mật khẩu.
- `npm.cmd test`: 140 kiểm thử backend đạt, 2 kiểm thử SQL tùy chọn bỏ qua. FE: 31 kiểm thử đạt và kiểm tra cú pháp đạt.
- Kiểm thử SQL thực: `$env:AUTH_DB_TEST='1'; node --test src/modules/auth/__tests__/password-management-sql.test.js`. Tạo tài khoản/role tạm, kiểm tra đổi/reset thật, CAS, thu hồi access/refresh, quyền hiện hành và audit; xóa các bản ghi tạm theo ID sau khi chạy.
- Đã mở và kiểm tra cả hai biểu mẫu trên FE thật bằng tài khoản admin local; không nhập hoặc đổi mật khẩu của các tài khoản đang dùng. Ảnh kiểm tra ở `.data/password-change-ui.png` và `.data/password-reset-ui.png`.
