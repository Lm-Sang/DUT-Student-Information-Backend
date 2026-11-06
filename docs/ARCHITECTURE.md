# Kiến trúc theo feature

Mỗi nghiệp vụ có một thư mục trong `src/modules/`. Thành viên phụ trách feature
sửa code, DTO, mapper và test tại thư mục đó. `modules` chính là nơi chứa các
feature; không cần thêm một tầng `features` bên trong. Xem
[quy ước DTO, mapper, service và repository](LAYERS.md) để phân chia trách nhiệm.

## Cấu trúc

```text
src/
├── app.js                         # Middleware toàn ứng dụng và mount module
├── server.js                      # Khởi động HTTP, bật auth admin khi có cờ
├── config/
│   ├── env.js                     # Đọc/kiểm tra cấu hình môi trường
│   └── cors.js
├── infrastructure/
│   ├── database/                 # Instance trường (SQL/SSH) và local (Windows Auth)
│   └── http/json-api.client.js    # GET JSON, timeout, giới hạn body, lỗi upstream
├── modules/
│   ├── index.js                   # Đăng ký module, thứ tự mount, override khi test
│   ├── auth/
│   │   ├── index.js               # Export dùng cho các feature khác
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── dto/                  # Request/response contract và parser
│   │   ├── mappers/              # Claims/identity → DTO
│   │   ├── stores/               # State và session SQLite
│   │   ├── middlewares/          # Xác thực và kiểm tra permission
│   │   ├── student/               # Entry point/controller/routes cho student
│   │   ├── admin/                 # Entry point/controller/routes cho admin
│   │   └── __tests__/
│   ├── announcements/            # Các tầng + DTO/mapper cho thông báo
│   ├── curriculum/               # Các tầng + DTO/mapper cho khung CTĐT
│   ├── course-registration/      # API công khai từ hệ thống đăng ký tín chỉ
│   ├── timetable/                # API công khai từ hệ thống thời khóa biểu
│   ├── health/
│   ├── students/                 # Khung rỗng, chưa có endpoint nghiệp vụ
│   ├── users/                    # Khung rỗng, chưa có endpoint nghiệp vụ
│   └── admin/                    # Khung rỗng, khác với auth/admin
└── shared/
    ├── errors/
    ├── middlewares/              # Error handler và 404 toàn ứng dụng
    ├── utils/
    └── http/                     # Adapter dùng chung cho API GET theo allowlist

tests/
├── architecture.test.js          # Kiểm tra ranh giới import
├── integration/                  # Kiểm tra tích hợp nhiều feature
└── support/                      # Fixture và HTTP server dùng trong test
scripts/
├── test.js                       # Tự tìm test, hỗ trợ chạy riêng feature
├── check.js                      # Kiểm tra cú pháp src/scripts/tests
└── ...                           # Công cụ DB, export, smoke test thủ công
```

Các feature có test đặt trong `__tests__/`. Mỗi tầng có thư mục riêng, ví dụ
`controllers`, `services`, `repositories`, `dto`, `mappers`, `routes`. Chỉ tạo tầng
đang dùng; khi nghiệp vụ lớn hơn, chia tiếp theo nghiệp vụ con như `auth/student`
và `auth/admin`.

## Trách nhiệm trong một feature

Luồng thông thường:

```text
routes → controller → service → repository → infrastructure/database
```

| File | Trách nhiệm |
| --- | --- |
| `index.js` | Ghép các thành phần và export `{ basePath, router }`; export contract dùng bên ngoài |
| `routes/<feature>.routes.js` | Khai báo URL, HTTP method, middleware xác thực/quyền |
| `controllers/<feature>.controller.js` | Đọc request DTO, gọi service, trả response chuẩn |
| `dto/<feature>.request.dto.js` | Kiểm tra, chuẩn hóa và chọn field đầu vào |
| `dto/<feature>.response.dto.js` | Contract JSDoc và factory tạo response |
| `mappers/<feature>.mapper.js` | Chuyển bản ghi nguồn thành DTO, không I/O |
| `services/<feature>.service.js` | Xử lý nghiệp vụ; nhận repository qua tham số |
| `repositories/<feature>.repository.js` | Truy vấn SQL/HTTP và bind tham số; không xử lý response HTTP |
| `__tests__/*.test.js` | Test nghiệp vụ, API và repository của feature |

