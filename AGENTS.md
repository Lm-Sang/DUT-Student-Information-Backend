# Quy tắc làm việc và tổ chức backend

## Phạm vi và cấu trúc

- Backend phục vụ hai frontend độc lập: `src/student/modules/` cho sinh viên và `src/admin/modules/` cho chuyên viên/quản trị viên. API công khai ở `src/public/modules/`.
- Prefix các nhóm API của mỗi phía được đăng ký tại `src/student/student.routes.js` và `src/admin/admin.routes.js`. Factory bootstrap trả về `studentRouter`/`adminRouter`; không lặp lại prefix mới trong factory. README của từng phía hướng dẫn vị trí code; không thêm folder rỗng để trang trí cấu trúc.
- Chia theo khu vực người dùng, sau đó theo module nghiệp vụ, rồi theo trách nhiệm: `routes`, `controllers`, `services`, `repositories`, `dto`, `mappers`, `middlewares`, `rules`, `entities`. Chỉ tạo thư mục thực sự có code; một module có thể có nhiều controller/service/repository theo công việc.
- `src/common/<module>/` sở hữu nghiệp vụ, dữ liệu, hợp đồng và cơ chế xác thực được nhiều khu vực sử dụng. Không sao chép repository, entity hoặc quy tắc chuyển trạng thái giữa student/admin. Không đưa code chỉ dành cho một phía vào common cho tiện.
- `src/shared/` chỉ chứa tiện ích kỹ thuật độc lập nghiệp vụ; `src/infrastructure/` sở hữu kết nối DB, HTTP client, storage, PDF/Word và xử lý ảnh.
- `src/bootstrap/` ghép dependency, module và URL tương thích. Module không import bootstrap, app hoặc server. Common không import student/admin/public. Student và admin không import lẫn nhau.
- Mã demo ở `src/development/`; production không mount demo. CLI và tác vụ DB ở `scripts/`; toàn bộ test ở `tests/`, không để `__tests__` hoặc `cli` trong module chạy ứng dụng.

## Trách nhiệm và phụ thuộc

- Route khai báo endpoint/middleware; controller đọc DTO, gọi service và trả HTTP. Không viết SQL hoặc workflow dài trong route/controller.
- Service điều phối nghiệp vụ; repository sở hữu query/transaction; rules là hàm quy tắc thuần. DTO/mapper không truy cập DB, network hoặc HTTP response.
- Middleware theo phạm vi: dùng chung trong common/shared, riêng khu vực hoặc module thì để tại khu vực/module đó. Kiểm tra quyền cấp hồ sơ vẫn phải được thực hiện trong nghiệp vụ/repository.
- Mapper response chỉ dùng một phía ở module phía đó. DTO/mapper dùng thực sự cho nhiều phía được giữ trong common; không tạo bản sao hoặc wrapper chỉ để đủ cây thư mục.
- Code module khác được truy cập qua `index.js` hoặc facade được ghi rõ. Composition root và registry entity được phép ghép các thành phần nội bộ để xây dependency.
- Giữ JavaScript ESM hiện tại. Không đổi framework, ORM, ngôn ngữ hoặc thêm abstraction không cần thiết trong refactor cấu trúc.

## An toàn khi refactor

- Đọc trạng thái Git trước khi sửa; giữ nguyên thay đổi người dùng đang có. Di chuyển nội dung trên đĩa, không khôi phục từ HEAD để ghi đè.
- Giữ method, response, cookie, JWT audience, phiên, quyền, điều kiện sở hữu hồ sơ và transaction hiện tại. Đường dẫn mới phải dùng cùng kiểm tra bảo mật; URL cũ được duy trì qua adapter tương thích khi cần.
- Không hợp nhất tài khoản/token admin và staff bằng cách nới kiểm tra audience. Việc đổi mô hình đăng nhập cần migration riêng và kiểm thử hành vi.
- DB trường chỉ đọc; DB local ghi theo guard hiện có. Không chạy migration, seed, smoke test live hoặc sinh entity từ DB thật chỉ để xác minh việc di chuyển file.
- Giữ tên bảng/cột và metadata entity; cập nhật generator khi đổi nơi lưu entity. Không chỉnh cấu trúc SQL trong đợt refactor này.
- Khi di chuyển file, cập nhật import, asset URL tương đối, đường dẫn CLI, generator, test runner và tài liệu có liên quan.

## Kiểm tra và tài liệu

- Test chia theo `tests/student`, `tests/admin`, `tests/common`, `tests/public`, `tests/integration`, `tests/infrastructure`, `tests/architecture` và `tests/support` khi cần.
- Chạy kiểm tra cú pháp và bộ test offline. Kiểm thử route phải kiểm tra cả thiếu token, sai nhóm người dùng, quyền và URL tương thích khi có thay đổi.
- Architecture test kiểm tra ranh giới giữa các khu vực và các tầng, import nội bộ tồn tại, không có test/CLI lẫn source nghiệp vụ.
- Ghi rõ kiểm tra nào đã chạy và giới hạn thực tế. Cập nhật README, tài liệu kiến trúc và hướng dẫn API theo cấu trúc cuối cùng.
