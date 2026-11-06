# Phòng ban, tác vụ và phân quyền auth

Auth là nguồn duy nhất của tài khoản, mật khẩu và quyền local. Không fallback sang
role, permission hoặc credential của demo khi tài khoản thiếu profile auth.

Luồng xử lý hồ sơ và nguồn dữ liệu:
[chứng chỉ/nghỉ học](CERTIFICATIONS_ACADEMIC_LEAVE_WORKFLOW.md).

| Bảng | Trách nhiệm |
| --- | --- |
| auth.LocalAccounts | Username, mật khẩu băm, tên hiển thị và trạng thái tài khoản |
| auth.AccountProfiles | Vai trò, phòng, revision và liên kết định danh người xử lý |
| auth.Fields | Danh mục phòng và trạng thái hoạt động |
| auth.Tasks | Tác vụ số thuộc phòng |
| auth.AccountTasks | Tác vụ được giao cho chuyên viên, FK buộc cùng phòng |
| auth.TaskPermissions | Quyền thao tác và work scope của tác vụ |
| auth.AccountSecurityEvents | Audit tạo/sửa tài khoản và đổi/reset mật khẩu, không lưu secret/hash |

## Luồng hoạt động

| Vai trò | Được phép | Bị chặn |
| --- | --- | --- |
| super_admin | Quản lý phòng và tạo/sửa/khóa admin phòng | Trực tiếp xử lý hồ sơ sinh viên hoặc tạo chuyên viên vượt cấp |
| department_admin | Tạo/sửa/khóa chuyên viên cùng phòng, giao tác vụ, xem tiến độ | Quản lý phòng khác, tự cấp quyền xử lý hoặc duyệt/sửa hồ sơ |
| specialist | Xử lý đúng tác vụ được giao trong phòng | Quản lý tài khoản/role, xử lý tác vụ không được giao |
| Sinh viên SSO | Tạo/xem/thao tác hồ sơ của chính mình theo trạng thái | Quản trị hoặc chọn danh tính/người sở hữu từ request |

Admin phòng DT có thể GET danh sách/chi tiết chứng chỉ và nghỉ học để theo dõi;
mutation xét duyệt và quản lý danh mục vẫn bị chặn. Progress chỉ trả metadata trạng
thái trong phòng, không trả mật khẩu, payload hoặc URL tải file.

| TaskId | TaskCode | Phòng |
| --- | --- | --- |
| 1 | certifications — chứng chỉ ngoại ngữ | DT |
| 2 | it-certifications — chứng chỉ tin học | DT |
| 3 | academic-leave — nghỉ học/tiếp tục học | DT |
| 4 | student-requests — xử lý đơn | DT |

Danh mục phòng: KT, QC, SV, TTHL, TTTH, SSERC, DT, TC, PC. Tác vụ 4 ánh xạ sang
quyền chức năng và work key từng loại đơn/văn bản DT. Các kiểm tra người phụ trách,
quyền sở hữu, trạng thái, phiên bản và transaction của hồ sơ vẫn giữ nguyên.

## Nguồn auth và dữ liệu workflow

Admin/staff giữ hai audience và cookie path riêng. Cả hai channel đều đọc cùng
credential từ auth.LocalAccounts, và quyền từ profile/phòng/tác vụ auth. Staff
login chỉ dành cho specialist có định danh workflow; API đơn yêu cầu thêm task 4.
Tài khoản thiếu profile không được đăng nhập. Đổi quyền, trạng thái phòng/tài khoản
hoặc mật khẩu làm phiên cũ mất hiệu lực; đổi/reset mật khẩu áp dụng cả hai channel.

Bản ghi svc_demo.TaiKhoan chỉ giữ định danh workflow và FK/lịch sử hồ sơ. Tài khoản
mới không tạo credential trong DangNhapChuyenVien, không gán TaiKhoanVaiTro hoặc
VaiTroQuyen. Các bảng demo cũ giữ lịch sử nhưng không cấp quyền. View tương thích
svc_demo.vQuyenHieuLuc chỉ chiếu quyền từ auth để SQL transaction kiểm tra tại DB.
Module demo không còn được bootstrap mặc định; API requests không mount CRUD
account/role hay quyền demo. Các URL quản lý cũ phải chuyển sang organization.

