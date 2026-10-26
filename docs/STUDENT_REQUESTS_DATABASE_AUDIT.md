# Bảng đơn đề nghị, hỗ trợ LMS và người xử lý

Kiểm tra trực tiếp ngày 24/10/2026 trên SQL Server trường. Đọc metadata của 6 DB
có quyền truy cập, sau đó đọc danh mục và số liệu tổng hợp tại `DATA_SV1` và
`DATA_GVien1` bằng connection `secondary`. Không thay đổi database, không đọc giá
trị mật khẩu hoặc xuất hồ sơ/nội dung đơn của cá nhân.

Schema, danh mục và số liệu kiểm chứng nằm trong
[student-requests-schema-and-catalogs.json](data/student-requests-schema-and-catalogs.json).
Các câu SQL chỉ đọc để rà lại danh mục nằm tại
[student-requests-audit.sql](../scripts/queries/student-requests-audit.sql).

## 1. Ba luồng riêng biệt

| Màn hình/nghiệp vụ | Danh mục | Bảng ghi nhận yêu cầu | Người xử lý/phân quyền |
| --- | --- | --- | --- |
| Lập đơn: cấp lại thẻ, xét tốt nghiệp, thôi học… | `DATA_SV1.dbo.LoaiDon` | `DATA_SV1.dbo.His_InDon` | `DATA_GVien1.dbo.SV_QuyenXN`, `tmHosoGV` |
| Hỗ trợ tài khoản Email/Office365/DUT-LMS | `DATA_GVien1.dbo.Sys_Email` | `DATA_SV1.dbo.DeNghiEmail` | `DeNghiEmail.NguoiXuLy` → `tmHosoGV.MaHS` |
| Cấp văn bản xác nhận, bảng điểm, xác nhận NVQS… | `DATA_GVien1.dbo.Sys_VanBan` | `DATA_SV1.dbo.DeNghiVanBan` | `DATA_GVien1.dbo.tmQuyenXNVB`, `tmHosoGV`, `tmDonVi` |

`DeNghiVanBan` là bảng cấp văn bản. Danh sách 6 loại đơn trong ảnh thuộc luồng
`LoaiDon` + `His_InDon`, không phải danh mục của `DeNghiVanBan`.

Menu trong DB cũng phân tách ba trang:

- `PageLapDonDN.aspx`: các mục cấp lại thẻ, xét/hoãn tốt nghiệp, chương trình 2,
  học bổng, thôi học.
- `PageDLMS.aspx`: hỗ trợ tài khoản Email, LMS.
- `PageLapDonXN.aspx`: cấp văn bản xác nhận.

## 2. Danh mục loại đơn và payload form

`DATA_SV1.dbo.LoaiDon` có 19 dòng. Sáu dòng có `HieuLuc=1`, `LoaiCombo=1` khớp
đúng danh sách dropdown trong hình; cả sáu cũng có `ChoSVDoc=1`:

| Mã `KyHieuDon` | Tên loại đơn | Số bản ghi trong `His_InDon` lúc kiểm tra |
| --- | --- | ---: |
| `DonSV01` | Đề nghị cấp lại thẻ sinh viên | 7.370 |
| `DonSV03` | Đề nghị xét công nhận tốt nghiệp | 14.309 |
| `DonSV04` | Đề nghị xét hoãn tốt nghiệp | 267 |
| `DonSV05` | Đề nghị xét học bổng khuyến học | 1.947 |
| `DonSV07` | Đề nghị xét học chương trình 2 | 210 |
| `DonSV06` | Đề nghị giải quyết thủ tục thôi học | 1.027 |

Các loại khác gồm `HOANHP`, `NGUNGHOC`, `GIAHAN`, `TROLAIHT`, `PHUCKHAO`,
`BOSUNG`, `HOANTHI` và các thủ tục/thu phí. Không đưa toàn bộ 19 loại vào dropdown
chỉ dựa vào `HieuLuc`; cần phân biệt nhóm hiển thị và luồng xử lý.

Các cột danh mục đáng chú ý:

- `KyHieuDon`: mã nghiệp vụ; nối với `His_InDon.LoaiDon` và
  `DATA_GVien1.dbo.SV_QuyenXN.MaLoaiDon`.
- `LoaiDon`, `STT`: tên và thứ tự.
- `HieuLuc`, `ChoSVDoc`, `LoaiCombo`: trạng thái/nhóm hiển thị; điều kiện chính
  xác của trang cũ cần đối chiếu code web.
- `DonThoiHoc`, `TaiChinh`, `CaoHoc`: phân nhóm nghiệp vụ.
- `NoiNhanGiaoHS`: nơi giao nhận; 6 loại trong ảnh ghi `Khu Hành chính một cửa`.

### Bảng `DATA_SV1.dbo.His_InDon`

