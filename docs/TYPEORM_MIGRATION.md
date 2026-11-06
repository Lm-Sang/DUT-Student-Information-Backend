# Chuyển lớp SQL Server sang TypeORM

Nhánh `feat/typeorm-migration`, ngày 03/11/2026. Sử dụng JavaScript ESM và `EntitySchema`, không bắt buộc chuyển TypeScript. TypeORM được khóa ở `1.1.2`, `mssql` ở `12.7.3`; yêu cầu Node.js từ `24.11.0`.

## Phạm vi hoàn thành

- Toàn bộ kết nối và truy vấn SQL Server của backend, CLI bảo trì và các script kiểm thử đi qua TypeORM DataSource/QueryRunner.
- 48 bảng và 2 view local được ánh xạ đầy đủ: schema `auth` (6), `svc_demo` (29 bảng và 2 view), `certification` (11), `academic_leave` (2).
- 23 bảng nguồn được ánh xạ theo metadata trong 5 DB trường. Các cột bị từ chối quyền đọc và các cột mật khẩu được đặt `select: false`; cột nguồn không cho insert/update.
- Entity nằm theo feature: `auth/entities`, `student-requests/entities`, `certifications/entities`, `academic-leave/entities`, `students/entities`, `announcements/entities`, `curriculum/entities`.
- Giữ nguyên tên schema/bảng/cột, khóa chính, kiểu dữ liệu, composite key và quan hệ khóa ngoại. Không đổi schema, không tạo bản sao bảng nghiệp vụ, không tự đồng bộ hoặc chạy migration khi khởi động.

Các module Course Registration/TKB gọi HTTP bên ngoài tiếp tục là HTTP adapter. Kho state/handoff/refresh SSO bằng SQLite tiếp tục dùng các thao tác nguyên tử của `node:sqlite`; đây là kho phiên, không phải lớp SQL Server nghiệp vụ.

## Cấu trúc và cách truy vấn

`src/database.js` là composition root: đăng ký EntitySchema do các feature sở hữu. Metadata local được biên dịch trước để tạo QueryBuilder mà không cần kết nối DB khi import. Kết nối SQL mở lười, dùng chung lần khởi tạo, thử lại được sau lỗi và đóng pool khi server tắt.

`src/infrastructure/database/typeorm-repository.js` tạo QueryBuilder từ TypeORM Repository. Auth, danh mục, tài khoản/quyền, hồ sơ sinh viên, học kỳ/chương trình và danh sách/chi tiết đơn dùng các entity đã đăng ký. DTO/API giữ tên field và hành vi hiện có.

```js
import {selectEntity, selectRows} from '../../../infrastructure/database/typeorm-repository.js';

const builder = selectEntity('svc_demo.LoaiDon', 'ld')
  .select(['ld.MaLoaiDon AS code', 'ld.TenLoaiDon AS name'])
  .where('ld.HieuLuc = :active', {active: true})
  .orderBy('ld.ThuTu');
const rows = await selectRows(builder);
```

SQL có tham số vẫn được giữ cho các trường hợp cần `UPDLOCK/HOLDLOCK`, chống gửi trùng, so sánh phiên bản, kiểm tra quyền trong lúc ghi, `sp_getapplock`, JSON projection của chứng chỉ/ngừng học và truy vấn nguồn liên DB. Các đoạn này cũng chạy bằng TypeORM; không còn mở connection/pool native trong repository. Không thay kiểm tra quyền bằng role từ client và không dùng `save()` để bỏ qua các điều kiện cập nhật nguyên tử.

Các repository ghi dùng `transactionLocalDatabase`: QueryRunner bắt đầu transaction `READ COMMITTED`, commit khi thành công, rollback khi lỗi và luôn release. Thời gian, audit và dữ liệu đơn cập nhật cùng transaction. `queryLocalDatabase` giữ giao diện `.first` cho CLI/test hiện có; các recordset được thu thập bằng subscriber TypeORM với AsyncLocalStorage để không trộn kết quả giữa các request.

## Hai kết nối chạy song song