## Áp dụng và tạo tài khoản

Chỉ áp dụng ở SQL local được guard cho phép:

```sh
npm run auth:db:init
npm run auth:organization:init
```

Migration [auth-organization-schema.sql](../scripts/database/sql/auth-organization-schema.sql)
và view quyền được áp dụng trong transaction, không đổi mật khẩu hay xóa hồ sơ.
Khởi tạo root đầu tiên bằng auth:user:create (nhập mật khẩu ẩn) hoặc
[bootstrap-organization.mjs](../scripts/auth/bootstrap-organization.mjs) qua stdin.
Khi đã có root, tạo các tài khoản tiếp theo bằng API auth đúng phân cấp.

CLI auth:staff:create cũng dùng cùng service organization. Cần --manager NAME,
--username NAME, --name DISPLAY, --field DT, --tasks 1,4, --env-password. Nhập bí mật
qua biến môi trường tiến trình DUT_AUTH_MANAGER_PASSWORD và DUT_STAFF_BOOTSTRAP_PASSWORD;
không truyền mật khẩu qua argv, không lưu vào Git. Không còn --bootstrap-admin dựa
trên role demo. Admin tổng không dùng CLI này để tạo chuyên viên vượt cấp.

Username do admin chọn, 1–64 ký tự, hỗ trợ Unicode/hoa thường/khoảng trắng bên trong;
loại ký tự điều khiển và khoảng trắng đầu/cuối. Đăng nhập không phân biệt hoa/thường.
Mật khẩu 9–128 ký tự, có chữ và số, không trùng username; cùng policy khi tạo/đổi/reset.
Mật khẩu hiện có không bị đổi khi chuyển nguồn auth.

## API quản lý

Bật ENABLE_ADMIN_AUTH=true. Đăng nhập `/api/admin/auth/login`, dùng admin Bearer.

| Method | URL | Quyền |
| --- | --- | --- |
| GET | /api/admin/organization/catalog | Danh mục trong phạm vi tài khoản |
| GET | /api/admin/organization/accounts | Root thấy admin phòng; admin phòng thấy chuyên viên cùng phòng |
| POST | /api/admin/organization/accounts | Tạo tài khoản cấp dưới đúng phòng |
| PUT | /api/admin/organization/accounts/:id | Sửa tên, trạng thái, taskIds, tùy chọn mật khẩu; cần revision |
| DELETE | /api/admin/organization/accounts/:id | Khóa tài khoản, thu hồi tác vụ; cần revision |
| PUT/DELETE | /api/admin/organization/fields/:code | Admin tổng quản lý phòng; xóa phòng đang dùng trả 409 |
| GET | /api/admin/organization/progress/:taskId | Admin phòng xem tiến độ cùng phòng |
| POST | /api/admin/auth/change-password | Tự đổi mật khẩu, cần currentPassword và newPassword |
| POST | /api/admin/auth/accounts/:id/reset-password | Reset theo đúng phân cấp/phòng |

Hai endpoint mật khẩu có alias ở /api/staff/auth cho specialist; specialist không
được reset tài khoản khác. Đổi mật khẩu tự thu hồi phiên và yêu cầu đăng nhập lại.
Reset qua PUT account cũng tuân theo phân cấp và có audit.

Tạo chuyên viên từ admin phòng DT:

```json
{
  "username": "ChuyenvienDT03",
  "password": "<password-do-admin-dat>",
  "displayName": "Chuyên viên đào tạo",
  "accessLevel": "specialist",
  "fieldCode": "DT",
  "taskIds": [1, 2],
  "active": true
}
```

Root tạo admin phòng với accessLevel department_admin và taskIds rỗng. Không nhận
permissions/roleIds tùy ý từ frontend. Sửa không đổi vai trò/phòng hoặc username;
đổi vai trò/phòng cần migration riêng. Login/me trả user.tags gồm role, fieldCode,
taskIds cho FE hiển thị, nhưng BE luôn kiểm tra quyền trong DB.

Kiểm tra offline: npm test và npm run check. SQL integration opt-in dùng
AUTH_DB_TEST=1 và AUTH_ORGANIZATION_DB_TEST=1; fixture rollback/dọn theo UUID,
không thay đổi tài khoản người dùng. test:auth:requests chạy bộ SQL integration này.
