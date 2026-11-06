# Chuyển đổi cấu trúc và URL

## Vị trí code

| Trước | Sau |
| --- | --- |
| src/modules/index.js | src/bootstrap/modules.js |
| Prefix student/admin từng đặt trong factory | src/student/student.routes.js và src/admin/admin.routes.js |
| src/modules/auth/student | src/student/modules/auth |
| src/modules/auth/admin | src/admin/modules/auth |
| Cơ chế auth dùng chung | src/common/auth |
| Router/controller hỗn hợp chứng chỉ/ngừng học | Phần riêng ở student/modules và admin/modules; handler chung ở common |
| Service phân công và Excel trong student-requests | src/admin/modules/student-requests/services |
| Repository/entity/nghiệp vụ dùng chung | src/common/<module> |
| Thông báo, CTĐT, đăng ký tín chỉ, TKB, health | src/public/modules/<module> |
| domain | rules trong module sở hữu quy tắc |
| src/modules/<module>/__tests__ | tests/common, tests/admin hoặc tests/public theo module |
| Kiểm tra ranh giới ở tests/architecture.test.js | tests/architecture/boundaries.test.js |
| CLI trong module auth | scripts/auth |
| CLI và SQL khởi tạo ngừng học/auth | scripts/database và scripts/database/sql |
| Router phiên demo trong module chính | src/development/student-requests |

Các khung rỗng users/admin và router students không có endpoint được bỏ; dữ liệu và
service hồ sơ sinh viên thật vẫn ở common/students. Registry vẫn nhận override cũ
để các test/caller tự thay thế module mà không cần khung rỗng.

## URL nghiệp vụ

| URL trước refactor, tiếp tục hỗ trợ | URL theo frontend |
| --- | --- |
| /api/student-services/requests | /api/student/requests |
| /api/staff/student-services/requests | /api/admin/requests |
| /api/certifications/applications | /api/student/certifications/applications |
| /api/certifications/reviewer/applications | /api/admin/certifications/applications |
| /api/certifications/management/catalog | /api/admin/certifications/management/catalog |
| /api/it-certifications/applications | /api/student/it-certifications/applications |
| /api/it-certifications/reviewer/applications | /api/admin/it-certifications/applications |
| /api/academic-leave/applications | /api/student/academic-leave/applications |
| /api/academic-leave/reviewer/applications | /api/admin/academic-leave/applications |

Các URL phụ của chứng chỉ/ngừng học giữ nguyên suffix sau phần prefix được chuyển.
Đơn sinh viên chuyển /me, /profile, /catalogs sang dưới /api/student/requests hoặc
/api/admin/requests. Với đơn sinh viên, suffix /:id, /:id/file, /:id/print và
/:id/actions nằm ngay dưới collection mới, không lặp lại /requests.

Quản trị quyền đơn giữ đường cũ /api/staff/student-services/admin/staff và /admin/roles.
Đường mới tương ứng là /api/admin/requests/accounts và /api/admin/requests/roles.
Excel ở /api/admin/requests/workbook. Giữ kiểm tra quyền SQL và scope xử lý hiện có.

API mới chỉ khai báo thao tác thuộc frontend đó. Sinh viên không có endpoint quản trị
hoặc đăng nhập demo; phía admin không có endpoint gửi đơn thay sinh viên.
URL chuyên viên cũ POST /requests vẫn từ chối với 403 như trước.

Alias dùng cùng service/controller và policy; không chuyển hướng mutation HTTP.
URL in trả về trong dữ liệu có thể vẫn dùng URL tương thích cũ để giữ session in.
API public và health giữ nguyên. Không đổi tên field, status workflow, SQL schema,
snapshot, transaction, idempotency hoặc metadata entity trong refactor này.

## Xác thực và công cụ

Auth URL/cookie/audience giữ nguyên; xem [AUTH_CHANNELS.md](AUTH_CHANNELS.md).
Các API /api/admin/requests dùng channel staff, các API duyệt chứng chỉ/ngừng học
dùng channel admin như trước. Source tách hai frontend không đồng nghĩa gộp token.

Demo chỉ mount khi được bật và có guard chặn production. Thư mục FE local bị Git
ignore không còn được server import; lệnh certifications:fe trỏ tới thư mục không
được version hóa đã bỏ. Chạy hai frontend từ repository riêng.

Generator entity, đường dẫn mẫu biểu, test runner và CLI đã theo layout mới.
Các tài liệu khảo sát/kế hoạch trước đây mang tính lịch sử; cấu trúc hiện hành theo
[ARCHITECTURE.md](ARCHITECTURE.md), [LAYERS.md](LAYERS.md) và [AGENTS.md](../AGENTS.md).
