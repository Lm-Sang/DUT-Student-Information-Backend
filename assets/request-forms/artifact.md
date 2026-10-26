# Hợp đồng giữ bố cục gốc

Tham chiếu bất biến: D:/PBL6_DUT/bieu-mau-de-nghi-in. Hash từng file ở
assets/request-forms/source-inventory.json. Đã xuất chỉ đọc bằng Microsoft Word
tất cả 8 DOCX; ảnh đầy đủ ở original-form-render. Card PDF được cung cấp là
chuẩn bổ sung cho ảnh đã bị xóa khỏi Word cấp thẻ.

Khổ 11900×16840 twip. Section chính top/right/bottom/left:
- Cấp thẻ, tốt nghiệp, hoãn: 1940/850/540/1133; header488/footer300.
- Học bổng:1980/850/540/992; header488/footer300.
- CT2:640/850/540/1133; header0/footer300.
- Đổi thẻ và thôi học:640/425/280/566; quốc hiệu trong body.

Giữ nguyên styles, theme, numbering, font table, tab stops, căn đều hai lề,
firstLine, giãn dòng, khoảng cách đoạn, bảng/grid/cell, vị trí ngày ký/tên ký.
Ảnh neo page-X1435988EMU, paragraph-Y116826EMU (tốt nghiệp103813), kích thước
1157097×1739900EMU. Header/footer Choice và Fallback giữ cả hai.

Slot ở bảng hồ sơ 1; bảng kết quả 2; nội dung đề nghị; tên ký; biên nhận;
ngày lập/footer. Thay text node, không thay paragraph/run properties. Ảnh nguồn
không được giữ trong template; thay placeholder hoặc ảnh snapshot. Điểm/tên
trong mẫu nguồn không được dùng làm mặc định. Giữ bảy dòng lịch sử nguồn.

Sửa chữa có chủ ý: khôi phục ảnh Word cấp thẻ; footer kiểu web-copy được chuyển
thành footer thật và bỏ padding/section rỗng chỉ phục vụ footer; số trang dùng
PAGE thay số cứng; ngày nhận và chữ ký để trống. Nội dung dài phân trang bởi Word.
Thêm keepNext trên khối ngày/ký tên để ảnh không đè footer và tên không rơi sang
trang khác; không đổi khoảng cách hoặc vị trí trong trường hợp nội dung vừa trang.
Khi xuất, đo đáy ảnh nổi theo tọa độ neo thực tế; nếu chạm vùng footer thì ngắt
trang trước đoạn neo ảnh rồi phân trang lại. Chỉ kiểm tra chữ là chưa đủ vì ảnh
có thể cao hơn toàn bộ khối ký tên.
Không giãn chữ ở dòng xuống hàng bằng Shift+Enter. Biên nhận thôi học bắt đầu
trang riêng theo nguồn. Các ngoại lệ pPr được liệt kê trong manifest.
Các PDF lưu DB trước đó bất biến, không tự ghi đè; version mẫu mới dùng cho đơn mới.

Yêu cầu kiểm chứng: hash các phần preserve-only; so sánh geometry và pPr/grid;
điền cùng dữ liệu nguồn để so tọa độ các mốc quốc hiệu/tiêu đề/Kính gửi/nhãn
hồ sơ/bảng; render và xem từng trang PDF trống, dữ liệu điền, lý do dài, từ dài,
xuống dòng và lịch sử nhiều kỳ. Không dùng renderer chung tự đặt lại lề.
