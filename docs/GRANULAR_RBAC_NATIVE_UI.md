# Quyền chi tiết và giao diện tích hợp — 07/11/2026

Nhánh feat/granular-rbac-native-ui kế thừa feat/rbac-ui-integration.
Các màn hình chứng chỉ ngoại ngữ, tin học và học vụ dùng thành phần bảng, form,
dialog và thanh công cụ của giao diện cũ. Không nhúng iframe hoặc dùng bridge
truyền token sang giao diện khác. Đơn đề nghị, xác nhận, LMS tiếp tục tách riêng.
FE ở project cùng cấp, ngoài repo backend.

## Quyền từng loại

Danh mục hiện có 41 quyền phạm vi: 6 đề nghị, 11 xác nhận, 1 LMS, 19 chứng chỉ
ngoại ngữ, 2 chứng chỉ tin học, 2 học vụ. Ngoài ra có 8 quyền Excel và 1 quản lý
danh mục: tổng 50 quyền cấu hình. Số loại lấy từ DB, không hardcode vào giao diện.

Mỗi checkbox cấp đúng một loại. Chỉ cấp work:CONFIRMATION:13 thì không có quyền
xác nhận sinh viên hoặc bảng điểm. IELTS và TOEIC là hai quyền độc lập.
Ngừng/gia hạn dùng chung một quyền; trở lại học dùng quyền khác. Có thể gán nhiều
quyền trực tiếp hoặc qua role cùng phòng. Role không chứa wildcard.
API tạo/sửa từ chối cấp quyền qua taskIds khác rỗng.

Kiểm tra quyền ở danh sách, chi tiết, thao tác, file minh chứng, PDF và Excel.
SQL mutation kiểm tra lại quyền hiệu lực trước khi ghi. Thu hồi quyền thì hồ sơ
từng được phân công cũng không còn truy cập được chỉ vì còn tên người phụ trách.
SSE chứng chỉ chỉ gửi gợi ý đồng bộ, không phát ID/nội dung loại không được giao.

Root quản lý phòng/tag/role/tài khoản cấp dưới; admin phòng quản lý chuyên viên
cùng phòng và gán quyền/role thuộc phòng. Không tạo chuyên viên CTSV.
Các tài khoản test cũ giữ quyền trước đây dưới dạng từng quyền riêng.
Có tài khoản test chỉ IELTS, ngừng/gia hạn, trở lại học, xác nhận hoãn NVQS.

## Excel

Ba module mới có POST /api/admin/<module>/workbook/export, /preview, /commit;
module là certifications, it-certifications, academic-leave.
Export nhận {ids}; preview nhận {file:base64}; commit nhận {batchId}.

Xuất danh sách đang hiển thị; MSSV và mã giữ text. Dropdown thao tác đúng giai
đoạn, ghi chú/lý do và cách xác minh. Preview không ghi dữ liệu, hiện lỗi từng
dòng. Commit kiểm tra lại token/quyền/version, cả batch dùng một transaction
TypeORM; lỗi một dòng rollback cả batch. Gửi lại batch thành công không xử lý lặp.
Chặn formula, macro, sửa cột bất biến, chữ ký sai, duplicate, bỏ qua tiếp nhận,
từ chối thiếu lý do. Quyền Excel không thay quyền từng loại hồ sơ.

## DB và triển khai

SQL Server loopback đang dùng Studentpage_Integration_20261103.
Backup COPY_ONLY/CHECKSUM đã VERIFYONLY:
.data/granular-rbac/before-granular-rbac.bak. Không ghi DB SSH.
Thêm hai bảng PermissionDefinitions/RoleDefinitions và hai view auth;
local có 56 bảng + 4 view, 60 TypeORM entity; 23 entity DB trường giữ nguyên.
Không bật synchronize/migrationsRun.

Chạy npm.cmd run auth:permissions:init trên DB organization hiện có;
DB mới theo [AUTH_ORGANIZATION.md](AUTH_ORGANIZATION.md).
Root đồng bộ quyền khi thêm loại vào danh mục; loại mới không tự cấp vào role cũ.
FE localhost:5173; backend localhost:3003.
Credential test chỉ ở file ignored .data/rbac-integration/test-accounts.private.json,
không có trong zip hoặc Git.

## Kiểm thử và giới hạn

Backend gồm 212 test. Bật AUTH_DB_TEST, AUTH_ORGANIZATION_DB_TEST,
RBAC_WORKFLOW_DB_TEST, GRANULAR_RBAC_DB_TEST để chạy cả fixture SQL local.
Suite SQL chạy tuần tự vì cùng DB và có khóa/cleanup transaction.
FE có 50 test và kiểm tra cú pháp. Fixture workflow dùng SQL thật, ảnh/PDF thật
và storage adapter bộ nhớ để không ghi dịch vụ ngoài. Có test rollback SQL lồng
nhau, tách quyền từng loại, thu hồi phiên/role, ngăn quản trị vượt phòng.

HTTP local kiểm tra Excel export → preview → commit không thay đổi cả ba module.
Trình duyệt kiểm tra quản lý chuyên viên, checkbox từng loại xác nhận, chứng chỉ
và học vụ bằng giao diện gốc. R2 đã kiểm tra file giả PUT/HEAD/đọc/signed GET/xóa
ở đợt trước; không upload thêm trong đợt này.

Chưa kiểm thử end-to-end đăng nhập DUT SSO thật và toàn bộ luồng sinh viên upload
R2 qua giao diện mới. Test adapter không thay thế hai bước đó.
Ảnh minh chứng cũ phụ thuộc object và quyền bucket R2 thực tế.

## Hoàn thiện nộp chứng chỉ và sửa PDF — 07/11/2026

Form chứng chỉ dùng schema/danh mục thật từ API: trường điểm hoặc bậc, cơ sở cấp,
điều kiện theo khóa; không cho nộp loại chưa tiếp nhận hoặc chưa cấu hình cơ sở cấp.
Đổi ngôn ngữ/loại xóa điểm/cơ sở cấp cũ nhưng giữ ảnh đã chọn. Có xem trước/bỏ ảnh,
khóa form khi nộp, tiến trình, lỗi ngay trên form, giữ mã đã chuẩn bị để retry.
Ngoại ngữ một ảnh; tin học nhiều ảnh theo giới hạn API. Chuyên viên tin học chỉ
xem minh chứng của lần đã nộp, sinh viên có thể sửa lần đang bổ sung.

Đã thao tác UI trên server fixture riêng với dữ liệu giả: đổi Anh sang Nhật chuyển
đúng schema và giữ ảnh; nộp ngoại ngữ; yêu cầu bổ sung, upload HTTP 503 rồi retry
vẫn giữ một mã; tin học nộp đủ hai ảnh. Không dùng auth giả trong server chính.

Lỗi PDF: FE đọc /applications/:id/print (text/html) như PDF. Đã đổi sang endpoint
PDF thật /api/student/academic-leave/print?MADN=..., giữ Bearer trong header, kiểm
Content-Type và chữ ký %PDF-. Tab mở đồng bộ khi bấm để tránh chặn popup. Nếu
xác nhận thành công nhưng tải lỗi, đơn vẫn hiển thị trong danh sách để tải lại.
Test SQL local đã gọi HTTP thực tế cho cả ngừng, gia hạn, trở lại, kiểm MIME/bytes
PDF và chặn người khác truy cập; giữ endpoint HTML tương thích.