- **Local:** TypeORM MSSQL dùng driver Windows Authentication của `msnodesqlv8`; vẫn `Trusted_Connection=Yes`, không thêm username/password SQL. Driver native chỉ tải khi mở local SQL.
- **Trường:** TypeORM MSSQL dùng Tedious qua SSH/direct tùy cấu hình. Pool riêng theo account/database. Guard chặn câu lệnh ghi kể cả khi gọi trực tiếp DataSource/QueryRunner; chỉ SELECT được phép.
- Bridge native không import entry point làm thay đổi driver toàn cục của `node-mssql`. Factory request/transaction của từng pool được giữ riêng. Có kiểm thử chạy local và cả 23 mapping nguồn cùng lúc.
- `synchronize`, `migrationsRun`, `dropSchema` luôn false trên mọi DataSource. Các script schema/migration SQL hiện có vẫn chạy tường minh trên local. CLI restore chỉ có đích local cố định, không dùng REPLACE; không chạy restore/copy khi refactor.

Không đổi `.env` hoặc secret hiện có. Giới hạn DB ghi loopback và guard trong các transaction được giữ nguyên. Chỉ metadata được commit, không commit dữ liệu hồ sơ, hash/mật khẩu thực, backup hoặc file `.data`.

## Làm việc theo feature

1. Thêm/chỉnh bảng bằng script migration SQL local có kiểm soát.
2. Cập nhật EntitySchema của feature; giữ tên cột theo DB. Quan hệ khóa ngoại được khai báo tường minh, không tự tạo constraint.
3. Đăng ký entity mới trong `entities/index.js` và `src/database.js` nếu là feature mới.
4. Viết Repository/QueryBuilder, Service, DTO/Mapper và Controller của feature; quyền và chuyển trạng thái vẫn nằm trong nghiệp vụ/transaction.
5. Chạy kiểm thử feature, kiểm thử toàn bộ và SQL smoke phù hợp trước khi merge.

Sinh lại mapping từ metadata, không ghi DB:

```powershell
npm.cmd run orm:entities:local
npm.cmd run orm:entities:school  # SELECT metadata qua kết nối trường
```

Review diff trước khi commit. Generator trường ghi lại quyền đọc cột của tài khoản dùng lúc sinh metadata; các quyền thật của SQL Server vẫn có hiệu lực ở runtime. Không tự xin thêm quyền hoặc thay đổi quyền DB nguồn.

## Bằng chứng kiểm thử

- `npm.cmd test`: 146 kiểm thử, 144 đạt, 2 SQL opt-in bỏ qua.
- `npm.cmd run check`: cú pháp 307 file JavaScript đạt; các CLI `.mjs` mới đã được chạy/kiểm tra riêng.
- `$env:AUTH_DB_TEST='1'; node --test src/modules/auth/__tests__/auth-sql.test.js src/modules/auth/__tests__/password-management-sql.test.js`: cả 2 đạt với tài khoản/role tạm được tự xóa.
- `npm.cmd run test:orm:local`: Entity CRUD thực, 6 PDF đề nghị, 11 loại xác nhận, 20 đơn, tiếp nhận/xử lý/hủy, LMS, RBAC và lịch sử role, đọc catalog chứng chỉ, tạo/hủy đơn ngừng học. Chỉ dùng dữ liệu tạm local và xóa theo ID sau chạy.
- `npm.cmd run test:auth:requests`: HTTP JWT thật, phân biệt channel, danh mục DB, chặn quyền thiếu và thu hồi quyền tức thì; khóa test chỉ tồn tại trong process, kho phiên in-memory.
- Đã kiểm tra SELECT không lấy dữ liệu trên 23 Entity nguồn và xác nhận driver local/SSH không lẫn nhau. Không có câu lệnh ghi nguồn nào được chạy.
- FE ngoài repo: 31 kiểm thử đạt và cú pháp đạt; API giữ tương thích. FE vẫn ở project cùng cấp, không nằm trong nhánh backend.

## Giới hạn thực tế

Chuyển ORM không tự giảm độ trễ đường truyền SSH. Việc gộp liên kết hồ sơ và cache ngắn theo phiên SSO được giữ nguyên. Các SQL transaction đặc thù và tên field JSON của các feature khác được bảo toàn để tránh đổi hợp đồng API hoặc dữ liệu ngoài phạm vi refactor.
