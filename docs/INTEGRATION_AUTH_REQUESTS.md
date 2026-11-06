# Kế hoạch và báo cáo tích hợp xác nhận văn bản với xác thực

> C?p nh?t auth: sinh vi?n d?ng nguy?n access token DUT SSO, x?c minh secret key/HS256/h?n d?ng, kh?ng c?n issuer/audience v? kh?ng c? JWT/refresh BE. Callback m?i r?ng bu?c state trong ???ng d?n; admin/staff d?ng JWT_SECRET ri?ng. Contract v? h??ng d?n FE hi?n h?nh: [AUTH_CHANNELS.md](AUTH_CHANNELS.md). C?c m? t? ??i sang app token ho?c d?ng chung kh?a ? d??i l? l?ch s? tr??c thay ??i n?y.


Ngày thực hiện: 03/11/2026.

## Nhánh và phạm vi

- Đã `git fetch --all --prune`: nhánh xác nhận gốc `feat/vb-xac-nhan` tại `cb2fe22`; auth mới nhất `origin/feat/auth` tại `387a542`.
- Nhánh tích hợp: `feat/vb-xac-nhan-auth-integration`. Không sửa, reset hoặc force-push hai nhánh gốc. Các sửa chữa của phần xác nhận được đưa trên nhánh tích hợp để giữ nguyên mốc nguồn.
- Merge cả lịch sử auth; giữ các feature chứng chỉ và nghỉ học có sẵn trong nhánh đó. Giải quyết xung đột config, package/lockfile, registry, auth, README và tests.
- Giữ lại scripts, tests và tài liệu của nhánh xác nhận bị xóa ở nhánh auth; bỏ quy tắc ignore toàn bộ ba thư mục này.
- Không push hoặc deploy.

## Kế hoạch và kết quả

1. **Khảo sát và bảo toàn:** fetch, kiểm tra working tree sạch, chốt hai commit nguồn; phục hồi backup vào DB local riêng. Đã xong.
2. **Sửa nhánh xác nhận:** đưa danh mục loại đơn về SQL; bỏ quyền chuyên viên mặc định; tách API thật khỏi chọn nhân vật demo. Đã xong trên nhánh mới.
3. **Tích hợp auth:** dùng callback/handoff, access/refresh token và session của nhánh auth; thêm channel chuyên viên; xác minh quyền hiện tại từ SQL. Đã xong.
4. **Hợp nhất DB:** giữ dữ liệu chứng chỉ/nghỉ học/tài khoản của backup, thêm dữ liệu đơn hiện tại và chuẩn hóa quyền. Đã xong trên DB riêng.
5. **Kiểm chứng:** test đơn vị, kiến trúc, HTTP JWT, SQL credentials/revocation, cú pháp. Đã thực hiện; chi tiết bên dưới.
6. **Trước vận hành:** quản trị cung cấp cấu hình SSO thật và mật khẩu tài khoản đầu tiên; FE chuyển sang API/JWT mới; chạy đăng nhập SSO qua trình duyệt. Chưa thực hiện với tài khoản thật.

## Thiết kế xác thực

Sinh viên đăng nhập DUT SSO theo luồng nhánh auth: login → callback có state → handoff đổi phiên → access JWT ứng dụng và refresh cookie HttpOnly. API không nhận MSSV để giả danh. Middleware đọc danh tính đã xác minh, đối chiếu duy nhất hồ sơ trường bằng SELECT rồi liên kết với tài khoản local. Không tạo thêm opaque session ở module đơn.

Chuyên viên dùng `POST /api/staff/auth/login` với `username/password`, kiểm tra hash scrypt trong `svc_demo.DangNhapChuyenVien` và trạng thái `TaiKhoan`. Mỗi lần xác minh access/refresh token đều đọc lại tài khoản, role và quyền hiệu lực. Đổi hash, khóa tài khoản hoặc sửa quyền làm phiên cũ không còn hợp lệ. Giữ tương thích hash cũ; tài khoản mới dùng scrypt có tham số/chi phí rõ ràng.

`JWT_SHARE_SSO_KEY=true` dùng cùng bytes khóa SSO sau khi giải mã theo `MICROSOFT_SSO_JWT_SECRET_ENCODING=utf8|base64`. Không copy khóa vào source. Token sinh viên/chuyên viên/admin có audience riêng; issuer ứng dụng khác issuer SSO, kiểm tra thuật toán HS256, `typ`, `tokenUse`, channel và session. Token SSO thô không được dùng làm JWT chuyên viên; refresh không được dùng làm access. Sinh viên không đăng nhập bằng mật khẩu local.

