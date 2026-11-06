# Xác thực cho hai frontend

Tài liệu này mô tả code hiện tại sau refactor cấu trúc.
Hai khu vực source là student và admin; các channel token bên trong vẫn giữ nguyên.

| Channel | Đăng nhập | Bearer API | API sử dụng |
| --- | --- | --- | --- |
| student | DUT SSO qua /api/student/auth | JWT ứng dụng audience student | API sinh viên |
| staff | Mật khẩu local qua /api/staff/auth | JWT ứng dụng audience staff | Đơn sinh viên phía chuyên viên |
| admin | Mật khẩu local qua /api/admin/auth, opt-in | JWT ứng dụng audience admin | Duyệt chứng chỉ, ngừng học và quản lý danh mục |

Chuyên viên và quản trị viên cùng làm việc trong frontend admin. Việc đặt source vào
admin không đổi audience hoặc chuyển tài khoản giữa các nguồn dữ liệu.
Không gửi token staff tới endpoint hiện yêu cầu admin hoặc ngược lại.

## Sinh viên

1. Bắt đầu qua GET /api/student/auth/microsoft/login.
2. Callback backend kiểm tra state một lần và token SSO.
3. Backend chuyển code một lần về FE; FE đổi code qua POST /api/student/auth/session
   với cookie binding và Origin đúng cấu hình.
4. FE nhận JWT ứng dụng channel student để gọi backend.
5. Token DUT SSO được mã hóa trong phiên trên server. Adapter gọi DUT lấy lại token
   qua getSsoAccessToken, kiểm tra hạn SSO trước khi chuyển tiếp.
6. Refresh xoay JWT refresh trong cookie HttpOnly. Logout thu hồi phiên ứng dụng.

JWT ứng dụng và token DUT SSO là hai token khác nhau. Refresh ứng dụng không tạo hoặc
gia hạn token SSO; khi SSO hết hạn, thao tác cần gọi DUT yêu cầu đăng nhập lại.

## Chuyên viên/admin

- Staff kiểm tra tài khoản và quyền từ các bảng local svc_demo.
- Admin cũ kiểm tra auth.LocalAccounts và được mount khi ENABLE_ADMIN_AUTH=true.
- Kiểm tra phiên tái đọc trạng thái/version tài khoản để phát hiện thu hồi.
- Duyệt chứng chỉ cần certifications:review; quản lý danh mục cần certifications:catalog:manage.
- Duyệt ngừng học cần academic-leave:review.
- Đơn sinh viên kiểm tra thêm role/phạm vi xử lý từ SQL cho mỗi request.

Cấu trúc mới giữ nguyên tên/path cookie, Origin, audience, refresh rotation, state,
handoff và điều kiện thu hồi. Hợp nhất staff/admin là migration xác thực riêng;
không thực hiện bằng cách chấp nhận tùy ý nhiều audience.

## Nơi đọc code

- [Module auth sinh viên](../src/student/modules/auth/index.js)
- [Auth chuyên viên](../src/admin/modules/auth/staff-auth.module.js)
- [Auth admin cũ](../src/admin/modules/auth/index.js)
- [Cơ chế auth dùng chung](../src/common/auth/index.js)
- [Service xác thực](../src/common/auth/services/auth.service.js)
- [Actor đơn sinh viên](../src/common/student-requests/middlewares/request-actor.js)

Kiểm thử offline: npm run test:feature -- auth và npm test.
Test SQL thật yêu cầu cờ riêng; không nằm trong kiểm tra refactor mặc định.
