# Tích hợp giao diện và feat/rbac

## Phạm vi

Nhánh tích hợp `feat/rbac-ui-integration` bắt đầu từ `origin/feat/rbac` tại `70d1013`.
Nhánh này đã chứa TypeORM; giữ nguyên các nhánh nguồn. FE nằm cạnh backend tại
`../DUT-Student-Information-Frontend`, sử dụng màn hình từ zip người dùng cung cấp.
File môi trường được dùng ở backend local; không đưa khóa, mật khẩu hoặc DB vào FE/Git.

## Kế hoạch và tiêu chí nghiệm thu

1. Fetch, đối chiếu source, đọc hợp đồng API và bộ SQL `Database_newversion`.
2. Sao lưu DB local trước khi nâng cấp; đối chiếu 54 bảng, chạy migration auth và
   workflow có transaction. DB trường qua SSH chỉ đọc và không chạy migration/test ghi.
3. Giữ ba tab đơn đề nghị, đơn xác nhận và LMS; thêm ngoại ngữ, tin học, ngừng học /
   gia hạn / trở lại học, danh mục chứng chỉ và quản trị tổ chức vào một cổng FE.
4. Đăng nhập local một lần bằng cùng tài khoản; FE xin riêng JWT `admin` và `staff`
   khi cần task 4, giữ audience/cookie và kiểm tra quyền backend. Sinh viên giữ SSO gốc.
5. Menu lấy tác vụ từ auth, không từ role demo. Admin tổng quản lý admin phòng;
   admin DT quản lý chuyên viên/tác vụ và theo dõi tiến độ; chuyên viên DT xử lý
   các tác vụ được giao. Không tạo chuyên viên CTSV.
6. Kiểm thử: API không token/sai nhóm/thiếu tác vụ, CRUD tổ chức và thu hồi phiên,
   danh mục, upload/hoàn tất/bổ sung/xét duyệt/xem minh chứng, SLA, nháp/xác nhận/
   PDF/tiếp nhận giấy/duyệt/từ chối/hủy, và hồi quy sáu loại đơn/11 xác nhận/LMS.
7. Kiểm tra trình duyệt và báo cáo riêng kết quả offline, SQL thật, R2 thật,
   SSO thật; không dùng kết quả mô phỏng để khẳng định hệ thống ngoài hoạt động.

## Database local

DB đang dùng `Studentpage_Integration_20261103`; giữ dữ liệu và các credential cũ.
Backup trước nâng cấp nằm tại `.data/rbac-integration/before-rbac-20261106.bak`.
Không nạp đè toàn bộ `02-catalogs.sql` vào DB đã có dữ liệu; file đó dành cho DB rỗng.
Áp dụng `auth:organization:init` và `db:review-workflow:upgrade` để đạt schema mới.
Migration bổ sung hỗ trợ StageV3 cũ, đổi verified/failed học vụ sang approved/rejected,
lưu lịch sử và điều chỉnh hạn giấy 2 → 3 ngày mà không sửa thời điểm tiếp nhận.

`node scripts/database/training-request-scopes.mjs` cấu hình danh mục local để DT
phụ trách mọi loại đơn/văn bản/LMS đang có, cấp các work scope từ DB cho task 4.
Không đổi lịch sử đơn đã lập hoặc danh mục trên DB trường. Chạy trước khi đăng nhập
vì cập nhật revision sẽ thu hồi phiên cũ. Những hồ sơ lịch sử CTSV giữ đơn vị gốc.

## Giao diện

Các màn hình nghiệp vụ được giữ thành module tại `public/modules/hoc-vu` trong FE,
hiển thị bên trong khung điều hướng chung. Phiên thuộc cổng chính; module gọi qua
bridge cùng origin, không nhận token qua URL/storage. Auth adapter chuyển sang
API `/api/student/...` hoặc `/api/admin/...`; proxy giữ Bearer, Origin, If-Match,
cookie và stream SSE. Ảnh upload đi thẳng R2 không gửi JWT backend.

