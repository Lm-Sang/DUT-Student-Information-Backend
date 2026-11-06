# API chuyên viên và quản trị viên

[admin.routes.js](admin.routes.js) là nơi xem và đăng ký các nhóm API dưới
`/api/admin`: auth admin cũ, xử lý đơn, chứng chỉ ngoại ngữ/CNTT và ngừng học.

- Endpoint chi tiết và workflow riêng nằm trong [modules/](modules/).
- Nghiệp vụ và dữ liệu dùng chung với sinh viên nằm trong [common/](../common/).
- [Bootstrap](../bootstrap/) tạo dependency và giữ URL cũ; không khai báo prefix
  admin mới trong factory module.
- Khi thêm chức năng, tạo module có code thực tế, nối dependency tại bootstrap,
  rồi đăng ký router của nó trong file route chính ở đây.

Staff auth tiếp tục ở `/api/staff/auth` để giữ cookie path và audience hiện có.
Admin auth cũ vẫn opt-in. File gom route không cấp thêm quyền cho tài khoản;
guard từng module tiếp tục kiểm tra channel và phạm vi xử lý.