Role và quyền xử lý không lấy từ claim SSO hay body client. Chuyên viên cần cả quyền chức năng (`requests.receive`, `requests.print`...) và phạm vi `work:<loại đơn>` hoặc `work:CONFIRMATION:<mã văn bản>`, đồng thời đáp ứng người phụ trách/trạng thái. Không tự cấp quyền cho mọi STAFF. Role quản trị không tự vượt kiểm tra quyền SQL. Quyền `rbac.permissions.delegate` cho phép người quản trị cấp quyền ngoài tập quyền xử lý của chính họ; cần cấp rõ ràng, không dựa vào tên ADMIN.

## API

Tất cả API nghiệp vụ nhận `Authorization: Bearer <accessToken>`.

| API | Mục đích |
| --- | --- |
| `GET /api/student/auth/microsoft/login` | Bắt đầu DUT SSO |
| `GET /api/student/auth/microsoft/callback` | Callback phía API |
| `POST /api/student/auth/session` | Đổi handoff theo contract auth |
| `POST /api/staff/auth/login` | Chuyên viên đăng nhập DB |
| `GET /api/staff/auth/me` | Danh tính/quyền hiện tại |
| `POST /api/staff/auth/refresh` | Đổi refresh cookie, yêu cầu Origin đúng |
| `POST /api/staff/auth/logout` | Thu hồi phiên và xóa cookie |
| `GET /api/student-services/catalogs` | Danh mục sinh viên từ DB |
| `GET, POST /api/student-services/requests` | Danh sách của mình / lập đơn |
| `GET /api/student-services/requests/:id` | Chi tiết, lịch sử |
| `GET /api/student-services/requests/:id/file` | Tạo PDF khi tải, không lưu file cứng |
| `POST /api/student-services/requests/:id/actions` | Hủy đơn của mình, không cần lý do |
| `GET /api/staff/student-services/catalogs` | Danh mục cho chuyên viên |
| `GET /api/staff/student-services/requests` | Danh sách trong phạm vi được cấp |
| `POST /api/staff/student-services/requests/:id/actions` | Tiếp nhận, xử lý, hủy có lý do |
| `POST /api/staff/student-services/requests/:id/print` | In xác nhận theo quyền và workflow hiện tại |
| `GET /api/staff/student-services/admin/staff` | Quản trị nhân sự/role, cần quyền quản trị |
| `POST, PUT /api/staff/student-services/admin/roles[/:id]` | Tạo/sửa role có version |
| `POST /api/staff/student-services/admin/staff` | Tạo tài khoản chuyên viên và gán role |
| `PUT /api/staff/student-services/admin/staff/:id/roles` | Gán role, kiểm tra version/quyền cấp |

Module demo `/api/demo/student-requests` tắt mặc định. `ENABLE_DEMO_IMPERSONATION=false`: API nghiệp vụ thật không có chọn actor, `/actors` hay đăng nhập bằng `actorId`. Không dùng FE demo cũ để kết luận đã chạy luồng JWT mới.

## DB và danh mục

Backup `Studentpage.bak` là SQL Server 15, đã phục hồi bằng MOVE vào `Studentpage_Integration_20261103` trên `localhost:1433`; không dùng REPLACE. DB này giữ 1 tài khoản auth, các bảng `certification` và `academic_leave` của backup. Đã sao chép 27 bảng và 2 view của `svc_demo` từ `sv_dut`, kiểm tra số dòng từng bảng; giữ nguyên DB nguồn và file backup.

- Dữ liệu đơn dùng `DonDeNghi`, `His_InDon`, `DeNghiVanBan`, `DeNghiEmail` và lịch sử typed columns như nhánh xác nhận. Không ghi PDF/JSON vào bảng nghiệp vụ đơn.
- `LoaiDon` chứa mã, tên, nhóm, đơn vị, hiệu lực, thứ tự, mẫu dữ liệu và mẫu in. `TruongLoaiDon` chứa các field theo loại. Runtime đọc SQL; seed chỉ dùng khi khởi tạo, không ghi đè tên/hiệu lực đã sửa trong DB.
- `Sys_VanBan`, `Sys_Email`, kỳ và ngành giữ danh mục trong DB. Có thể thêm loại mới dựa trên profile/mẫu đã hỗ trợ mà không sửa danh sách loại trong code. Loại có cấu trúc hoặc mẫu in hoàn toàn mới vẫn cần bổ sung validator/renderer; DB không chạy mã hay đường dẫn tùy ý.
- Quyền đơn dùng các bảng role/quyền/quan hệ hiện có và view hiệu lực chỉ nối role đang hoạt động. Không giữ mật khẩu rõ.
- `auth.LocalAccounts` của nhánh auth giữ để phục vụ các feature khác; role/permission JSON đã chuyển sang `Roles`, `Permissions`, `AccountRoles`, `RolePermissions`, `AccountPermissions`. Tài khoản chuyên viên của module đơn dùng adapter vào hệ RBAC hiện có, không sao chép hash giữa hai hệ.
- Session auth tạm thời vẫn theo cơ chế SQLite của nhánh auth; không phải dữ liệu biểu mẫu hoặc danh mục. Khi triển khai nhiều máy cần dùng session store dùng chung phù hợp.
- Chỉ ghi DB local. Connector trường vẫn riêng và các adapter hồ sơ dùng SELECT.

