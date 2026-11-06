# Quản lý tài khoản chuyên viên và role

Trong bản local, chọn **Quản trị viên (demo)** rồi mở **Tài khoản & role**.

## Tạo và lưu role

Ở tab **Role & quyền**, chọn **+ Tạo role mới**, đặt tên và chọn các permission, rồi bấm **Tạo và lưu role**. Role mới không ghi đè role đã có.

Quyền gồm quyền thao tác (xem, tiếp nhận, in, đánh dấu đã xử lý, hủy), quyền Excel, quyền quản trị và phạm vi loại đơn. Để xử lý đơn cần có cả quyền xem, quyền thao tác tương ứng và phạm vi loại đơn đó. Ví dụ role tiếp nhận xác nhận sinh viên cần **Xem hồ sơ**, **Tiếp nhận đơn**, **Xác nhận sinh viên**.

Một chuyên viên có thể được gán nhiều role. Quyền hiệu lực là hợp của các role đang sử dụng. Có thể chọn một role đã lưu để chỉnh sửa hoặc bỏ **Đang sử dụng** để ngừng áp dụng; role và phiên bản cũ vẫn được giữ. Bấm **Xem lịch sử role** để xem cấu hình từng phiên bản.

Quyền cũ đã được chuyển thành các role **Quyền cũ — …** và gán lại cho đúng chuyên viên. Bảng quyền trực tiếp trước đây được giữ để đối chiếu; quyền chạy hệ thống hiện lấy từ RBAC. Nếu thay role cũ bằng role mới, bỏ tick role cũ trong danh sách role chuyên viên để tránh cộng thêm quyền cũ.

Người được giao quản lý role/tài khoản chỉ được cấp các quyền họ đang có; quản trị viên gốc quản lý toàn bộ. Việc cấp quyền được kiểm tra lại trong transaction, không chỉ dựa vào giao diện.

## Tạo tài khoản chuyên viên

Ở tab **Chuyên viên**, mở **Tạo tài khoản chuyên viên**, nhập họ tên, đơn vị, tên đăng nhập và mật khẩu từ 12 đến 128 ký tự; tick các role rồi lưu. Có thể tạo tài khoản chưa có role; tài khoản đó chưa có quyền xem hoặc xử lý đơn.

Chuyên viên dùng nút **Đăng nhập chuyên viên** trên thanh đầu trang, nhập tên đăng nhập và mật khẩu riêng. Tài khoản mới không nằm trong bộ chọn demo và không thể giả danh qua API chọn actor. Mật khẩu dùng scrypt với salt riêng, không lưu hoặc trả về mật khẩu dạng rõ. Có giới hạn thử đăng nhập sai.

Chọn một chuyên viên để thay danh sách role rồi bấm **Lưu role của chuyên viên**. Thay đổi role/quyền có hiệu lực ở request tiếp theo của phiên đang mở. Hồ sơ đang phụ trách được giữ nguyên để có thể bàn giao; thay quyền không đổi trạng thái đơn.

## Mở PDF

Các nút **Mở PDF / In hoặc tải**, **In lại** và **In đơn** mở tài liệu ở tab mới bằng trình xem PDF của trình duyệt. Người dùng chọn In hoặc Tải xuống trên thanh công cụ của trình xem. Không tự động tải file hoặc mở hộp thoại in.

Tab trống được mở ngay trong lần bấm để tránh chặn popup khi chờ server. Nếu bị chặn, hệ thống báo cho phép mở tab; chưa gửi yêu cầu xuất/in. File lỗi đóng tab chờ. PDF mở bằng blob local; Bearer token chỉ nằm trong header fetch, không đưa vào URL hoặc tab mới. Quy trình ghi nhận lần in và lịch nhận +3 ngày giữ nguyên.

## Lưu trữ và kiểm tra

Tất cả tài khoản/role/quyền nằm trong SQL local `sv_dut.svc_demo`; không ghi DB SSH. Các bảng: `QuyenRBAC`, `VaiTroRBAC`, `VaiTroQuyen`, `TaiKhoanVaiTro`, `DangNhapChuyenVien`, `PhienBanVaiTro`, `PhienBanVaiTroQuyen`, `LichSuRBAC`. Hai view `vQuyenHieuLuc`, `vQuyenXuLy` phục vụ kiểm tra quyền trực tiếp từ role đang có hiệu lực.

`npm run db:demo:rbac` tạo schema, backup trước khi chuyển đổi và giữ cấu hình khi chạy lại. `db:demo:setup` cũng chạy bước này cho môi trường mới. Tài khoản và role vẫn còn sau khi khởi động lại; phiên đăng nhập chuyên viên cần mở lại khi backend khởi động lại.

Kiểm thử: `npm test`, `npm run check`, `npm run test:requests:rbac`, `npm run test:requests:upgrade`, `npm run test:requests:live`; frontend `npm test` và `npm run check`. Dữ liệu QA được tạo riêng và dọn theo đúng mã đã sinh.
