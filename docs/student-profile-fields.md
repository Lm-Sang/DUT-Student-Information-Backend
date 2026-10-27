# Các trường nhân thân điền vào đơn

Tài khoản SSO được xác minh trước, tách MSSV 9 chữ số từ email sinh viên và tìm đúng `DATA_GVien1.dbo.tmHoSoSV`. Khi đọc `DATA_SV1.dbo.NhanThan`, phải khớp cả `SoThe` và `MaHS`; nếu trùng hoặc lệch danh tính thì dừng, không chọn tùy ý một dòng.

| Trên đơn | Nguồn ưu tiên / cách lấy |
|---|---|
| Họ tên | `NhanThan.Hoten`, dự phòng `tmHoSoSV.Hoten` |
| MSSV | `tmHoSoSV.SoTheSV`, đối chiếu `NhanThan.SoThe` |
| Lớp | `NhanThan.Lop`; nếu là mã thì tra `tmLop.MaLop → TenLop`; khi thiếu dùng tên lớp tra từ `tmHoSoSV.MaLop` |
| CCCD/CMND | `NhanThan.CCCD_So` trước, rồi `NhanThan.cmnd`; thiếu mới dùng `tmHoSoSV.SoCMND` |
| Điện thoại | `NhanThan.dienthoai`; thiếu mới dùng `tmHoSoSV.Mobile/Dienthoai`, không lấy điện thoại gia đình |
| Ngày sinh | `NhanThan.ngay/thang/nam` ghép và kiểm tra ngày hợp lệ; thiếu/sai định dạng thì dùng `tmHoSoSV.Ngaysinh` |
| Nơi sinh | `NhanThan.noisinh → Ma_DiaPhuongC1.MaTinhThanh → TinhThanh`; nơi sinh nước ngoài dùng `NoiSinhNN` theo cờ `Foreigner`; nguồn dự phòng tra `tmDiaPhuong` |
| Giới tính | Quy ước riêng từng nguồn: nhân thân 1 Nam / 2 Nữ; nguồn hồ sơ chính 1 Nam / 0 Nữ |
| Dân tộc | Tra `Ma_DanToc.MaDT → DanToc`, chuẩn hóa mã 1 thành 01; không in mã thay tên |
| Ngành/chương trình | Tra `tmNganh.MaNganh → TenNganh` từ ngành hiện hành, dự phòng ngành trong hồ sơ chính |

CCCD và điện thoại luôn giữ dạng chuỗi, bao gồm số 0 đầu. Mã lớp, dân tộc, nơi sinh không tra được tên thì để trống; không dùng mã như một tên hiển thị. Không tự thêm giá trị giả.

Hồ sơ SSO được đọc mới khi xem thông tin cá nhân, lập đơn giấy/xác nhận và xuất PDF. Sinh viên tải PDF hay chuyên viên in đơn đều dùng cùng bộ đọc này. Thông tin chuẩn hóa được cache bằng các cột có kiểu trong SQL local; tất cả truy vấn tới DB trường qua SSH đều là SELECT. Các hồ sơ demo vẫn dùng dữ liệu mẫu của demo.

PDF đã mở ở tab riêng là một bản đã tạo. Khi cần dữ liệu mới, mở lại bằng **In lại / Mở PDF**, thay vì tải lại URL blob cũ.
