# FE test chứng chỉ: sinh viên và chuyên viên

Cập nhật 02/11/2026: cả ngoại ngữ và tin học hiển thị họ tên, MSSV, lớp, CCCD
tự lấy từ SSO/profile và DB trường. Chuyên viên thấy đủ bốn trường ở danh sách
và chi tiết. Ngoại ngữ bắt buộc chọn cơ sở cấp theo loại chứng chỉ. Xem
[hợp đồng API, migration và nguồn danh mục](../docs/CERTIFICATION_STUDENT_INFORMATION.md).

Chạy tại thư mục gốc backend, không cần cài thêm thư viện:

```powershell
npm.cmd start
```

Mở terminal thứ hai:

```powershell
npm.cmd run certifications:fe
```

Mở **http://localhost:5173**, đăng nhập DUT SSO, chọn chứng chỉ, nhập kết quả,
chọn một file JPG/JPEG/PNG và bấm **Nộp hồ sơ**. Nếu auth-web-test đang chiếm 5173, dừng FE đó trước.
Mở **http://localhost:5174** cho chuyên viên. Một lệnh mở cả hai FE. Nếu FE test
cũ đang chạy, dừng và chạy lại lệnh để nạp phần server mới.
Ngừng học / gia hạn: **http://localhost:5173/academic-leave.html** cho sinh viên,
**http://localhost:5174/academic-leave.html** cho chuyên viên; có liên kết ở thanh module.
Trang ngừng học hiện khung trước, tải form và danh sách song song. Mở trang và
lưu nháp không lấy thống kê học tập; bấm **Xác nhận lập đơn và in** mới lấy điểm
để lưu cùng đơn. In lại dùng dữ liệu đã lưu. Xem
[luồng API và số đo local](../docs/ACADEMIC_LEAVE_PERFORMANCE.md).
Server dùng STUDENT_FRONTEND_URL/ADMIN_FRONTEND_URL và kiểm tra CORS;
không tự chuyển sang một cổng khác. Backend cần khởi động lại sau khi cập nhật code.

Cả hai trang có hai mục **Ngoại ngữ / Tin học**:

- Nộp tin học: **http://localhost:5173/?kind=it**.
- Xét duyệt tin học: **http://localhost:5174/?kind=it**.
- Ngoại ngữ: dùng `?kind=language` hoặc trang mặc định.

Tin học lấy danh mục và đúng năm trường từ `/api/it-certifications/form`: số hiệu,
cơ sở cấp, số vào sổ, tên chứng chỉ và ngày cấp. Chọn một file JPG/JPEG/PNG rồi nộp;
helper kiểm tra ảnh, xin URL, PUT R2 và complete giống ngoại ngữ. SSO quay lại
đúng mục đã chọn; hồ sơ upload dở được lưu riêng cho từng nhóm. Khi được yêu cầu
bổ sung, mở hồ sơ, chọn Bổ sung hồ sơ rồi sửa thông tin và nộp file mới.
Trang chuyên viên hiển thị tên chứng chỉ, năm trường tin học và ảnh để đối chiếu.

Hai trang tự cập nhật bằng SSE khi hồ sơ được nộp hoặc chuyên viên lưu kết quả.
Không cần bấm Tải lại: sinh viên nhận đúng hồ sơ của mình, chuyên viên nhận hàng
chờ của hai nhóm. Một trang mở một kênh; ẩn tab sẽ đóng kênh, quay lại tự kết nối
và tải trạng thái từ DB. Đổi token/đăng xuất sẽ hủy kết nối cũ; token chỉ ở header.
Sau khi cập nhật mã nguồn, tải lại FE để nạp realtime.js mới.

BE mặc định kiểm tra tối đa 2 ảnh cùng lúc, 150 lượt chờ chung cho hai nhóm, tối đa
20 giây chờ. Mức chờ này phục vụ đợt nộp dồn 100–150 người; thời gian xử lý hết
đợt vẫn cần đo bằng ảnh thực tế. Quá tải
trả thông báo thử lại trên cùng hồ sơ, giữ ảnh hợp lệ; cấu hình qua
CERTIFICATIONS_IMAGE_CONCURRENCY, CERTIFICATIONS_IMAGE_MAX_QUEUED và
CERTIFICATIONS_IMAGE_QUEUE_TIMEOUT_MS. SSE/queue hiện dùng trong một tiến trình BE.