Không bắt buộc tạo đủ tất cả các file. Ví dụ `health` chỉ cần controller/routes.
`course-registration` và `timetable` hiện là các API GET chuyển tiếp: mỗi feature
sở hữu `index.js`, `routes/<feature>.endpoints.js` và test. Cơ chế GET, validation theo
schema, gỡ envelope, response và xử lý lỗi dùng chung qua
`shared/http/create-read-api-module.js`. Khi có nghiệp vụ riêng, thêm service/client
trong chính feature tương ứng.

## Ranh giới phụ thuộc

- Feature được dùng `config`, `shared`, `infrastructure` và file nội bộ của nó.
- Muốn dùng feature khác, import từ `src/modules/<feature>/index.js`. Không import
  trực tiếp repository/controller nội bộ của feature khác.
- `shared`, `config` và `infrastructure` không import ngược lên feature hay app.
- Middleware xác thực thuộc `auth`. Feature có route riêng cần bảo vệ thì dùng
  `import { authenticate, requirePermissions } from '../auth/index.js'` trong
  file route. Việc refactor không tự gắn quyền mới vào API đang có.
- SQL cụ thể và tên bảng nằm trong repository của feature; pool/SSH nằm trong
  `infrastructure/database/`. Xem [cách dùng hai instance](DATABASE_CONNECTIONS.md)
  để chọn nguồn trường hoặc local `sv_dut` cho từng feature.
- `app.js` chỉ ghép middleware và module. Nghiệp vụ không đặt vào `app.js` hoặc
  `server.js`.

`tests/architecture.test.js` kiểm tra các kiểu import tĩnh và dynamic import dùng
đường dẫn literal hiện có. Đây là kiểm tra ranh giới cơ bản; review vẫn cần kiểm
tra contract và trách nhiệm nghiệp vụ.

## Thêm một feature

Ví dụ nhóm muốn làm API điểm học tập `grades`:

1. Tạo `src/modules/grades/`, thêm routes/controller/service/repository cần thiết
   và test trong `__tests__/`.
2. Tạo entry point theo mẫu của `curriculum/index.js`. Khởi tạo dependency tại
   đây, không kết nối SQL ngay khi import:

   ```js
   import { createGradesController } from './controllers/grades.controller.js';
   import { createGradesRepository } from './repositories/grades.repository.js';
   import { createGradesRouter } from './routes/grades.routes.js';
   import { createGradesService } from './services/grades.service.js';

   export function createGradesModule({ repository = createGradesRepository() } = {}) {
     const service = createGradesService(repository);
     const controller = createGradesController(service);
     return { basePath: '/api/students/grades', router: createGradesRouter(controller) };
   }

   export default createGradesModule();
   ```

3. Trong `src/modules/index.js`, thêm import default, tham số
   `gradesModule = defaultGradesModule` và phần tử `gradesModule` trong danh sách
   trả về. Đây là file ghép feature duy nhất cần sửa. Đặt route cụ thể trước route
   động hoặc router có khả năng chặn nó.
4. Viết contract API trong `docs/`, cập nhật `.env.example` nếu thêm cấu hình,
   rồi chạy kiểm tra:

   ```bash
   npm run test:feature -- grades
   npm run check
   npm test
   ```

