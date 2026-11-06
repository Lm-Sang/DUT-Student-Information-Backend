# DUT Student Information Backend

Phân quyền admin tổng / admin phòng / chuyên viên, fieldCode và TaskId:
[hướng dẫn schema và API](docs/AUTH_ORGANIZATION.md).

Backend Node.js/Express phục vụ hai frontend riêng: sinh viên và chuyên viên/admin.
Quy tắc làm việc của agent nằm trong [AGENTS.md](AGENTS.md).

## Cấu trúc

```text
src/
├── student/             # student.routes.js, README và modules sinh viên
├── admin/               # admin.routes.js, README và modules chuyên viên/admin
├── common/              # Nghiệp vụ, repository, entity, DTO/mapper dùng chung
├── public/modules/      # API công khai: thông báo, CTĐT, đăng ký tín chỉ, TKB, health
├── bootstrap/           # Ghép dependency và giữ URL tương thích
├── development/         # Phiên demo local, không mount trong production
├── infrastructure/      # SQL Server/TypeORM, HTTP, storage, PDF/Word, ảnh
├── shared/              # Error, response, middleware và adapter kỹ thuật chung
├── config/
├── database.js          # Đăng ký entity, không mở kết nối SQL khi import
├── app.js
└── server.js

tests/                   # Toàn bộ kiểm thử, tách khỏi source
scripts/                 # CLI, schema SQL, công cụ DB và smoke test
assets/                  # Mẫu biểu, font và tài nguyên tạo tài liệu
```

Route chính của từng phía: [sinh viên](src/student/student.routes.js) và
[chuyên viên/admin](src/admin/admin.routes.js). Hai file này được mount trực tiếp
tại app, giúp xem các nhóm API mà không cần mở từng factory.

Bên trong module, chỉ tạo các folder có nhu cầu: routes, controllers, services,
repositories, dto, mappers, middlewares, rules, entities. Có thể có nhiều file
trong mỗi tầng theo trách nhiệm nghiệp vụ. Không tạo module hoặc tầng rỗng.

Xem [kiến trúc](docs/ARCHITECTURE.md), [trách nhiệm từng tầng](docs/LAYERS.md),
[quy ước đóng góp](CONTRIBUTING.md) và [bảng chuyển đổi cấu trúc/API](docs/REFACTOR_LAYOUT.md).

## Chạy ứng dụng

Yêu cầu Node.js >=24.11.0. Tạo cấu hình local từ [.env.example](.env.example),
điền secret riêng và không commit file môi trường.

```bash
npm install
npm run dev
```

Backend mặc định ở cổng 3003; health tại GET /api/health.
Cấu hình origin của hai FE qua CORS_STUDENT_ORIGINS và CORS_ADMIN_ORIGINS.
CORS không thay thế xác thực và phân quyền.

## API cho hai frontend

| Chức năng | Sinh viên | Chuyên viên/admin |
| --- | --- | --- |
| Đơn sinh viên | /api/student/requests | /api/admin/requests |
| Chứng chỉ ngoại ngữ | /api/student/certifications | /api/admin/certifications |
| Chứng chỉ CNTT | /api/student/it-certifications | /api/admin/it-certifications |
| Ngừng học/gia hạn/trở lại học | /api/student/academic-leave | /api/admin/academic-leave |

Các URL trước refactor tiếp tục hoạt động qua adapter tương thích. API công khai
vẫn ở /api/public. Chi tiết method, URL phụ và token: [hướng dẫn chuyển đổi](docs/REFACTOR_LAYOUT.md).