Đây là bảng giữ cả dữ liệu lập đơn và các bước nhận/xử lý, không chỉ là lịch sử in.

| Nhóm | Cột |
| --- | --- |
| Định danh | `ID` (identity, PK), `MaHS`, `LoaiDon`, `IDCode` |
| Lập/in | `NgayInDon`, `IP`, `MAC` |
| Các ô dữ liệu của form | `DRD01`, `DRD02`, `CHK01`, `CHK02`, `LD01`, `LD02` |
| Nhận/xử lý | `NgayNhanDon`, `MaCBND`, `NgayXuLy`, `MaCB`, `NoiDungXL` |
| Hủy | `Huy` |
| Hoãn học phí | `TongHPHoan`, `ListLopHoan`, `HoanBienCo`, `XacNhanHP`, `HanHP`, `DuyetHoan`, `HanHP_Duyet` |
| Thôi học | `QDThoi_So`, `QDThoi_Ngay`, `QDThoi_Note`, `QDThoi_DongY`, `BuocThoi`, `PhuHuynhDN`, `QDThoi_BanIn` |

Theo tên cột và vị trí trong màn hình, `NgayInDon` tương ứng thời điểm lập/in,
`IDCode` là mã kỳ của bản ghi, `NgayNhanDon` là nhận lúc, `NoiDungXL` là nội dung
xử lý/phản hồi và `NgayXuLy` là xử lý lúc. **Chưa xác định được field tương ứng
chính xác với cột “Tác dụng cho kỳ” và “Ghi chú” từ schema riêng lẻ.**

### Ví dụ cấp lại thẻ `DonSV01`

Kiểm chứng trên 7.370 bản ghi, chỉ thống kê mức sử dụng field:

| Mã trong `CHK01` | Số bản ghi | Có dữ liệu `LD01` |
| --- | ---: | ---: |
| `LD0` | 7.245 | 12 |
| `LD1` | 125 | 125 |

- `DRD01`, `DRD02`, `CHK02` đều rỗng ở loại đơn này.
- `CHK01` lưu lựa chọn; `LD01` là một ô nội dung bổ sung được sử dụng cùng lựa
  chọn. `LD02` cũng được dùng nhưng chưa chốt ý nghĩa.
- Đối chiếu ảnh và việc toàn bộ 125 dòng `LD1` có `LD01`, **suy luận** `LD1`
  ứng với “Cần thay đổi thông tin”, `LD0` ứng với “Thẻ bị mất/hỏng”. Chưa có code
  Web Forms để xác nhận nhãn, validation bắt buộc hay ý nghĩa 12 trường hợp `LD0`
  vẫn có `LD01`; không nên tự coi đây là mapping đã xác minh hoàn toàn.

Mức sử dụng field thay đổi rõ theo loại:

| Loại đơn | Field có dữ liệu đáng chú ý |
| --- | --- |
| `DonSV01` | `CHK01`; một phần `LD01`, `LD02` |
| `DonSV03` | `DRD01`; một phần `LD02` |
| `DonSV04` | Một phần `LD02` |
| `DonSV05` | `DRD01`, `LD01`; một phần `LD02` |
| `DonSV06` | `DRD01` và các cột quy trình thôi học |
| `DonSV07` | `DRD01`, `DRD02`; một phần `LD02` |
| `HOANHP` | `LD01`, một phần `LD02`, các cột riêng của hoãn học phí |

Đây là bằng chứng payload phụ thuộc loại đơn. Tên `DRD`, `CHK`, `LD` không đủ
để xác định ý nghĩa của từng ô cho mọi loại đơn.

## 3. Hỗ trợ tài khoản LMS, email

Danh mục `DATA_GVien1.dbo.Sys_Email`:

| `MaEmail` | `TenDenghi` | `HieuLuc` |
| --- | --- | ---: |
| `1` | Tài khoản Office365 Trường cấp | 1 |
| `2` | Tài khoản email Trường cấp (*) | 0 |
| `3` | Tài khoản DUT-LMS | 1 |

Yêu cầu LMS là `DATA_SV1.dbo.DeNghiEmail` có `MaEmail='3'`. Đã thấy 28.701
bản ghi loại này. Nối danh mục bằng `DeNghiEmail.MaEmail = Sys_Email.MaEmail`.

Các cột khớp màn hình:

- `MaHS`, `IDCode`: sinh viên và kỳ.
- `NgayDeNghi`: đề nghị lúc.
- `KDinh`: ứng viên cho thời điểm xác nhận, theo schema/tên cột.
- `TTbosung`: thông tin bổ sung.
- `TruongPhanHoi`: phản hồi của trường.
- `NgayXuLy`, `NguoiXuLy`: thời điểm và người xử lý.
- `MatKhauEmail`: có cột chứa thông tin mật khẩu theo tên schema.