Form danh mục có ngôn ngữ, loại chứng chỉ/trường kết quả, quy định theo khóa và
cơ sở cấp. Menu admin DT có tạo/sửa/khóa/reset chuyên viên, giao task và tiến độ;
chuyên viên không thấy chức năng quản trị. Các màn hình nhận allowedActions,
rowVersion, eligibility và deadlineStatus từ backend, không tự cấp quyền tại FE.

## Kết quả kiểm tra

Ngày kiểm tra: **06/11/2026**, Node 24, SQL Server local 2019.

| Kiểm tra | Kết quả |
| --- | --- |
| Backend, bật AUTH_DB_TEST, AUTH_ORGANIZATION_DB_TEST và RBAC_WORKFLOW_DB_TEST | 204/204 đạt, 0 bỏ qua |
| Frontend | 40/40 đạt |
| API qua proxy localhost | 48 kiểm tra đạt; có task isolation, audience, admin chỉ đọc, root không xử lý |
| Hồi quy TypeORM/đơn cũ | 56 mapping local, 23 mapping trường, 6 PDF, 11 xác nhận, 20 hồ sơ fixture |
| Cú pháp BE/FE | Đạt |
| SQL sau test | 54 bảng, không còn fixture chứng chỉ/học vụ; không có CHECK/FK bị tắt/chưa tin cậy |
| Trình duyệt | Đã đăng nhập specialist và admin DT, mở các module, danh mục, phân công tác vụ và theo dõi tiến độ; khôi phục phiên qua F5 |

Test SQL mới dùng repository thật, kiểm tra cả bốn danh mục (tạo/sửa và stale
version), hai loại chứng chỉ, bổ sung, nhiều ảnh tin học, nhận/xác minh/từ chối,
quyền sở hữu; học vụ có lưu/sửa/hủy nháp, xác nhận, yêu cầu bổ sung, nhận giấy,
duyệt/từ chối, gia hạn, trở lại học, lịch sử và PDF thực. Storage trong test là
Map trong bộ nhớ; bộ kiểm tra ảnh vẫn dùng sharp thật. Không kết nối cloud.

**Chưa xác minh:** SSO thực với tài khoản sinh viên và upload/xem ảnh R2 qua trình
duyệt. Bộ xét duyệt tự động từ chối lượt chạy test có khả năng ghi R2 do chưa có
cho phép cụ thể đối với đích cloud. Đã tách test local khỏi cloud và chuẩn bị
`scripts/smoke-r2-storage.mjs --allow-cloud-fixture`: sau khi được phép, test chỉ
tải một PNG tổng hợp vào key UUID `integration-tests/rbac/...`, kiểm tra CORS,
PUT/HEAD/GET và xóa đúng object đó; không sử dụng ảnh/hồ sơ cá nhân.

Đây là kiểm thử các module có API trong nhánh bạn gửi. Ảnh danh mục 20 đầu việc
Phòng Đào tạo là tài liệu tham khảo; các việc chưa có API như hoãn thi/thi bổ sung
không được trình bày là đã triển khai. Tác vụ 4 hiện có 18 work scope lấy từ DB:
6 đơn đề nghị, 11 loại xác nhận và LMS, đều giao cho chuyên viên DT trong môi trường này.

Tài khoản kiểm thử local: `quantri.rbac.test`, `admin.dt.test`,
`chuyenvien.dt.test` (1,2,3,4), `chuyenvien.chungchi.test` (1,2),
`chuyenvien.hocvu.test` (3), `chuyenvien.don.test` (4). Credential ngẫu nhiên
chỉ có trong `.data/rbac-integration/test-accounts.private.json`, bị Git bỏ qua.
Không tạo chuyên viên SV/CTSV. Các credential cũ và hồ sơ gốc không bị xóa.

Để chạy lại SQL workflow ở PowerShell:

```powershell
$env:RBAC_WORKFLOW_DB_TEST='1'
node --test tests/integration/rbac-workflow-local.test.js
```

FE vẫn ở project cùng cấp, không phải repo Git riêng. Gói bàn giao source FE tại
`D:/PBL6_DUT/integration-delivery/DUT-Student-Information-Frontend-rbac-20261106.zip`;
không chứa env, credential, backup DB, log hoặc node_modules. Source FE được đóng
gói cùng cấu hình chạy proxy và test; backend có thể dùng nhánh tích hợp này.
