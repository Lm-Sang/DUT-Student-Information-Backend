# Đổi và đặt lại mật khẩu auth

Credential local chỉ nằm ở auth.LocalAccounts. Admin và staff là hai channel JWT
của cùng tài khoản auth, giữ audience/cookie path riêng. Không đọc hoặc đồng bộ hash
sang bảng đăng nhập demo. Sinh viên tiếp tục dùng token SSO gốc.

- POST /api/admin/auth/change-password: body currentPassword, newPassword.
- POST /api/admin/auth/accounts/:id/reset-password: body newPassword, id là UUID auth.
- Các endpoint có alias /api/staff/auth cho chuyên viên; chuyên viên không được reset người khác.
- Root chỉ reset admin phòng; admin phòng chỉ reset specialist cùng phòng.
- PUT /api/admin/organization/accounts/:id cũng cho phép đặt lại password theo cùng phân cấp.

Các request yêu cầu Bearer đúng channel và Origin đúng frontend. Mật khẩu mới theo
policy auth: 9–128 ký tự, có chữ và số, không trùng username. Tự đổi cần mật khẩu cũ
đúng và mật khẩu mới khác mật khẩu cũ. Không nhận quyền hoặc targetId trong body.

Repository recheck tài khoản, profile/revision, hash/version và quan hệ quản lý dưới
transaction lock. Hash mới được lưu trong auth.LocalAccounts; profile revision tăng,
audit ghi auth.AccountSecurityEvents. Không ghi mật khẩu/hash trong audit.
Tất cả phiên admin/staff của tài khoản bị đổi/reset đều mất hiệu lực; reset không
đăng xuất người quản lý. Response thành công yêu cầu tài khoản đích đăng nhập lại.

Kiểm tra offline: tests/common/auth/password-management.test.js.
SQL integration: AUTH_DB_TEST=1 với tests/common/auth/password-management-sql.test.js;
fixture có UUID riêng, được dọn sau test. Không chạy test lên DB trường.