Sinh viên dùng trực tiếp access token DUT SSO làm Bearer xuyên suốt API sinh viên
và API DUT; backend xác minh secret key, HS256, hạn dùng và danh sách logout,
không yêu cầu issuer/audience SSO hay phát JWT/refresh riêng cho sinh viên. Chuyên viên
đăng nhập /api/staff/auth bằng tài khoản local; auth admin cũ ở /api/admin/auth
vẫn opt-in. Admin/staff dùng JWT_SECRET riêng, khác khóa SSO; đặt JWT_SHARE_SSO_KEY=false.
Không dùng lẫn token staff/admin. Xem [auth hiện tại và hướng dẫn FE](docs/AUTH_CHANNELS.md).

Tài khoản local và quyền chỉ lấy từ auth theo phân cấp admin tổng → admin phòng →
chuyên viên được giao tác vụ. Không fallback sang RBAC demo; API tạo tài khoản và
giao tác vụ ở `/api/admin/organization`. Giữ dữ liệu hồ sơ cũ và định danh người xử lý,
không tạo credential mới trong demo. Xem [phân quyền auth](docs/AUTH_ORGANIZATION.md).

## Database và tài liệu

DB trường chỉ đọc qua SQL Server/SSH; DB local ghi theo guard và transaction hiện có.
Refactor cấu trúc không đổi bảng/cột, không tự chạy migration hoặc đồng bộ schema.

- [Kết nối database](docs/DATABASE_CONNECTIONS.md)
- [TypeORM và entity](docs/TYPEORM_MIGRATION.md)
- [Luồng đơn sinh viên](docs/REQUEST_WORKFLOWS.md)
- [Chứng chỉ và ngừng học dành cho FE](docs/FE_HANDOVER_CERTIFICATIONS_ACADEMIC_LEAVE.md)
- [Workflow chứng chỉ/nghỉ học và nguồn dữ liệu local của chuyên viên/admin](docs/CERTIFICATIONS_ACADEMIC_LEAVE_WORKFLOW.md)
- [Ngừng học, gia hạn và trở lại học](src/common/academic-leave/README.md)
- [Mẫu biểu và xuất tài liệu](assets/request-forms/README.md)

Các CLI giữ nguyên tên lệnh npm: auth:db:init, auth:user:create,
auth:staff:create, academic-leave:db:init. Mã CLI ở scripts/auth và scripts/database.
Chỉ chạy lệnh DB khi có chủ đích; npm test không chạy smoke test live.

Workflow chứng chỉ/nghỉ học mới cần nâng cấp DB local bằng
`npm run db:review-workflow:upgrade` trước khi chạy backend. Luồng và cách chuyển
dữ liệu cũ được ghi trong [hướng dẫn workflow](docs/CERTIFICATIONS_ACADEMIC_LEAVE_WORKFLOW.md).

Khi đã có thư mục [certification-web-test](certification-web-test/) trong dự án,
chạy hai FE test từ thư mục gốc bằng:

```bash
npm run certifications:fe
```

FE sinh viên ở http://localhost:5173, FE chuyên viên ở http://localhost:5174.
Lệnh này chỉ khởi động FE; chạy backend riêng bằng `npm run dev`.
Cấu hình FE được đọc từ `certification-web-test/.env` nếu có, mặc định gọi backend
ở http://localhost:3003. Xem [hướng dẫn FE test](certification-web-test/README.md).

## Kiểm tra

```bash
npm test
npm run test:feature -- student-requests
npm run test:feature -- auth
npm run check
```

Bộ test mặc định dùng fake dependency/upstream local; test SQL live cần cờ môi trường
riêng và được skip mặc định. PowerShell có thể dùng npm.cmd nếu Execution Policy chặn npm.ps1.

## Quy t?c th?i h?n v? DB local

Xem [quy t?c th?i h?n ch?ng ch?/h?c v?](docs/REQUEST_REGULATIONS.md) v? m?c ti?p nh?n, x? l?, tr? k?t qu? v? tag qu? h?n trong API danh s?ch/chi ti?t. B? [Database_newversion](Database_newversion/README.md) ch?a c?u tr?c, danh m?c DB local v? h??ng d?n d?ng m?i tr??ng.
