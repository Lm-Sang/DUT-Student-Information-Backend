# Auth: phòng ban, role và quyền từng loại hồ sơ

Tài khoản và quyền local lấy duy nhất từ auth. Sinh viên dùng DUT SSO; admin/staff
dùng kênh JWT và cookie riêng. Không lấy quyền từ role demo.

| Cấp | Khả năng |
|---|---|
| super_admin | Quản lý phòng/tag/role/quyền; tạo/sửa/khóa/reset admin phòng và chuyên viên; đổi cấp/phòng tài khoản cấp dưới |
| department_admin | Tạo/sửa/khóa/reset, gán role/quyền cho chuyên viên cùng phòng; theo dõi hồ sơ trong phòng |
| specialist | Chỉ xem và xử lý đúng từng loại hồ sơ được cấp; không quản lý người dùng |

Admin phòng không tạo admin khác, chuyển chuyên viên sang phòng khác hoặc tự
cấp quyền xử lý. Admin tổng không dùng quyền quản trị để duyệt hồ sơ.
Không tạo chuyên viên CTSV trong đợt tích hợp này.

## Nguồn dữ liệu

| Bảng/view | Vai trò |
|---|---|
| auth.LocalAccounts | Username, hash mật khẩu, tên, trạng thái |
| auth.AccountProfiles | Cấp quản trị, phòng, revision, định danh workflow |
| auth.Fields | Phòng ban |
| auth.PermissionDefinitions | Nhãn quyền, nhóm hiển thị, tag phòng, module, trạng thái |
| auth.AccountPermissions | Các quyền cấp riêng |
| auth.RoleDefinitions | Role tùy chỉnh, phòng, trạng thái, revision |
| auth.AccountRoles / auth.RolePermissions | Gán role và quyền cụ thể của role |
| auth.vAssignedPermissions | Hợp quyền cấp riêng và role hoạt động, giới hạn cùng phòng |
| auth.vEffectivePermissions | Thêm quyền thao tác kỹ thuật cho các phạm vi cụ thể |
| auth.AccountSecurityEvents | Audit quản trị và mật khẩu, không lưu secret |

Tasks/TaskPermissions/AccountTasks còn để tương thích dữ liệu cũ. Runtime không
lấy chúng làm nguồn cấp quyền. taskIds trả về trong phiên chỉ là nhãn module suy ra
từ quyền thật. API từ chối taskIds khác rỗng; phải gửi permissions hoặc roleIds.
Quyền rỗng và không role thì không xử lý được hồ sơ nào.

Mỗi loại đơn đề nghị là work:<MaLoaiDon>, mỗi xác nhận là
work:CONFIRMATION:<MaVanBan>. Ngoại ngữ: work:certifications:<CertificateTypes.Id>;
tin học: work:it-certifications:<MaCC>. Học vụ có work:academic-leave:leave
(ngừng/gia hạn) và work:academic-leave:return. Role chỉ chứa các quyền cụ thể;
không có wildcard cấp toàn module.

Tên/mã loại lấy từ DB. Root đồng bộ danh mục quyền sau khi thêm loại mới;
loại mới không tự cấp cho tài khoản hoặc role đang có. Đổi quyền/role/tag, khóa
tài khoản hoặc đổi/reset mật khẩu thu hồi phiên cũ.

## API

Prefix /api/admin/organization, Bearer admin; login /api/admin/auth/login.

| Method/path | Mục đích |
|---|---|
| GET /catalog | Phòng, nhóm module, quyền, role trong phạm vi |
| POST /catalog/sync | Root đồng bộ quyền từ danh mục DB |
| GET /accounts | Root xem tài khoản cấp dưới; admin phòng thấy chuyên viên cùng phòng |
| POST /accounts | Tạo tài khoản cấp dưới |
| PUT /accounts/:id | Sửa thông tin/quyền/role, tùy chọn mật khẩu; cần revision |
| DELETE /accounts/:id | Khóa và thu hồi quyền; cần revision |
| POST /roles; PUT /roles/:id | Root tạo/sửa role; sửa cần revision |
| PUT /permissions/:key | Root đổi fieldCode/active; key phải URL-encode |
| PUT/DELETE /fields/:code | Root quản lý phòng; chặn xóa phòng đang dùng |
| GET /progress/:taskId | Admin phòng theo dõi tiến độ |

Mật khẩu: POST /api/admin/auth/change-password dùng currentPassword/newPassword;
POST /api/admin/auth/accounts/:id/reset-password theo phân cấp. Staff có alias
ở /api/staff/auth. Tự đổi mật khẩu xong phải đăng nhập lại.

Ví dụ tạo chuyên viên chỉ xử lý giấy hoãn NVQS:

```json
{
  "username": "ChuyenvienNVQS",
  "password": "<mat-khau-do-admin-dat>",
  "displayName": "Chuyên viên xác nhận hoãn NVQS",
  "accessLevel": "specialist",
  "fieldCode": "DT",
  "permissions": ["work:CONFIRMATION:13", "workbook.export", "workbook.import"],
  "roleIds": [],
  "active": true
}
```

Excel là quyền bổ sung, không mở thêm loại hồ sơ. Mỗi dòng vẫn kiểm tra quyền loại,
giai đoạn, người phụ trách và phiên bản. Chuyên viên này không được mở/xử lý mười
loại xác nhận khác, kể cả gọi trực tiếp API hoặc sửa file Excel.

## Nâng cấp local

```powershell
npm.cmd run auth:db:init
npm.cmd run auth:organization:init
# DB đã có organization thì chỉ cần:
npm.cmd run auth:permissions:init
```

Migration chỉ chạy trên DB loopback được guard cho phép. Nó chuyển phân công
AccountTasks cũ thành các quyền riêng đúng một lần để giữ quyền hiện có; không
đổi mật khẩu và không cấp theo nhóm khi tạo/sửa sau đó. Không chạy trên SSH.

CLI auth:staff:create dùng --manager NAME --username NAME --name DISPLAY
--field DT --permissions work:DonSV01,work:academic-leave:leave --env-password;
có thể dùng --roles với mã role phân cách dấu phẩy. Mật khẩu lấy từ biến môi trường
DUT_AUTH_MANAGER_PASSWORD và DUT_STAFF_BOOTSTRAP_PASSWORD, không từ argv.

Xem [báo cáo tích hợp và kiểm thử](GRANULAR_RBAC_NATIVE_UI.md).
