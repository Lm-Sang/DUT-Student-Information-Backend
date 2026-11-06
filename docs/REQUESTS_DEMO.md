> Quy trình hiện hành đã tối giản theo yêu cầu mới: xem [SIMPLIFIED_REQUEST_WORKFLOW.md](SIMPLIFIED_REQUEST_WORKFLOW.md). Các phần mô tả bổ sung/chuyển bước/xác nhận đã trả bên dưới là lịch sử, không còn áp dụng cho thao tác chuyên viên.

# Demo đơn đề nghị sinh viên — cập nhật 25/10/2026

Tài liệu hiện hành cùng REQUEST_WORKFLOWS.md thay thế hướng dẫn cũ về lưu
snapshot JSON/PDF bất biến. Backend và FE riêng, Node >=24; trên PowerShell dùng npm.cmd.

## Chạy

Backend: D:/PBL6_DUT/DUT-Student-Information-Backend.
FE: D:/PBL6_DUT/DUT-Student-Information-Frontend.

Backend cần ENABLE_REQUESTS_DEMO=true, SQL Server local sv_dut, Windows Authentication.
Chạy lần lượt npm.cmd run db:demo:setup, npm.cmd run db:demo:sync, npm.cmd run dev.
Setup tạo schema mới hoặc chuyển schema cũ sau backup; sync chỉ SELECT danh mục
DB trường rồi ghi local. Dev không tự migration/sync. Module chỉ ghi sv_dut.

Tại FE chạy npm.cmd run dev. Mở http://127.0.0.1:5173, backend mặc định cổng 3003.
Đổi bằng FE_PORT/BACKEND_PORT. Hai server chỉ phục vụ demo qua loopback.
Chọn lại vai trò sau khi backend restart; session RAM TTL 2 giờ, không lưu token localStorage.

## Luồng dùng thử

1. Chọn SV A; tab Lập đơn đề nghị có 6 loại giấy. Tạo đơn chỉ lưu field;
   bấm Tải PDF/In lại mới ghép hồ sơ và sinh PDF. Không tạo thêm đơn khi tải.
2. Chuyên viên CTSV/Đào tạo đúng phòng bấm Tiếp nhận yêu cầu rồi Đã xử lý hoặc Hủy.
   In lại chỉ hiển thị cho SV. Chuyên viên hủy phải chọn lý do hoặc nhập tay.
3. SV tự hủy chỉ xác nhận, không nhập lý do; đơn hủy bị chặn tải PDF.
4. Tab Lập đơn xác nhận luôn dùng một form chung cho 11 loại: loại văn bản,
   miễn phí/có trả phí, thông tin thêm, số lượng, lệ phí; hướng dẫn thay theo loại.
   Với bảng điểm, ghi kỳ/năm trong Thông tin thêm, không thêm form riêng.
5. Giá do server tính từ danh mục. Hiện mức phí thường của 11 loại là 0;
   10 loại có cờ miễn phí, loại 18 chưa rõ cờ nên khóa lựa chọn miễn phí.
6. Chuyên viên tiếp nhận xác nhận, có thể yêu cầu bổ sung; bấm Đã xử lý tự hẹn
   trả đúng 48 giờ sau, gồm cuối tuần. Xác nhận đã trả là bước riêng.
7. LMS chỉ có cấp lại mật khẩu: SV bấm gửi yêu cầu, không nhập mô tả/email hay xác nhận thêm.
   Chuyên viên tiếp nhận rồi Phản hồi mật khẩu; gửi phản hồi là hoàn tất. Không có
   bước yêu cầu bổ sung, hỗ trợ lỗi đăng nhập hay xác nhận đã trả riêng. Mật khẩu
   nằm trong chi tiết có quyền đọc; danh sách/timeline chỉ thông báo đã phản hồi.
8. SV B không xem hồ sơ A; chuyên viên khác phòng không xem/xử lý; hai người
   cùng nhận chỉ một thành công, người không phụ trách không xử lý hồ sơ đã nhận.

