# Kiến trúc backend theo frontend và module

Phân quyền ba cấp, phòng và tác vụ được mô tả tại [AUTH_ORGANIZATION.md](AUTH_ORGANIZATION.md).
Schema và quyền hiệu lực thuộc [common/auth](../src/common/auth/); API quản lý
và truy vấn tiến độ chỉ dành cho admin thuộc [organization](../src/admin/modules/organization/).

Quy tắc bắt buộc cho agent: [AGENTS.md](../AGENTS.md).
Các đường dẫn thay đổi và alias API: [REFACTOR_LAYOUT.md](REFACTOR_LAYOUT.md).

## Khu vực và quyền sở hữu

- student/modules: HTTP và workflow riêng cho sinh viên.
- admin/modules: HTTP và workflow riêng cho chuyên viên/quản trị viên.
- public/modules: API không yêu cầu đăng nhập theo contract hiện có.
- common/<module>: dữ liệu và nghiệp vụ được nhiều khu vực sử dụng.
- shared: kỹ thuật dùng chung, không sở hữu nghiệp vụ.
- infrastructure: database, HTTP client, R2, xử lý ảnh, Word và PDF.
- bootstrap: tạo dependency graph, đăng ký module và URL tương thích.
- development: demo local có guard, không mount trong production.

Student/admin là hai khu vực của hai FE. Chuyên viên và quản trị viên được phân quyền
bên trong khu vực admin; không tạo bản sao module cho từng vai trò RBAC.

## Ví dụ module

```text
src/student/modules/student-requests/
├── controllers/requests.controller.js
└── routes/requests.routes.js

src/admin/modules/student-requests/
├── controllers/requests.controller.js
├── routes/requests.routes.js
└── services/
    ├── admin-workflow.service.js
    ├── workbook-workflow.service.js
    └── request-workbook.js

src/common/student-requests/
├── controllers/       # Các handler đọc hồ sơ/tài liệu được cả hai phía dùng
├── dto/
├── entities/
├── mappers/
├── middlewares/
├── repositories/
├── rules/
└── services/
```

Không tạo sẵn mọi folder cho mọi module. DTO, mapper, middleware chỉ dùng một phía
thì thuộc phía đó; phần thực sự dùng chung được giữ một bản trong common.
Các handler đọc hồ sơ và hạ tầng auth có thể dùng chung; thao tác gửi đơn,
duyệt hồ sơ và quản trị danh mục được khai báo trong controller phía sở hữu.

## Luồng phụ thuộc

```text
student hoặc admin: route → controller → service
                                           ↓
                          common: service → repository → infrastructure
                                     ↓
                                  rules/mapper
```

- Student/admin/public không import lẫn nhau.
- Common không import student/admin/public/bootstrap/development.
- Config/shared/infrastructure không import nghiệp vụ hoặc composition root.
- Khác module nghiệp vụ phải dùng facade index.js; các phần của cùng một module
  nằm ở khu vực và common được truy cập phần nội bộ tương ứng.
- DTO, mapper, rules không làm I/O. Repository không gọi controller/service.
- Composition root được phép import các thành phần để ghép dependency.
- Registry entity trong [database.js](../src/database.js) sở hữu việc ghép metadata;
  không tự mở kết nối SQL hoặc synchronize schema.

## Đăng ký và tương thích

[modules.js](../src/bootstrap/modules.js) giữ registry theo tên module rõ ràng.
Các factory ở bootstrap/modules xây service dùng chung và controller riêng từng phía.
Mỗi factory trả về basePath/router tương thích, kèm studentRouter/adminRouter.

[student.routes.js](../src/student/student.routes.js) đăng ký các nhóm API dưới
/api/student; [admin.routes.js](../src/admin/admin.routes.js) đăng ký các nhóm API dưới
/api/admin. Prefix nghiệp vụ được khai báo tại hai file này, không lặp trong factory.
README của từng khu vực giúp tìm module, phần dùng chung và cách thêm chức năng.