## Cách chạy

`.env` local đã chuyển `LOCAL_DB_NAME=Studentpage_Integration_20261103`, dùng auth store riêng `.data/auth-integration.sqlite`, tắt demo và bật API thật. Cần cấu hình đúng issuer/audience/key do phía SSO cấp; không tự suy đoán audience hoặc bật chấp nhận thiếu audience khi chưa xác nhận.

```powershell
npm.cmd install --include=optional
node src/modules/auth/cli/auth-db.mjs init
node scripts/upgrade-request-catalog.js
npm.cmd run dev
```

Khởi tạo chuyên viên quản trị đầu tiên: đặt `DUT_STAFF_BOOTSTRAP_PASSWORD` trong môi trường tiến trình bằng cách nhập an toàn, không đưa mật khẩu vào lệnh hoặc Git; sau đó:

```powershell
node src/modules/auth/cli/staff-account.mjs --username operator --name "Quản trị phân quyền" --department 120 --env-password --bootstrap-admin
```

CLI không in mật khẩu. Người quản trị cấp role/phạm vi xử lý qua API. Không tạo tài khoản sản xuất với mật khẩu cố định. Tài khoản admin có sẵn trong backup được giữ, không tự đổi mật khẩu hay tự cấp quyền xử lý đơn.

## Kiểm chứng và giới hạn

- `npm.cmd test`: 125 qua, 0 lỗi; 1 test SQL opt-in được bỏ qua ở lệnh mặc định.
- `AUTH_DB_TEST=1 node --test src/modules/auth/__tests__/auth-sql.test.js`: SQL test qua; tài khoản/role thử được dọn đúng ID. Kiểm tra hash thật, JWT, thay đổi quyền/mật khẩu làm mất hiệu lực phiên.
- `node scripts/smoke-auth-requests-integration.mjs`: HTTP thật qua: đăng nhập DB, JWT, danh mục, sai channel, thiếu quyền quản trị và thu hồi quyền ngay lập tức. Khóa test chỉ trong tiến trình, không sửa khóa SSO local.
- Kiểm tra cú pháp 217 file JS qua (các script mới .mjs được kiểm tra riêng).
- Không kiểm chứng trình duyệt với tài khoản SSO thật; không gọi reset mật khẩu trường, không upload R2 hoặc xác nhận nghiệp vụ thật của chứng chỉ/nghỉ học.
- Không ép nâng dependency major trong lúc merge. `npm install` báo 6 cảnh báo dependency (3 moderate, 3 high); cần xử lý trong đợt dependency riêng trước triển khai.
- Công cụ restore/copy local trong scripts dành cho DB tích hợp riêng: copy backup vào `.data/Studentpage.bak` rồi chạy `restore-studentpage-local.mjs`, `copy-requests-to-integration.mjs`. Các lệnh có tên DB đích riêng để tránh ghi nhầm; không dùng với DB trường. Giữ `.data/` ngoài Git.

## Mốc hoàn tất

Merge commit `2b8001b` có hai parent `cb2fe22` và `387a542`; hai ref nguồn giữ nguyên.
Kiểm tra cấu hình cuối: local đã có khóa SSO nhưng **chưa có issuer/audience**;
`MICROSOFT_SSO_ALLOW_MISSING_AUDIENCE=false`. Do đó đăng nhập thật trả lỗi cấu hình
cho đến khi có thông số được phía SSO xác nhận. Không tự suy đoán hoặc giảm kiểm tra
để làm đăng nhập qua. Tài khoản chuyên viên đầu tiên cũng chưa được tạo với mật khẩu
vận hành; dùng CLI nêu trên sau khi người quản trị cung cấp mật khẩu.

## Giao diện kiểm thử JWT

FE sibling `D:/PBL6_DUT/DUT-Student-Information-Frontend` đã được đổi khỏi opaque
session demo: đăng nhập SSO/chuyên viên, refresh cookie HttpOnly, đăng xuất, xem
quyền hiện tại, danh mục DB và role không có quyền mặc định. Mở localhost:5173;
`STAFF_FRONTEND_URL=http://localhost:5173` cho phép dùng cùng FE khi test.
Proxy giữ Origin và các Set-Cookie, không rewrite Origin để vượt kiểm tra.
Readiness endpoint `/api/staff/auth/configuration` chỉ bật ngoài production,
trả boolean và tên cấu hình thiếu, không trả khóa/tài khoản. 27 test FE qua;
125 test backend qua lại. Đã kiểm tra hai tab đăng nhập trên trình duyệt.
Đăng nhập thực tế vẫn cần issuer/audience SSO và tài khoản chuyên viên do quản
trị đặt mật khẩu. Hướng dẫn tại README của FE; không có mật khẩu mặc định.

