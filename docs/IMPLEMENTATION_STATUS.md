> Quy trình hiện hành đã tối giản theo yêu cầu mới: xem [SIMPLIFIED_REQUEST_WORKFLOW.md](SIMPLIFIED_REQUEST_WORKFLOW.md). Các phần mô tả bổ sung/chuyển bước/xác nhận đã trả bên dưới là lịch sử, không còn áp dụng cho thao tác chuyên viên.

# Kết quả rà soát và hoàn thiện ngày 25/10/2026

Phạm vi: bản demo local, dữ liệu trong SQL Server sv_dut, schema svc_demo.
Yêu cầu ngày 25/10 thay thế cơ chế lưu PDF/snapshot JSON ở các phiên trước.

## Trạng thái khi tiếp nhận

Phiên “Tìm project dùng Node.js” bị ngắt trong lượt sửa cuối. Đã có 6 loại
đề nghị giấy, 7 biến thể mẫu, 11 xác nhận, LMS, phân quyền demo và lịch hẹn.
Migration sang cột tiếng Việt đã thực hiện và có backup trước khi bỏ JSON/PDF.
Form chung, hủy SV không lý do, PDF sinh khi tải đã được viết nhưng chưa kiểm
chứng trọn luồng; smoke test cuối thất bại và tài liệu vẫn mô tả cơ chế cũ.

## Kế hoạch đã thực hiện

1. Đọc yêu cầu cuối, kiểm tra mã/schema và tái hiện lỗi smoke test.
2. Bổ sung quantity/feeMode/serviceSpeed/feePolicyKnown bị thiếu khi đọc đơn xác nhận.
3. Đổi test PDF sang sinh khi tải; kiểm tra dữ liệu cột, quyền tải, hủy và race.
4. Giữ nội dung form khi SV lọc danh sách; thêm kiểm tra form chung và kiểm tra cú pháp module mới.
5. Chạy backend/FE/API/PDF, kiểm tra giao diện 11 loại và hai vai trò, đối chiếu storage/backup.
6. Cập nhật hướng dẫn hiện hành và báo cáo bàn giao.

| Yêu cầu | Kết quả hiện tại |
| --- | --- |
| Hai tab độc lập, LMS riêng | Có danh mục/danh sách/bộ lọc/số liệu riêng |
| 11 xác nhận dùng một form | Một form chung bên trái ở màn hình rộng, danh sách bên phải; màn hình nhỏ xếp dọc |
| Phí | FREE/PAID theo danh mục; không nhận giá từ client; loại 18 chưa cho phép chọn miễn phí |
| Hủy SV | Không có ô lý do, không bắt nhập; lần hủy mới lưu LyDoHuy NULL |
| Hủy chuyên viên | Dropdown, nhập tay hoặc chọn và nhập thêm; bắt buộc có lý do công khai |
| Tiếp nhận/xử lý/trả | Ghi người và thời điểm; xử lý xác nhận tạo hẹn +48 giờ; trả là mốc riêng |
| PDF | Chỉ sinh khi GET file, từ field đơn và hồ sơ/danh mục hiện tại; giữ thời điểm lập đơn |
| In lại | Sinh lại từ dữ liệu hiện tại; không cam kết bytes bất biến giữa các lượt tải |
| Lưu dữ liệu | Cột có kiểu, tên tiếng Việt theo nguồn; không còn cột JSON hay bảng lưu PDF trong svc_demo |
| Dữ liệu cũ | Giữ hồ sơ/lịch sử; backup trước migration có manifest SHA-256 |
| Chuyên viên | Không có cột/nút In lại; quyền API vẫn giới hạn theo phòng |

## Kiểm chứng lần tiếp nối

- Backend: 73/73 bài qua; cú pháp 131 file JS trước khi thêm script audit chỉ đọc.
- Frontend: 6/6 bài qua; cú pháp bao gồm confirmation-form.js.
- API nghiệp vụ: 74 lượt HTTP/concurrency, 13 hồ sơ thử được dọn theo ID.
- PDF/API/SQL: 83 lượt; đủ 7 biến thể, nội dung lặp lại, quyền/phòng/hủy,
  không lưu JSON/PDF; PDF QA tại .data/research/filled-pdf-qa.
- Đối chiếu mẫu dùng forms:layout:check; bảo toàn lề/style/bảng được kiểm tra trong bộ test Word.
- Browser: đổi đủ 11 loại, gửi form, giữ draft khi lọc; SV hủy không lý do;
  chuyên viên có tiếp nhận, xử lý, dropdown hủy và hẹn trả.
- Audit chỉ đọc: node scripts/verify-request-storage.js xác minh schema và backup.

## Giới hạn thuộc phạm vi demo đã chốt

Hồ sơ/điểm/ảnh và vai trò vẫn là dữ liệu giả lập. Chưa nối SSO với danh tính
thật hoặc RBAC vận hành; LMS không đổi mật khẩu thật; phí chưa thu tiền và
điều kiện cấp chính thức chưa được tự động xác minh. Duyệt/ký diễn ra bên ngoài.
Máy chạy backend cần Windows, Microsoft Word và Times New Roman để xuất PDF.
Đổi hồ sơ hoặc template sẽ ảnh hưởng lần tải sau; ngày lập đơn vẫn giữ nguyên.

## Điều chỉnh LMS theo yêu cầu tiếp theo ngày 25/10/2026

LMS chỉ cấp lại mật khẩu: một nút gửi, không có field SV nhập; chuyên viên
tiếp nhận và phản hồi mật khẩu, hoàn tất ngay. Bỏ yêu cầu bổ sung/loại hỗ trợ
đăng nhập và email liên hệ. Không đưa mật khẩu vào danh sách/timeline; chỉ có
trong chi tiết theo quyền. Giữ nguyên bảng/cột và lịch sử cũ, không cần migration.
Kiểm tra sau thay đổi: 18 bài backend liên quan, 7 FE và 75 lượt API nghiệp vụ
đều qua. Đã kiểm tra gửi/tiếp nhận/phản hồi và SV xem kết quả qua browser.


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
