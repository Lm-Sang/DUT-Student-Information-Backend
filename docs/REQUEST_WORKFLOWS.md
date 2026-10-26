> Quy trình hiện hành đã tối giản theo yêu cầu mới: xem [SIMPLIFIED_REQUEST_WORKFLOW.md](SIMPLIFIED_REQUEST_WORKFLOW.md). Các phần mô tả bổ sung/chuyển bước/xác nhận đã trả bên dưới là lịch sử, không còn áp dụng cho thao tác chuyên viên.

# Quy trình hiện hành — cập nhật yêu cầu ngày 25/10/2026

Yêu cầu mới thay thế việc lưu PDF/snapshot JSON của bản cũ. Phạm vi là demo
local sv_dut; duyệt và ký diễn ra bên ngoài. LMS là luồng riêng.

| Nội dung | Lập đơn xác nhận | Lập đơn đề nghị |
| --- | --- | --- |
| Phạm vi | 11 loại theo Sys_VanBan hiện hành | 6 loại DonSV01/03/04/05/07/06 |
| Giao diện SV | Một form chung, danh sách bên phải khi đủ rộng | Chọn mẫu, bổ sung field và lưu |
| Khi gửi | Lưu field và phí do server tính | Chỉ lưu field, không render PDF |
| Khi tải | Không dùng mẫu đề nghị giấy | Đọc field + hồ sơ, sinh PDF trong lượt tải |
| Chuyên viên | Tiếp nhận → Đã xử lý/hẹn trả → Đã trả | Tiếp nhận → Đã xử lý hoặc Hủy |

Hai tab tách danh mục, danh sách, bộ lọc và thống kê. In lại chỉ hiển thị phía
SV của nhóm đề nghị; chuyên viên không có cột/nút này.

## Xác nhận

Một form cho mọi loại: chọn văn bản, loại đơn chỉ đọc, hướng dẫn, radio
Miễn phí/Có trả phí, Thông tin thêm, Số lượng, Lệ phí. Không thêm ô kỳ/năm riêng;
ghi kỳ/năm cần cấp bảng điểm trong Thông tin thêm theo hướng dẫn danh mục.
FREE chỉ mở khi cờ nguồn cho phép; PAID chỉ mở khi có giá hợp lệ. Server tự
tính giá/số lượng, không nhận giá từ client. KhongMienPhi NULL được giữ là chưa
xác định, không suy ra miễn phí. Phí demo là tham khảo, chưa thu tiền.

Chuyên viên tiếp nhận, xử lý hoặc yêu cầu bổ sung theo field cho phép. Đã xử lý
lưu NgayXuLy và NgayHenTra = NgayXuLy +48 giờ trong cùng transaction. Retry cùng
key không dời hẹn. READY là Đã xử lý · Chờ trả; COMPLETED là đã trả và ghi
ngaytraHS. Đơn hủy làm lịch hẹn hết hiệu lực. Client không gửi ngày hẹn/ngày in.

## Sáu đề nghị giấy

| Mã | Field đề nghị |
| --- | --- |
| DonSV01 | LyDoDeNghi, ThongTinThayDoiThe; mất/hỏng hoặc đổi thông tin |
| DonSV03 | HocKyDuKienTotNghiep |
| DonSV04 | HocKyHoanTotNghiep, LyDo |
| DonSV05 | HocKyXetHocBong, LyDo |
| DonSV07 | MaNganhTQ, HocKyBatDau |
| DonSV06 | LyDoDeNghi, NoiDungTrinhBay |

Lưu hồ sơ trước. Khi GET file, backend kiểm tra chủ hồ sơ/phòng, trạng thái,
đọc hồ sơ NhanThan và KetQuaHocTapHocKy, giải mã mã kỳ/chương trình theo danh mục,
điền bản Word trung tính đúng mẫu, xuất PDF rồi trả bytes. Không lưu snapshot
JSON hay PDF trong DB. Sau render kiểm tra lại trạng thái/quyền/version để
chặn hủy hoặc sửa đồng thời. Lỗi render cho phép thử tải lại hồ sơ đã có.

Ngày lập trong nội dung/footer luôn từ NgayDeNghi. In lại không tạo hồ sơ,
nhưng dùng hồ sơ/danh mục/template hiện tại; không hứa giữ nguyên bytes/hash.
Đơn đã xử lý vẫn tải theo quyền; đơn hủy chặn tải. File đã in không thể thu hồi.
Client không được gửi họ tên/MSSV/điểm/ảnh người khác để điền. Thiếu họ tên hoặc
MSSV không khớp thì từ chối xuất; field khác thiếu để trống theo mẫu.

## Hủy và lưu vết

