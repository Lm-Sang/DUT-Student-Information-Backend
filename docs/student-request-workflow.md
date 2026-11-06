# Xử lý hồ sơ local

Luồng chuyên viên: **Tiếp nhận → In đơn → Đã xử lý**. Hủy đơn phải có lý do phản hồi cho sinh viên. Hai chuyên viên cùng tiếp nhận chỉ có một người thành công; mọi thay đổi kiểm tra phiên bản và quyền hiện hành trong transaction SQL local.

Văn bản xác nhận tạo ngày nhận ngay khi ghi nhận in lần đầu, bằng thời gian in + **3 ngày dương lịch** (kể cả cuối tuần). In lại lưu thời gian in gần nhất và lịch sử, không đổi lần in đầu / ngày nhận. Hồ sơ lịch sử đã xử lý giữ lịch nhận trước đây.

## Phân quyền và bàn giao

Chọn **Quản trị viên (demo)** rồi tab **Phân quyền chuyên viên**. Tick một hoặc nhiều loại công việc, hoặc bỏ hết để thu hồi quyền. Quyền theo từng mã DonSV, từng loại văn bản CONFIRMATION và LMS, không suy ra từ tên phòng ban.

Trong chi tiết đơn đã tiếp nhận và chưa kết thúc, Admin chọn chuyên viên mới có quyền tương ứng và nhập lý do bàn giao. Người tiếp nhận cũ, mới và lý do được lưu lịch sử. Thu hồi quyền không tự xóa người phụ trách hoặc thay đổi nội dung đơn.

Các bảng mở rộng trong `sv_dut.svc_demo`: `QuyenXuLy` (quyền theo người / loại công việc), `LichSuPhanQuyen` (audit cấp / thu hồi), `TaiKhoan.PhienBanQuyen`, các cột thời gian in và bàn giao của `DonDeNghi` / `LichSuXuLyDon`.

## Excel

Chuyên viên chọn **Xuất Excel danh sách đang lọc**. File tối đa 500 dòng; không xuất yêu cầu LMS hay mật khẩu. Chỉ sửa ô xanh: Status, In lúc và Ghi chú / lý do hủy. MSSV lưu dạng văn bản để giữ số 0 đầu. Ngày giờ theo Việt Nam.

Mỗi vòng nhập chỉ chuyển một bước kế tiếp hoặc hủy: Chờ tiếp nhận → Đã tiếp nhận → Đã in → Đã xử lý. Khi chọn Đã in, nhập thời gian in thực tế. Xuất file mới sau khi lưu bước trước. Đơn đã hủy / đã xử lý không được mở lại. Khi hủy phải ghi lý do.

Nhập file mở bản xem trước; chưa ghi DB. Nếu có lỗi thì toàn bộ file bị chặn. Khi bấm lưu, hệ thống kiểm tra lại chữ ký dòng, phiên bản, quyền và người phụ trách, rồi lưu tất cả thay đổi trong một transaction. Bản xem trước hết hạn sau 15 phút. Không nhận macro, công thức hoặc liên kết ngoài.

## SSO và hồ sơ thật

Nút **Đăng nhập SSO sinh viên** dùng module Auth hiện có: redirect Microsoft SSO, kiểm tra lượt đăng nhập qua cookie / chữ ký HS256 / hết hạn, đổi sang app token và handoff code dùng một lần có cookie binding. Token chỉ ở bộ nhớ, không lưu localStorage hoặc log. Phiên hồ sơ SSO được kiểm tra lại với phiên Auth ở mỗi request.

Cấu hình `MICROSOFT_SSO_JWT_SECRET` trực tiếp trong `.env`, khác `JWT_SECRET`; không đưa giá trị khóa vào source. SSO base URL là `https://sso.dut.udn.vn` theo file Auth. URL login chỉ có `callbackUrl` và `response_mode=query`; callbackUrl không có query bổ sung. Gateway trả callback chỉ với `accessToken`; nonce lượt đăng nhập chỉ ở cookie và server, không gửi lên URL SSO. `STUDENT_SSO_FRONTEND_CALLBACK_URL=http://localhost:5173/` khớp `STUDENT_FRONTEND_URL`.

Backend lấy MSSV 9 chữ số từ `unique_name` đã xác minh có đúng miền `sv1.dut.udn.vn`, rồi SELECT tham số hóa theo `SoTheSV` từ `DATA_GVien1.dbo.tmHoSoSV` qua SSH. Cột EMail là email liên hệ cá nhân, không dùng để ghép tài khoản Microsoft. Chỉ khi khớp duy nhất một hồ sơ mới mở phiên sinh viên. Không nhận MSSV / MaHS do client chọn. Không khớp hoặc trùng MSSV thì chặn mở hồ sơ. Màn hình phân biệt lỗi liên kết SSO với lỗi kết nối backend; thử lại giữ app token trong bộ nhớ, không dùng lại handoff code và không chuyển sang tài khoản demo. Chỉ cache hồ sơ và lưu nghiệp vụ trong SQL local; adapter SSH không có INSERT, UPDATE, DELETE, MERGE hay DDL.

Hồ sơ thật không xuất hiện trong danh sách nhân vật demo. Môi trường này vẫn là bản thử local, không được bật module demo ở production. Luồng đăng nhập trường thực tế cần người dùng hoàn tất đăng nhập SSO trong trình duyệt để kiểm tra đúng tài khoản của mình.

## Khởi tạo và kiểm tra

Chạy `npm run db:demo:upgrade` cho DB local đã có. Lệnh tạo backup trước migration và không sửa trạng thái / ngày in cũ. Khởi tạo mới bằng `npm run db:demo:setup` cũng chạy nâng cấp này.

Kiểm tra: `npm run check`, `npm test`, `npm run test:requests:upgrade` và `npm run test:requests:live`. Kiểm thử tích hợp tạo mã QA riêng và dọn đúng các mã đã tạo trong `finally`.

Định dạng tài khoản sinh viên: https://dut.udn.vn/Phong/QualityAssurance/Thongbao/id/11394