## Chuyên viên xét duyệt

Tài khoản test local mặc định theo yêu cầu: **admin / 123**. Chạy
`node scripts/seed-test-admin.mjs` từ thư mục gốc để tạo/reset tài khoản trong DB
local, rồi đăng nhập ở `http://localhost:5174/academic-leave.html` hoặc trang
chuyên viên chứng chỉ. Script chỉ chạy ở development/test với DB trên localhost,
dùng mật khẩu băm và cấp quyền xét duyệt cho cả chứng chỉ lẫn academic leave.
Script và tài khoản mẫu phục vụ local, không nằm trong commit feature.

Chuyên viên đăng nhập tài khoản/mật khẩu đã được cấp trong `auth.LocalAccounts`.
Backend phát JWT ứng dụng qua `/api/admin/auth/login`; cần bật `ENABLE_ADMIN_AUTH`
và tài khoản có các quyền xét duyệt tương ứng. FE dùng Bearer JWT trong bộ nhớ,
cookie HttpOnly để khôi phục phiên khi tải lại trang. Không có mật khẩu mặc định
trong FE và không dùng phiên reviewer tạm thời cho luồng đăng nhập hiện tại.

Đăng nhập, chọn hồ sơ ở hàng chờ, đối chiếu thông tin/điểm và xem ảnh trực tiếp.
Có nút mở ảnh lớn, tải lại URL ảnh và xem ngày cập nhật gần nhất. Chọn Xác nhận,
Yêu cầu bổ sung hoặc Từ chối rồi lưu. Hai lựa chọn sau bắt buộc lý do. Chỉ hồ
sơ submitted được xét duyệt, dữ liệu sinh viên không có ô sửa. Chỉ needs_changes
mở quyền bổ sung ở FE sinh viên; verified/rejected khóa hồ sơ. Phiên chuyên viên
không dùng token SSO của sinh viên. Đăng xuất thu hồi phiên ngay tại backend.
Phiên chuyên viên dùng chung cho cả hai loại chứng chỉ và academic leave;
đăng xuất qua `/api/admin/auth/logout`.

Mặc định danh sách chỉ hiện hồ sơ đã nộp. Nếu chưa có, sinh viên cần nộp hoàn
tất trước; có thể lọc Chưa nộp để kiểm tra, nhưng không xét duyệt trạng thái đó.
Tên chứng chỉ trong danh sách lấy từ bản chụp của hồ sơ. Khi lưu, FE gửi If-Match
của hồ sơ vừa đọc; nếu chuyên viên khác đã xử lý, tải lại thay vì ghi đè.

Kiểm thử tự động bao gồm đăng nhập sai/hết phiên/đăng xuất, chặn token sinh
viên ở route xét duyệt, xem minh chứng, yêu cầu bổ sung/nộp lại, xác nhận, từ
chối và cập nhật cùng một hồ sơ khi bổ sung. Không hiển thị lịch sử phiên bản.
Các test HTTP dùng dữ liệu mô phỏng; không tự duyệt hồ sơ thật trong kiểm thử.

Sinh viên bắt đầu tại `/api/student/auth/microsoft/login`. Backend xác minh state
và token SSO, chuyển code một lần về `/auth-callback.html#code=...`. FE xóa fragment
rồi đổi code qua `/api/student/auth/session`; `data.accessToken` là **nguyên token
SSO**, không tạo JWT sinh viên khác. Token ở bộ nhớ, không lưu sessionStorage,
localStorage hoặc URL. Cookie HttpOnly ngẫu nhiên khôi phục chính token đó khi
tải lại trang; thời hạn không vượt quá thời hạn token SSO. Token hết hạn phải
đăng nhập DUT SSO lại. Đăng nhập/mở module nào sẽ quay lại đúng module đó.

