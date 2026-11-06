# Trách nhiệm các tầng

Cấu trúc chia theo frontend → module → folder theo trách nhiệm.
Một folder có thể chứa nhiều file theo công việc, không ép một module vào một controller/service.

| Tầng | Trách nhiệm |
| --- | --- |
| routes | HTTP method/path, middleware và kết nối controller |
| controllers | Đọc DTO, nhận context đã xác thực, gọi service, trả status/header/body |
| dto | Parse, kiểm tra/chọn field đầu vào; contract đầu ra |
| services | Điều phối nghiệp vụ, repository và tích hợp bên ngoài |
| repositories | Query/transaction, bind parameter, đọc/ghi dữ liệu |
| rules | Quy tắc nghiệp vụ thuần, điều kiện và chuyển trạng thái |
| mappers | Chuyển dữ liệu giữa hình dạng nội bộ và contract |
| middlewares | Xác thực, ngữ cảnh request, quyền và policy HTTP |
| entities | EntitySchema giữ đúng metadata database |

## Chọn khu vực

- Chỉ dùng cho frontend sinh viên: student/modules/<module>.
- Chỉ dùng cho chuyên viên/admin: admin/modules/<module>.
- Được nhiều khu vực dùng: common/<module>.
- API công khai: public/modules/<module>.
- Tiện ích kỹ thuật: shared; kết nối và adapter hệ thống: infrastructure.

Không đưa tất cả service/repository vào common một cách máy móc. Ví dụ workflow
phân công và Excel chỉ ở admin; query/transaction đơn và quy tắc chuyển trạng thái
được cả hai phía sử dụng thì ở common.

DTO và mapper dùng chung chỉ giữ một bản. Nếu hai FE nhận contract khác nhau,
định nghĩa response mapper/DTO riêng ở phía tương ứng. Không trả entity thẳng cho FE.

Các controller chung chỉ giữ handler được hai phía dùng, như xem hồ sơ, tải file và
parse HTTP nhất quán. Controller sinh viên khai báo gửi/chỉnh sửa/xác nhận;
controller admin khai báo duyệt/tiếp nhận/quản trị.

## Quyền và dữ liệu

Middleware xác thực tại route. Service/repository tiếp tục kiểm tra quyền sở hữu,
phạm vi xử lý, phiên bản hồ sơ và quyền hiện tại. Không bỏ guard SQL khi tách URL.

DB trường chỉ đọc. Ghi DB local giữ transaction, idempotency và optimistic concurrency.
Đọc cấu hình từ config; không nhúng secret vào source hoặc test.

## Giữ cấu trúc vừa đủ

Chỉ tạo folder có code. Không thêm domain, application, use-cases hoặc lớp trung gian
chỉ để chuyển tiếp một lời gọi. Khi module có nhóm lớn như xuất tài liệu, tách nhóm đó
theo nghiệp vụ thực tế và mô tả trách nhiệm trong tài liệu module.

Test ở tests, CLI ở scripts. Xem [kiến trúc](ARCHITECTURE.md) và [quy tắc agent](../AGENTS.md).
