# Làm việc theo feature

Đọc [kiến trúc và cách thêm feature](docs/ARCHITECTURE.md) trước khi sửa source.

1. Chia nhiệm vụ theo nghiệp vụ, tạo nhánh như `feat/announcements-search` hoặc
   `fix/curriculum-validation`.
2. Sửa code và test trong `src/modules/<feature>/`. API dùng giữa các feature
   phải export qua `index.js`; không import repository của feature khác.
3. Khi thêm route, ghi rõ request/response, quyền truy cập và lỗi dự kiến trong
   tài liệu API. Khi thêm biến môi trường, cập nhật `.env.example`.
4. Chạy `npm run test:feature -- <feature>`, `npm run check`, rồi `npm test`
   trước khi mở pull request. PowerShell có thể dùng `npm.cmd`.
5. Trong pull request, mô tả hành vi thay đổi, feature bị ảnh hưởng và kết quả
   kiểm tra. Nếu sửa `shared`, `infrastructure`, `config` hoặc contract dùng
   chung, báo cho người phụ trách các feature liên quan.

Giữ response qua `shared/utils/response.js`, lỗi nghiệp vụ qua `AppError`, truy
vấn có tham số trong repository. Không commit `.env`, khóa SSH hoặc file phiên
SQLite trong `.data/`. Các khung `students`, `users`, `admin` hiện chưa có API
nghiệp vụ; tránh mặc định hiểu rằng chúng đã có xác thực hoặc phân quyền.