FE gửi nguyên SSO Bearer token tới API sinh viên: ngoại ngữ, tin học, ngừng học
và các nguồn dữ liệu DUT. Backend xác minh chữ ký/issuer/audience/thời hạn và gọi
`https://profile.dut.udn.vn/api/profile` để DUT kiểm tra token và lấy MSSV/tên/lớp
thật; không dùng dữ liệu JWT do trình duyệt tự giải mã. Khóa được suy từ vị trí
năm tuyển sinh trong MSSV 9 chữ số theo quy ước đang dùng của module. Token sinh
viên không cấp quyền quản trị/xét duyệt. Đăng xuất thu hồi token tại ứng dụng này
và xóa cookie; không chấm dứt phiên ở các ứng dụng DUT khác.

Form điểm dựng từ catalog thật, không cố định IELTS/TOEIC. Danh mục phải có quy
định tiếp nhận cho khóa của tài khoản. FE hiển thị lý do từ backend, không tự
tạo quy định hoặc bỏ qua kiểm tra. Hồ sơ dev cũ thuộc tài khoản giả lập nên
không xuất hiện trong danh sách của tài khoản DUT thật.

Quy định thật đã cấu hình trong DB: K23 trở về trước được nộp các loại đang mở;
K24 trở đi chỉ chặn TOEIC 2 kỹ năng, vẫn nhận TOEIC 4 kỹ năng và loại khác.
FE chỉ hiển thị eligibility từ backend, không cố định các mốc khóa trong JS.

Chọn ảnh một lần: FE kiểm tra toàn bộ ảnh trên thiết bị trước khi POST xin URL:
định dạng thực PNG/JPEG, dung lượng, giải mã, kích thước, độ tương phản và độ mờ
theo cấu hình catalog. Mặc định blurThreshold=0 chưa chặn độ mờ khi chưa hiệu chỉnh ngưỡng.
Ảnh lỗi được báo ngay, chưa xin URL và chưa upload ảnh nào. FE lấy tên/dung lượng từ File,
nhận diện MIME thực tế theo byte PNG/JPEG trước khi xin URL. Ảnh PNG mang đuôi `.jpg`
(hoặc ngược lại) vẫn nộp được với MIME đúng; giữ nguyên tên và byte ảnh.
POST xin URL, PUT binary thẳng vào `certifications/evidence/` trên R2 rồi POST complete.
Backend vẫn xác minh lại khi complete; không còn upload temporary hay bước copy.
Không gửi token DUT đến R2, không gửi file qua
backend. Hiển thị tiến độ và lỗi, giữ mã hồ sơ để thử lại cùng hồ sơ. Chỉ mở bổ
sung khi needs_changes; bản đã nộp chỉ được xem. FE test ghi dữ liệu thật vào
Studentpage và R2 khi bấm Nộp, không tự rollback.

Tên thao tác theo trạng thái: uploading hiện **Chưa nộp / Tiếp tục nộp hồ sơ**;
needs_changes hiện **Cần bổ sung / Nộp bổ sung**. Có mã hồ sơ để upload ảnh chưa
có nghĩa là đã nộp cho chuyên viên. Sau khi tải lại trang, FE đọc trạng thái và
thông tin hồ sơ từ backend trước khi tiếp tục, không đặt mã hồ sơ cũ lên form mới.

Backend dùng cấu trúc gọn: StudentCertificates lưu thông tin/trạng thái/đánh giá,
EvidenceFiles lưu ảnh. Sao lưu dữ liệu rồi chạy
[migration cấu trúc gọn](../docs/sql/certifications-compact.sql) trước khi khởi động bản mới.
Bổ sung cập nhật chính hồ sơ đó, thay file và đánh giá cũ, giữ ID và ngày tạo.
Mỗi hồ sơ ngoại ngữ chỉ có một file; chạy thêm
[migration giới hạn một file](../docs/sql/certifications-single-evidence.sql) cho DB đã chuyển cấu trúc gọn.
Hồ sơ upload dở từ
luồng cũ cần bấm nộp để xin URL mới.
Bucket cần private và có CORS cho http://localhost:5173 (PUT, Content-Type, If-None-Match).
URL ký kèm If-None-Match: * để chặn ghi đè ảnh, R2 trả 412 nếu key đã tồn tại.
Không có R2 key hoặc SSO signing secret trong mã FE. Không sửa `.env` của dự án
tham khảo và không sao chép secret từ dự án đó.
