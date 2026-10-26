# Quy trình đơn sinh viên hiện hành - tối giản ngày 25/10/2026

Tài liệu này thay thế các mô tả cũ về bắt đầu xử lý, bổ sung thông tin, chuyển
thủ tục bên ngoài và xác nhận đã trả trong module demo đơn sinh viên.

## Chuyên viên xử lý đơn đề nghị và đơn xác nhận

1. **Tiếp nhận**: một lần bấm, ghi người và giờ nhận; không mở form phản hồi.
2. **In đơn**: xuất file theo field hiện có, để chuyên viên in/ký bên ngoài.
   Sáu loại đề nghị xuất PDF trực tiếp từ bố cục 7 mẫu đã chuẩn bị trước, không
   mở Word khi in. Mười một xác nhận dùng PDF tượng
   trưng đến khi có mẫu chính thức. Chỉ chuyên viên đúng phòng đang phụ trách
   được xuất file sau tiếp nhận; ghi NgayIn và event PRINT, không lưu PDF/JSON.
3. **Đã xử lý**: một lần bấm sau xuất file, hoàn tất hồ sơ ngay. Đề nghị dùng
   complete, xác nhận dùng result; cả hai chuyển COMPLETED và ghi NgayHoanTat.
   Xác nhận giữ lịch hẹn nhận giấy +2 ngày, nhưng không còn thao tác xác nhận
   đã trả cho chuyên viên. Không suy ra sinh viên đã nhận giấy thực tế.

Hồ sơ chưa hợp lệ: **Hủy đơn**, chọn lý do mẫu hoặc nhập tay, có thể chọn rồi
ghi chú thêm. Phản hồi hiển thị cho sinh viên. Nếu chọn lý do mẫu thì không
bắt nhập thêm. Không còn nút/API thao tác start, requestInfo, external hay
supplement cho hai nhóm này. In lại sau hoàn tất chỉ là xuất lại file, không
mở lại xử lý. Trạng thái/hẹn/lịch sử cũ được giữ, không viết lại hồ sơ đã tồn tại.

Hồ sơ cũ ở PROCESSING, NEEDS_INFO hoặc EXTERNAL_PROCESSING được chuyên viên
phụ trách xuất file rồi xử lý hoặc hủy. Xác nhận READY cũ được coi là đã xử lý,
không đòi bấm thêm bước. Các mốc đã trả lịch sử nếu có vẫn được giữ để tra cứu.

## Sinh viên và LMS

Sinh viên lập đơn, tự tải/in sáu loại đề nghị và theo dõi phản hồi; tự hủy
không cần lý do. Nếu bị chuyên viên hủy, đọc phản hồi để lập yêu cầu mới.
LMS giữ một nút yêu cầu cấp lại mật khẩu; chuyên viên tiếp nhận rồi phản hồi
mật khẩu và hoàn tất. Không thêm field sinh viên nhập hay bước xử lý phụ.

## Giao diện

- Một thanh điều hướng gồm Đơn đề nghị, Đơn xác nhận, Mật khẩu LMS; bỏ sidebar,
  tổng quan/hero và các lối vào trùng nhau.
- Danh sách có tìm theo mã/MSSV/tên, lọc loại đơn, lọc trạng thái, sắp xếp mới
  nhất/cũ nhất/loại A-Z/loại Z-A. Sắp thời gian dựa trên giờ lập, không phải giờ sửa.
- Ngày giờ dùng DD/MM/YYYY HH:mm:ss theo Việt Nam, ở cả danh sách và chi tiết.
- Màn hình rộng dùng bảng; khung nhỏ dùng thẻ đầy đủ nhãn và tự xuống dòng,
  tránh phải kéo ngang. Mỗi hồ sơ có nút Mở xử lý hoặc Chi tiết rõ ràng.
- Nút xử lý nằm ngay dưới tiêu đề chi tiết; nội dung và mốc thời gian theo lưới.
  Lịch sử thu gọn mặc định. Chỉ form hủy/phản hồi mật khẩu mới cần nhập dữ liệu.

## Kiểm chứng

23 bài backend liên quan và 11 bài FE; API xác nhận đủ 11 loại; nghiệp vụ local
có quyền sở hữu, hai chuyên viên nhận đồng thời, print trước complete, hoàn tất
xác nhận không có bước trả, hủy mẫu/nhập tay và LMS. Đã thao tác UI tiếp nhận/in/
xử lý một lần bấm, hủy hai cách, SV đọc phản hồi và sắp thời gian trong khung nhỏ.
Các hồ sơ QA được dọn theo đúng ID; không xóa hoặc đổi lịch sử hồ sơ người dùng.
