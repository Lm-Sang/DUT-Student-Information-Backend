# Bộ mẫu đơn đề nghị

Phiên bản `2026-10-25.3`: xuất PDF trực tiếp bằng PDFKit, theo bố cục đã biên dịch
từ 7 mẫu Word trung tính. `docx/` giữ nguồn để biên tập; `layouts/` giữ tọa độ,
font, bảng, đường kẻ và các ô dữ liệu; `templates/` quản lý 6 mã đơn và version.
Cấp thẻ có hai biến thể mất/hỏng và đổi thông tin. `blank/` là 7 PDF xem mẫu.

## Luồng tải và in

Khi tải/in, API có xác thực đọc các cột đơn, hồ sơ và danh mục hiện tại rồi điền
dữ liệu vào bố cục có sẵn. Font và bố cục được đọc một lần trong mỗi tiến trình.
Không mở Word, tạo DOCX tạm, chạy PowerShell hay chờ hàng đợi chuyển đổi. Cả tải
của sinh viên và nút In đơn của chuyên viên dùng chung bộ xuất nhanh này.
PDF chỉ nằm trong bộ nhớ của lượt tải; không lưu PDF hay JSON trong DB.

Footer mỗi trang giữ mã đơn, giờ/ngày lập theo Việt Nam và số trang. Hồ sơ/ảnh/
điểm do server lấy, không nhận thông tin thay thế tùy ý từ client. Ảnh PNG/JPEG
tối đa 2MB; thiếu ảnh giữ ô dán; thiếu dữ liệu không tự tạo điểm. Các mẫu không
chứa thông tin cá nhân từ tài liệu nguồn. Chữ ký/dấu để trống, tên/chức danh in
sẵn theo mẫu nguồn. Đây vẫn là dữ liệu hư cấu local, chưa nối SSO trường.

Nội dung dài được xuống dòng; chuỗi không có khoảng trắng được chia theo ký tự.
Khối ngày/ký/ảnh giữ cùng trang. Bảng học kỳ giữ ranh giới cột từ nguồn, tăng
chiều cao hàng và lặp tiêu đề nếu sang trang. Biên nhận thôi học bắt đầu ở trang
riêng theo nguồn. Khi dữ liệu dài, số trang có thể tăng.

Tạo đơn chỉ lưu field trong `sv_dut.svc_demo`; render chỉ khi tải/in. In lại giữ
ngày lập nhưng dùng hồ sơ và template hiện tại, không cam kết bytes bất biến.
Quyền truy cập/trạng thái/version được kiểm tra lại sau render. Đơn hủy bị chặn.
Lỗi render không xóa đơn. Chuyên viên chỉ bấm Đã xử lý sau khi xuất file thành công.

## Biên tập mẫu

Chỉ bước chuẩn bị mẫu cần Word trên Windows và Python với `lxml`, `pdfplumber`.
Backend khi phục vụ tải/in không cần Word. Sau khi sửa nguồn trung tính:

```powershell
node scripts/build-fast-request-layouts.js --python python
npm.cmd run forms:blank
node --test src/modules/student-requests/__tests__/paper-pdf.test.js
npm.cmd run test:requests:pdf
node scripts/render-request-pdfs.js .data/form-qa assets/request-forms/blank/DonSV01-cap-lai-the-sinh-vien.pdf
```

Lệnh build dùng marker trung tính và Word một lần cho từng mẫu, rồi biên dịch
tọa độ bằng `compile-fast-request-layouts.py`. File tham chiếu nằm trong
`.data/research/fast-layouts/`, không commit. Layout ghi SHA-256 nguồn DOCX;
test kiểm tra hash và vị trí các mốc cố định cho đủ 7 mẫu. Tăng version và khởi
động lại backend sau khi sửa mẫu. Soát PNG tất cả trang, cả nội dung dài, ảnh,
bảng nhiều học kỳ và biên nhận. Không sửa thư mục gốc người dùng cung cấp.

`build-request-docx-templates.py` và `docx-layout-manifest.json` phục vụ kiểm tra
nguồn Word. `forms:layout:check` là đối chiếu tham chiếu Word cũ; kiểm tra renderer
hiện hành nằm trong `paper-pdf.test.js`, không dùng PDF tham chiếu cũ làm bằng
chứng đầu ra mới. Mapping dữ liệu vẫn ở `paper-pdf.renderer.js`.

Đo local 25/10/2026: 12 lượt, PDF cấp thẻ trung vị khoảng 0,11 giây so với PDF
xác nhận tượng trưng khoảng 0,07 giây. Mẫu Word cũ có một lượt chuyển đổi khoảng
5,6 giây. Đây là thời gian sinh file; HTTP còn gồm truy vấn DB và truyền dữ liệu.