SV hủy đơn chưa kết thúc bằng xác nhận, không hỏi lý do. Lưu vai trò/người/
thời điểm; LyDoHuy của lần hủy SV mới là NULL, timeline thông báo SV đã hủy.
Chuyên viên hủy phải có lý do: chọn mẫu, nhập tay hoặc chọn rồi nhập thêm.
Phản hồi hiển thị cho SV. Không viết lại lý do/lịch sử các hồ sơ cũ.

Nhóm giấy phải tiếp nhận trước Đã xử lý. Chỉ chuyên viên đúng phòng và đang
phụ trách được cập nhật; version và idempotency bảo vệ nhận đồng thời/gửi lại.
Tất cả field và lịch sử lưu thành cột/bảng liên quan, cùng transaction.

Hồ sơ/ảnh/điểm và phân quyền hiện là demo local; chưa nối SSO/RBAC/hồ sơ thật.
Xem REQUESTS_DEMO.md để chạy, IMPLEMENTATION_STATUS.md để xem kiểm chứng,
assets/request-forms/README.md để quản lý mẫu Word/PDF và kiểm tra bố cục.

## Cấp lại mật khẩu LMS

Chỉ có yêu cầu cấp lại mật khẩu, không có loại hỗ trợ đăng nhập khác. SV bấm gửi,
không điền hay xác nhận bất kỳ field nào. Server gán MaEmail=3 và loại RESET_PASSWORD
theo session chủ yêu cầu. Chuyên viên tiếp nhận rồi nhập mật khẩu vào Phản hồi mật
khẩu; phản hồi thành công kết thúc hồ sơ ngay. Không yêu cầu bổ sung, không tách
trả kết quả thành bước tiếp theo. Hồ sơ cũ đang NEEDS_INFO vẫn được chuyên viên
phản hồi trực tiếp. SV xem mật khẩu trong chi tiết có xác thực; danh sách và
timeline không chứa mật khẩu. Đây là luồng phản hồi, không gọi API đổi mật khẩu thật.


## In văn bản xác nhận sau khi tiếp nhận (mẫu tượng trưng)

Theo yêu cầu bổ sung ngày 25/10/2026: chuyên viên phụ trách tiếp nhận, bấm
**In đơn** để xuất PDF, in/ký bên ngoài, rồi quay lại bấm **Đã xử lý**. Thao tác
xuất chỉ ghi mốc xuất file và event PRINT; không tự xử lý, không tạo hẹn trả.
Đã xử lý xuất hiện sau khi đã xuất file cho nội dung hiện tại; lúc xác nhận
server vẫn hẹn trả sau đúng 2 ngày. Đã trả cho SV tiếp tục là thao tác riêng.

Chỉ chuyên viên đúng phòng và đang phụ trách được xuất; SV không có nút In đơn
cho nhóm xác nhận. Đây là bản chuyên viên in phục vụ sinh viên, khác chức năng
SV tự tải/in sáu loại đơn đề nghị. Giữ nguyên phân tuyến CTSV/Đào tạo của danh mục.

Hiện chưa có đủ mẫu chính thức nên dùng một renderer tượng trưng cho 11 loại,
có nhãn rõ MẪU TƯỢNG TRƯNG, loại giấy, mã yêu cầu, thông tin SV, nội dung đăng ký,
số lượng/phí tham khảo, chỗ ký trống, giờ xuất và số trang. Không xác nhận điểm,
không tạo chữ ký hay dấu. Ảnh bảng dịch vụ là tham khảo, chưa đổi danh mục/phí/SLA.

POST /api/demo/student-requests/requests/:id/print nhận {version,idempotencyKey},
trả application/pdf. Thời điểm do server ghi trong DonDeNghi.NgayIn (nghĩa là
lần xuất file gần nhất, không chứng minh đã in trên máy in). Event PRINT,
version và receipt ghi cùng transaction sau khi render thành công. Retry cùng
key không nhân đôi lịch sử. File chỉ được sinh khi bấm In đơn, không lưu PDF/JSON
vào DB và không cần thêm bảng. Đơn hủy hoặc người không phụ trách bị chặn.

Nếu SV bổ sung nội dung sau khi đã xuất, NgayIn trở về NULL để buộc xuất lại
cho nội dung mới; lịch sử xuất trước đó vẫn được giữ. Đổi trạng thái/hủy trong
lúc render làm lượt xuất thất bại thay vì trả một bản không còn hợp lệ.

Kiểm tra: node scripts/smoke-confirmation-prints.js (có DEMO_API_PORT cho server
QA riêng), 181 lượt HTTP cho đủ 11 loại; kiểm tra quyền, tiếp nhận, PDF, retry,
bổ sung sau in, hẹn trả và hủy. Các ID QA được dọn đúng theo từng lần chạy.
22 bài backend liên quan, 8 FE và 78 lượt nghiệp vụ chung đều qua. Đã render
mẫu ngắn/dài và kiểm tra UI tải file, mốc xuất và đánh dấu xử lý riêng.
