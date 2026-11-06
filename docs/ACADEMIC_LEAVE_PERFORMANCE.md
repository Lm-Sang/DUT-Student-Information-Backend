# Tải form ngừng học và gia hạn

Cập nhật 02/11/2026.

## Luồng mở trang

FE hiện khung lập đơn ngay sau khi khôi phục phiên và tải `/form`, `/applications`
song song. Danh sách có thể hiển thị ngay cả khi nguồn thông tin cá nhân còn chậm.
Các trường nhập được khóa cho tới khi danh mục học kỳ/lý do sẵn sàng.

Backend xác minh token SSO ở mọi request, rồi lấy MSSV từ:

1. Claim MSSV rõ ràng đã xác minh (`studentCardNumber`, `studentCode`, ...).
2. `unique_name`/UPN dạng chín chữ số và domain nằm trong
   `MICROSOFT_SSO_STUDENT_EMAIL_DOMAINS` (mặc định `sv1.dut.udn.vn`).
3. Profile DUT nếu token không có một trong các định dạng trên. Fallback này
   được gộp request đồng thời và cache tối đa 60 giây, không vượt hạn SSO; mỗi
   request vẫn kiểm tra token và thu hồi. Cache giới hạn 1.000 entry theo HTTP
   implementation, dùng hash token làm khóa và chỉ giữ các trường hồ sơ cần thiết.

UPN lấy từ token đã xác minh, không từ request body/query. Domain khác không
được suy MSSV chỉ dựa vào phần trước dấu `@`. Claim MSSV và UPN sinh viên mâu
thuẫn bị từ chối. Thông tin cá nhân có trong token được ưu tiên; thiếu thì đọc
`DATA_SV1.dbo.NhanThan` bằng `@studentCode char(9)` trong một truy vấn `TOP(2)`:
họ tên, lớp, CCCD, điện thoại và ngày/tháng/năm sinh. Ghép và kiểm tra ngày sinh
ở backend để tương thích SQL Server trường không hỗ trợ `TRY_CONVERT`.

## Dữ liệu từng thao tác

| Thao tác | Nguồn dữ liệu |
| --- | --- |
| `GET /api/academic-leave/form` | Thông tin cá nhân, học kỳ hiện tại, các đơn đủ điều kiện gia hạn. `prefill` chỉ có `student`, không có thống kê học tập. |
| `GET /api/academic-leave/applications` | Danh sách từ DB local; không gọi profile với token MSSV/UPN chuẩn và không lấy điểm. |
| Lưu/sửa/hủy nháp | Kiểm tra quyền và kỳ học; không lấy điểm. |
| Xác nhận lập đơn và in | Lấy thông tin cá nhân cần thiết và thống kê học tập DUT; kiểm tra đầy đủ rồi lưu snapshot trong transaction. |
| Xem/in lại đơn đã xác nhận | Dùng snapshot đã lưu; không gọi lại API thống kê. PDF vẫn được dựng ở BE. |

Học kỳ hiện tại dùng cache 60 giây cho form, gộp query đang chạy. Khi lưu hoặc
xác nhận, backend yêu cầu đọc mới cấu hình kỳ của trường để tránh nộp theo cache cũ.
Không gọi lại API danh sách giữa bước lưu nháp và xác nhận khi người dùng bấm in;
sau khi xác nhận, việc tải lại danh sách không chặn mở PDF.

## Kiểm tra

Đo bằng phiên SSO hiện có trên máy local, chỉ gọi GET; không tạo/xác nhận đơn:

| Request | Ba lần đo (ms) |
| --- | --- |
| `/form` | 1153, 164, 154 |
| `/applications` | 12, 3, 3 |

Cả ba response `/form` là 200, đủ các trường cá nhân bắt buộc và không trả
`academicRows`. Lần đầu bao gồm khởi tạo kết nối DB/SSH. Đây là số đo local
tại thời điểm kiểm tra, không phải cam kết thời gian đáp ứng dưới tải.

Test tự động kiểm tra số lần gọi profile/thống kê, hạn cache, request đồng thời,
thu hồi token, kiểm tra kỳ mới và snapshot khi in lại. Test trình duyệt chặn
response thông tin cá nhân có chủ ý để xác nhận khung form/danh sách vẫn hiện,
đồng thời xác nhận không gọi profile/thống kê khi token đã đủ thông tin.