## Cập nhật theo mô tả auth flow của người dùng

Đã đọc `mo-ta-auth-flow (1).docx`: login tới `/microsoft/login` với callbackUrl và
response_mode=query; callback nhận accessToken; logout tới `/microsoft/logout`.
Theo yêu cầu mới, không bắt buộc cấu hình và không kiểm tra issuer/audience của
**token SSO nguồn**. Tiếp tục kiểm tra chữ ký HS256 bằng khóa đã cấu hình, hạn token,
định danh sinh viên và cookie/handoff chống nhầm phiên. JWT ứng dụng vẫn có channel,
issuer/audience nội bộ do ứng dụng tự đặt để tách sinh viên/chuyên viên, không cần
người dùng cung cấp thêm issuer/audience SSO. Không đổi hoặc công khai khóa SSO.
Sinh viên logout sẽ được trả URL đăng xuất SSO; chuyên viên logout chỉ thu hồi phiên local.

Đã tạo tài khoản `chuyenvien.test` trong DB local tích hợp, role
`local-test-specialist`: 25 quyền gồm 18 phạm vi công việc từ danh mục DB và 7 quyền
xem/nhận/in/xử lý/hủy/Excel, không quyền quản trị tài khoản/role. Mật khẩu được sinh
ngẫu nhiên, chỉ lưu hash; không ghi mật khẩu vào source/tài liệu. Script tạo thử
`scripts/create-staff-test.mjs` không đổi mật khẩu nếu tài khoản đã tồn tại.

Kiểm chứng sau cập nhật: 126 test backend qua, 1 SQL opt-in bỏ qua; 27 test FE qua.
Tài khoản test đăng nhập qua FE proxy 200, đọc /me/catalogs/requests 200, API quản
trị role 403, logout 200; SSO login trả redirect302 tới sso.dut.udn.vn. Chưa hoàn tất
đăng nhập SSO bằng tài khoản sinh viên thật; lần thử tương tác trình duyệt không
kết nối được nên phần xác nhận mới dựa trên HTTP thực tế và test tự động.
# Tối ưu tải trang sau SSO (2026-11-03)

FE mở trang bằng 4 API song song (`me`, `catalogs`, `requests`, `profile`). Trước đây mỗi API đều đọc hồ sơ trường và đồng bộ DB local; `profile` đọc lại thêm một lần, tổng cộng 5 lượt đọc hồ sơ. Đo SELECT trực tiếp trong phiên kiểm tra: mở kết nối mới khoảng 3.909 ms, tái sử dụng kết nối khoảng 693 ms. Đây là thời gian một lượt đọc hồ sơ, không phải thời gian toàn bộ đăng nhập SSO.

Các API cùng phiên SSO hiện dùng chung một lần liên kết hồ sơ đang chạy. Liên kết session/identity → actor được giữ tối đa 5 phút trong bộ nhớ, giới hạn 1.000 mục; phiên hoặc danh tính khác không dùng chung liên kết, lỗi không được cache. Mỗi API vẫn xác minh JWT, phiên, tài khoản SQL hiện hành và quyền. Middleware kiểm tra lại nguồn SSO và MSSV trên tài khoản local.

API xem hồ sơ có thể dùng dữ liệu vừa đồng bộ trong vòng 30 giây, với điều kiện mã hồ sơ trường và MSSV vẫn khớp. Tạo đơn và tải/xuất PDF vẫn buộc làm mới hồ sơ. Như vậy lần mở trang bình thường chỉ đọc hồ sơ trường một lượt. FE đổi mã SSO ngay khi quay về, không chờ API kiểm tra cấu hình chuyên viên; giao diện hiển thị riêng bước xác thực phiên và tải hồ sơ.

Kiểm thử backend: 133 đạt, 1 kiểm thử SQL tùy chọn bỏ qua. FE: 27 đạt, kiểm tra cú pháp đạt. Sáu kiểm thử mới bao phủ gộp truy vấn đồng thời, thu hồi phiên/tài khoản, cách ly danh tính, hết hạn và thử lại, làm mới PDF và giới hạn bộ nhớ. Chưa đo toàn bộ luồng đăng nhập tương tác trên hệ thống SSO của trường; độ trễ ở hệ thống SSO bên ngoài là bước riêng.
