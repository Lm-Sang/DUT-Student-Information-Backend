# Quy ước đóng góp

Đọc [quy tắc agent](AGENTS.md), [kiến trúc](docs/ARCHITECTURE.md) và
[trách nhiệm các tầng](docs/LAYERS.md) trước khi thay đổi source.

1. Chọn khu vực student/admin/public rồi chọn module. Common chứa phần thực sự
   dùng chung; không import ngược từ common lên frontend.
2. Giữ các folder theo trách nhiệm khi có nhu cầu. Đặt tên controller/service/repository
   theo công việc khi một module có nhiều file; không tạo khung rỗng.
3. Giữ test ngoài source: tests/<khu-vực>/<module> hoặc tests/integration cho nhiều khu vực.
   CLI ở scripts/auth hoặc scripts/database, không đặt trong module.
4. Thêm endpoint phải ghi rõ request/response, channel xác thực, quyền và lỗi dự kiến.
   Không bỏ kiểm tra quyền cấp hồ sơ khi đã có middleware.
5. Khác module dùng facade index.js. Không để code nghiệp vụ import bootstrap/app/server.
6. Đổi entity path phải cập nhật generator và registry; không đổi tên bảng/cột hay
   chạy migration thật để kiểm tra refactor.
7. Chạy npm run test:feature -- <module>, npm run check và npm test.
   PowerShell có thể dùng npm.cmd.
8. PR ghi rõ thay đổi hành vi, URL tương thích và kết quả kiểm tra.
   Không commit secret hoặc thay đổi đang có của người khác ngoài phạm vi công việc.