Khi test, có thể truyền module giả vào `createApp({ gradesModule: ... })` sau khi
đã thêm tham số đó vào registry, hoặc tắt module bằng `null`. Không tự động quét
và mount thư mục để tránh mở endpoint ngoài ý muốn. Auth admin vẫn chỉ được
`server.js` import khi `ENABLE_ADMIN_AUTH=true`.

## Chạy test

```bash
npm test                              # Toàn bộ feature, integration và architecture
npm run test:feature -- auth
npm run test:feature -- announcements
npm run test:feature -- curriculum
npm run test:feature -- course-registration
npm run test:feature -- timetable
npm run check                         # Cú pháp tất cả file JavaScript trong source/tool/test
```

Runner tự tìm `*.test.js`, nên thêm test mới không phải sửa `package.json`.
Lệnh chạy riêng feature chỉ chọn test trong thư mục feature đó; trước khi ghép
nhánh vẫn chạy toàn bộ để kiểm tra các thành phần dùng chung. Trên PowerShell
nếu `npm.ps1` bị Execution Policy chặn, dùng `npm.cmd` thay cho `npm`.

Các lệnh `test:db` và `test:curriculum:live` cần môi trường/database thật; chúng
không thuộc bộ test mặc định. Test API hiện dùng SQL giả và upstream HTTP local.

## Chia việc cho nhóm

| Phạm vi | Thư mục thường sửa |
| --- | --- |
| Đăng nhập, session, phân quyền | `src/modules/auth/` |
| Chương trình đào tạo | `src/modules/curriculum/` |
| Thông báo | `src/modules/announcements/` |
| Tích hợp đăng ký tín chỉ | `src/modules/course-registration/` |
| Tích hợp thời khóa biểu | `src/modules/timetable/` |
| Cấu hình, kết nối, middleware chung | `src/config/`, `src/infrastructure/`, `src/shared/` |

Mỗi người làm nhánh theo feature. Thống nhất request/response trước khi code;
khi sửa contract dùng chung, phối hợp với người phụ trách các feature bị ảnh
hưởng và chạy toàn bộ test. Chỉ sửa registry khi thêm/bỏ module, không sửa mỗi
lần thêm route. Các khung `students`, `users`, `admin` chưa có chức năng; nghiệp
vụ mới như điểm, học phí nên có module riêng thay vì gom hết theo vai trò người dùng.

## Đường dẫn thay đổi khi refactor

| Trước | Hiện tại |
| --- | --- |
| `src/modules/public/public.endpoints.js` | `modules/course-registration/routes/course-registration.endpoints.js` và `modules/timetable/routes/timetable.endpoints.js` (dưới `src/`) |
| `src/modules/public/public.client.js` | `src/infrastructure/http/json-api.client.js` |
| `src/modules/public/public.service.js`, `public.validation.js` | `src/shared/http/services/read-api.service.js`, `dto/read-api.request.dto.js` |
| `src/modules/public/public.controller.js`, `public.routes.js` | `src/shared/http/controllers/`, `routes/`; ghép trong `create-read-api-module.js` |
| `src/config/database.js` | `src/infrastructure/database/sql-server.js` |
| `src/shared/middlewares/auth.middleware.js` | `src/modules/auth/middlewares/auth.middleware.js`, export công khai qua `auth/index.js` |
| `src/modules/auth/student-auth.*` | `src/modules/auth/student/student-auth.*` |
| `tests/<feature>-api.test.js` | `src/modules/<feature>/__tests__/`, phần giao nhiều feature ở `tests/integration/` |
| `modules/<feature>/<feature>.controller.js`, `.service.js`, `.repository.js`, `.routes.js` | Các thư mục `controllers/`, `services/`, `repositories/`, `routes/` trong chính feature |

URL, HTTP method, response và cờ bật auth admin được giữ nguyên. Test hoặc công cụ
nội bộ từng truyền `createApp({ publicModule })` cần chuyển sang hai tham số
`courseRegistrationModule` và `timetableModule`; xem fixture trong
`tests/support/public-api.js`.