`DATA_SV1.dbo.NhanThan` còn có cột `LMS_PW0` và `MKemail`. **Không đọc giá trị
các cột này**, và chưa xác minh màn hình “Mật khẩu LMS ban đầu” lấy từ
`NhanThan.LMS_PW0` hay từ payload xử lý trong `DeNghiEmail`.

`DATA_GVien1.dbo.CBDeNghiEmail` có schema tương tự cho khối cán bộ; cần phân biệt
với yêu cầu hỗ trợ của sinh viên.

Chưa tìm thấy bảng phân quyền theo `MaEmail` tương tự `SV_QuyenXN` trong metadata
đã đọc. Đã xác minh được người xử lý thực tế của yêu cầu LMS/email nối với bảng
cán bộ; quyền thao tác trang hỗ trợ vẫn cần code/quyền hệ thống cũ để chốt.

## 4. Đề nghị cấp văn bản

`DATA_GVien1.dbo.Sys_VanBan` là danh mục theo kỳ. Các cột chính:

`IDCode`, `MaVanBan`, `TenVanBan`, `HieuLuc`, `LePhiThuong`, `LePhiNhanh`,
`NhomVB`, `ThongTinDinhKem`, `MaDVcap`, `KhongMienPhi`, `SoLuongMien_Ngay`,
`KhongCapNeuKhongHoc`, `Caohoc`, `Nhanluc`.

Trong kỳ `2610`, có các mã như `01` xác nhận sinh viên, `02` xác nhận SV vay
tiền, `04` bảng điểm học kỳ, `05` bảng điểm năm học, `06` bảng điểm quá trình,
`08`–`10` bảng điểm tiếng Anh, `13` xác nhận hoãn NVQS…

`ThongTinDinhKem` thực sự có các hướng dẫn khác nhau theo văn bản, ví dụ mã `04`
yêu cầu ghi học kỳ xin cấp bảng điểm, mã `05` yêu cầu ghi năm học. Đây là cấu hình
nội dung bổ sung đã tìm thấy trong DB, nhưng không phải schema đầy đủ cho form.

`DATA_SV1.dbo.DeNghiVanBan` lưu yêu cầu:

- Loại/người đề nghị: `ID`, `MaHS`, `IDCode`, `MaVanban`, `LoaiDN`, `KyHieu`.
- Số lượng/phí: `SoLuong`, `LePhi`, `ThanhTien`, `MienPhi`, `Datinh`, `Khan`.
- Nội dung/trạng thái: `NgayDeNghi`, `KDinh`, `TTbosung`, `Reply`, `DaNhan`, `DaXL`.
- Xử lý: `NgayXuLy`, `NguoiXuLy`, `nguoitraHS`, `ngaytraHS`.
- Hủy/in: `Huy`, `NgayHuy`, `NguoiHuy`, `SLIn`, `SVLap`.

Liên kết danh mục cần xét **cả `IDCode` lẫn `MaVanban`**. Tuy nhiên không được giả
định cặp này luôn unique: kỳ `2610` có hai dòng mã `14` trong `Sys_VanBan`, đều
đang `HieuLuc=0`. Cần xử lý trùng và điều kiện hiệu lực/đối tượng ở repository.
Các ý nghĩa số của `LoaiDN`, `DaXL`, `DaNhan` chưa được chốt từ code cũ.

Đơn vị cấp nối `Sys_VanBan.MaDVcap → DATA_GVien1.dbo.tmDonVi.MaDV`:

- `115`: P. Đào tạo và BĐCL.
- `120`: P. Công tác sinh viên.

## 5. Người nhận, người xử lý và phân quyền

Bảng hồ sơ cán bộ là **`DATA_GVien1.dbo.tmHosoGV`**, với `MaHS`, `Hoten`,
`TaiKhoan`, `MaCBVC`, `Nhom`… Các cột tác nhân đã kiểm tra dùng **`MaHS`**, không
phải `TaiKhoan`.

| Nguồn | Khóa nối tới `tmHosoGV.MaHS` | Kết quả kiểm tra các mã khác rỗng |
| --- | --- | --- |
| `His_InDon` | `MaCB` | 6/6 mã khớp |
| `His_InDon` | `MaCBND` | 12/12 mã khớp |
| `DeNghiEmail` | `NguoiXuLy` | 8/8 mã khớp |
| `DeNghiVanBan` | `NguoiXuLy` | 12/12 mã khớp |
| `DeNghiVanBan` | `nguoitraHS` | 24/24 mã khớp |
| `DeNghiVanBan` | `NguoiHuy` | 4/4 mã khớp |

Các field xác định người đã thao tác không đồng nghĩa danh sách người được phép
xử lý. Phân quyền của đơn và văn bản nằm ở hai bảng riêng:

