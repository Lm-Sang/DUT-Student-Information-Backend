# API sinh viên

[student.routes.js](student.routes.js) là nơi xem và đăng ký các nhóm API dưới
`/api/student`: auth, đơn sinh viên, chứng chỉ ngoại ngữ/CNTT và ngừng học.

- Endpoint chi tiết, controller và xử lý riêng nằm trong [modules/](modules/).
- Nghiệp vụ và dữ liệu dùng chung với admin nằm trong [common/](../common/).
- [Bootstrap](../bootstrap/) tạo dependency và giữ URL cũ; không khai báo prefix
  student mới trong factory module.
- Khi thêm chức năng, tạo module có code thực tế, nối dependency tại bootstrap,
  rồi đăng ký router của nó trong file route chính ở đây.

Guard nằm tại router từng module; file gom route không thay đổi token hoặc quyền.