[app.js](../src/app.js) ghép middleware, hai router chính và các URL cũ/public;
không chứa nghiệp vụ. Auth student/admin chỉ mount một lần tại router phía tương ứng;
staff auth giữ /api/staff/auth để không thay đổi cookie path hoặc audience.
Giữ moduleOverrides để test thay thế hoặc tắt một module bằng null.
Tắt module phải tắt cả URL cũ và URL mới của module đó.

Adapter ở bootstrap/routes chỉ ghép các router student/admin để giữ URL cũ.
Không sao chép khai báo endpoint hoặc redirect POST/PATCH sang URL mới.
Các alias dùng chung service, kiểm tra quyền và bộ giới hạn request của module.

Sinh viên dùng nguyên access token SSO, xác minh HS256/secret/hạn dùng và logout tại common/auth;
không dùng JWT hoặc refresh riêng của BE. State được ràng buộc qua đường dẫn callback
và cookie; handoff trả lại token SSO gốc. Admin/staff giữ audience và cookie path riêng,
dùng khóa JWT nội bộ độc lập; refresh trùng trong 5 giây trả 409, replay sau đó thu hồi phiên.
Không tự coi đổi thư mục thành quyền truy cập mới. Chi tiết channel hiện hành nằm trong
[AUTH_CHANNELS.md](AUTH_CHANNELS.md).

## Test, CLI và tài nguyên

Toàn bộ test ở tests/common, tests/admin, tests/public, tests/integration,
tests/infrastructure, tests/architecture và tests/support. Tạo tests/student
khi bổ sung test riêng cho khu vực sinh viên. Không để test trong source nghiệp vụ.

CLI ở scripts/auth và scripts/database; schema SQL khởi tạo ở scripts/database/sql.
Generator entity xuất về common cho dữ liệu dùng chung và public/modules cho dữ liệu
của module công khai. Mẫu biểu/font giữ ở assets, không nhân bản theo frontend.

Chạy npm run test:feature -- <module> để chọn test theo module ở mọi khu vực,
npm test để chạy toàn bộ offline, npm run check để kiểm tra cú pháp .js và .mjs.
Architecture test kiểm tra hướng phụ thuộc, tầng, import tồn tại và vị trí test/CLI.

## Nguồn phân quyền duy nhất

Tài khoản local, mật khẩu và quyền nằm trong common/auth. Admin tổng quản lý phòng/admin phòng;
admin phòng quản lý chuyên viên và tác vụ cùng phòng; chuyên viên xử lý đúng task được giao.
Không fallback sang role/permission demo khi thiếu profile. Bootstrap không mount module demo;
API requests không cung cấp CRUD tài khoản/role. SQL workflow giữ view quyền tương thích nhưng
view chỉ đọc auth. Bản ghi người xử lý và hồ sơ lịch sử được giữ, không sao chép credential mới
sang demo. Chi tiết tại [AUTH_ORGANIZATION.md](AUTH_ORGANIZATION.md).

## Dữ liệu chuyên viên/admin của chứng chỉ và nghỉ học

Các API đọc hồ sơ và tiến độ dùng DB local cùng snapshot đã lưu; không gọi dịch vụ
hồ sơ sinh viên hoặc DB trường để bổ sung dữ liệu thiếu trên hồ sơ cũ. Adapter
DB trường chỉ tham gia các bước lập/nộp hồ sơ của sinh viên cần dữ liệu nguồn.
SSE ngoại ngữ/tin học dùng endpoint và task riêng. Admin phòng theo dõi, chuyên viên
được giao tác vụ mới được xử lý; không có cấp duyệt admin bổ sung.
Xem [workflow và trạng thái](CERTIFICATIONS_ACADEMIC_LEAVE_WORKFLOW.md).

## Quy t?c th?i h?n v? DB local

Xem [quy t?c th?i h?n ch?ng ch?/h?c v?](REQUEST_REGULATIONS.md) v? m?c ti?p nh?n, x? l?, tr? k?t qu? v? tag qu? h?n trong API danh s?ch/chi ti?t. B? [Database_newversion](../Database_newversion/README.md) ch?a c?u tr?c, danh m?c DB local v? h??ng d?n d?ng m?i tr??ng.