**`DATA_GVien1.dbo.SV_QuyenXN`**:

- `MaHS`: mã cán bộ.
- `MaLoaiDon`: nối `LoaiDon.KyHieuDon`.
- `QuyenNhanDon`, `QuyenXuLy`, `NgayPQ`.
- Đã đối chiếu 415/415 dòng phân quyền có mã cán bộ khớp `tmHosoGV`.
- Với `DonSV01`, có 2 cán bộ mang `QuyenNhanDon=1`, `QuyenXuLy=1`; còn 20 dòng
  cùng loại có cả hai quyền bằng 0. Không coi sự tồn tại dòng phân quyền là có quyền.

**`DATA_GVien1.dbo.tmQuyenXNVB`**:

- `IDCode`, `MaVBXN`: kỳ và mã văn bản.
- `MaND`: mã cán bộ, đã đối chiếu 849/849 dòng khớp `tmHosoGV.MaHS`.
- Cần lọc kỳ khi xác định người được xử lý một mã văn bản.

`DATA_SV1.dbo.TKhoanCV` là bảng tài khoản chuyên viên/cố vấn, cũng có `MaHS`,
`TaiKhoan`, `Chuyenvien` và cờ quyền. Đối chiếu cho thấy bảng này chỉ bao phủ một
phần nhỏ các tác nhân trên; không dùng nó thay thế hồ sơ cán bộ `tmHosoGV`.

## 6. Sinh viên và các bảng liên quan khác

Các yêu cầu dùng `MaHS`. Có hai nguồn hồ sơ:

- `DATA_GVien1.dbo.tmHoSoSV`: hồ sơ sinh viên, có `MaHS`, `Hoten`, `MaLop`,
  `MaNganh`; bao phủ phần lớn lịch sử.
- `DATA_SV1.dbo.NhanThan`: tài khoản/thông tin cổng sinh viên, có `MaHS`, `SoThe`,
  `Hoten`, `Lop`… Không bao phủ toàn bộ lịch sử cũ.

Ví dụ `His_InDon` có 26.359 dòng: nối `tmHoSoSV` khớp 26.351 dòng, còn nối
`NhanThan` khớp 5.328 dòng. Khi đọc lịch sử, dùng `LEFT JOIN` và có cách xử lý hồ
sơ thiếu; không lọc mất đơn chỉ vì không còn tài khoản cổng sinh viên.

`DATA_GVien1.dbo.tmNgungTroLaiHoc` là luồng gần kề cho ngừng học, gia hạn và trở
lại học: có `MaDeNghi`, `MaSV`, lý do/số kỳ, quyết định, người nhận và người duyệt
từng bước. Các mã loại đơn liên quan có trong `LoaiDon`; mối nối chi tiết với
`His_InDon` chưa được xác minh.

## 7. Giới hạn và điểm cần chốt trước khi xây form động

- Không thấy FK cho các bảng chính trong metadata đọc được. Các liên kết nêu
  trên là liên kết nghiệp vụ, đã kiểm chứng qua danh mục và tỷ lệ khớp dữ liệu.
- `DATA_GVien1` thấy 83 SQL modules nhưng **không đọc được định nghĩa của module
  nào**. Không thể kết luận toàn bộ logic không nằm trong stored procedure.
- `tmSysFields`/`tmSysTabs` chứa metadata form hồ sơ, gia đình, khen thưởng,
  ngoại ngữ…; không tìm thấy field `DRD01/CHK01/LD01/LoaiDon` hoặc tab đơn đề
  nghị trong nhóm này.
- Chưa tìm thấy bảng rõ ràng dạng `LoaiDon → Fields → Options → Validation` cho
  6 form trong ảnh. Tên trang `.aspx` và các ô dùng chung cho thấy cần kiểm tra
  code `PageLapDonDN.aspx`/code-behind hoặc module SQL được cấp quyền đọc để
  chốt layout, nhãn, giá trị mặc định và quy tắc bắt buộc.
- Các bảng có hậu tố `_luu`, ngày tháng là nguồn lưu trữ cần phân biệt với bảng
  chính. Việc có bảng lưu không tự chứng minh ứng dụng hiện vẫn đọc bảng đó.

Nếu đưa vào cấu trúc feature hiện tại, nên tách ba nghiệp vụ: đơn sinh viên,
hỗ trợ tài khoản và cấp văn bản. Mỗi loại đơn có request DTO/validation riêng;
mapper/repository chịu trách nhiệm ánh xạ sang các field legacy. Nguồn trường
vẫn dùng `connectDatabase('secondary', 'DATA_SV1')` hoặc `DATA_GVien1`; bản khảo
sát này chưa tạo schema hay sao chép dữ liệu sang `sv_dut` local.