PDF dùng 7 bản Word trung tính giữ lề/style nguồn của 6 loại; cần Microsoft Word
và Times New Roman trên Windows. Proxy chờ tối đa 120 giây. Lỗi xuất không xóa
đơn đã lưu; có thể thử tải lại. In lại lấy hồ sơ/danh mục/template hiện tại,
giữ mã và ngày lập đơn; không cam kết hash/bytes giống lần trước.

## SQL local có kiểu

| Bảng svc_demo | Nội dung |
| --- | --- |
| TaiKhoan | Nhân vật demo, VaiTro, MaDV, SoThe |
| tmKehoach, tmNganhTQ, CauHinh | Kỳ, chương trình, cấu hình |
| DonDeNghi | Hồ sơ chung, trạng thái, người xử lý, hủy, lịch hẹn, version |
| His_InDon | Từng field của 6 loại đơn giấy |
| DeNghiVanBan | MaVanban, TTbosung, SoLuong, MienPhi, Khan, LePhi, ThanhTien, HocKy/NamHoc cũ |
| DeNghiEmail | MaEmail=3, RESET_PASSWORD và nội dung mặc định do server gán; không lấy field nhập từ SV |
| Sys_VanBan, Sys_Email | Cache danh mục trường, giữ mã/tên/cờ/phí theo nguồn |
| NhanThan, KetQuaHocTapHocKy | Hồ sơ và điểm demo từng cột, ảnh nhị phân tùy chọn |
| LichSuNoiDungDon | Field theo từng lần gửi/bổ sung |
| LichSuXuLyDon, LichSuTruongDuLieu | Timeline và từng field yêu cầu/đã bổ sung |
| TruongCanBoSung | Danh sách field cần bổ sung hiện tại |
| ChongGuiTrung | Key/hash/ID chống gửi trùng |

Không còn RequestFile/PdfBytes hoặc cột *Json trong schema này. JSON trong HTTP,
manifest backup hay file cấu hình repo là định dạng trao đổi, không phải payload
JSON được lưu trong bảng nghiệp vụ. Tên API giữ tương thích, mapper chuyển sang
cột tiếng Việt. Tên mới chưa có trong DB nguồn dùng quy chuẩn cùng nhóm.

Backup schema cũ tại .data/backups/requests-fields-*/ gồm rows.json,
legacy-schema.sql và manifest.json SHA-256. Không tự xóa backup/hồ sơ cũ.

## API và kiểm tra

Prefix /api/demo/student-requests. POST /session nhận actorId; các route sau đó
cần Bearer token: GET /catalogs, /profile, /requests, /requests/:id;
POST /requests và /requests/:id/actions; GET /requests/:id/file sinh PDF khi tải.
LMS tạo bằng {typeCode:"LMS_SUPPORT",payload:{},idempotencyKey}; server lấy người
đề nghị từ session. Chuyên viên dùng action result và message chứa mật khẩu để
phản hồi, chuyển thẳng COMPLETED và lưu NgayHoanTat; không ghi mật khẩu vào timeline.
Client không cấp role/phòng/giá/giờ xử lý/ngày hẹn. Hủy SV không cần message;
hủy chuyên viên nhận message hoặc cancelReasonCode. result xác nhận chỉ nhận
pickupLocation tùy chọn; server ghi NgayXuLy/NgayHenTra cùng transaction.

Kiểm tra: npm.cmd run check; npm.cmd test; npm.cmd run test:requests:live;
npm.cmd run test:requests:pdf; node scripts/verify-request-storage.js.
Hai smoke test hỗ trợ DEMO_API_PORT để kiểm tra qua server riêng không watch;
chỉ dọn đúng các ID do lần chạy tạo. Xem IMPLEMENTATION_STATUS.md về kết quả.

Demo chưa nối tài khoản/hồ sơ thật, RBAC thật, thu phí hay reset LMS thật.
Không ghi DB trường; không tự xác minh điều kiện học vụ hoặc duyệt/ký online.


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
