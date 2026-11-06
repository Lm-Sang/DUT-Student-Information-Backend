# Truy nguồn SQL: danh sách CTĐT theo khoa và khung từng CTĐT

Kiểm chứng ngày **08/10/2026**, bằng truy vấn SELECT trên SQL Server đang cấu hình trong dự án.
Mục tiêu là dữ liệu JSON và bảng/cột nguồn, không trả HTML cho người dùng.

## Kết quả đã xác minh

- Tài khoản `primary` đọc được `DHBK_CDS` và `DATA_SV2`; tài khoản `secondary` đọc `DATA_GVien1`.
- `DHBK_CDS.dbo.tmNganh` với khoa `102`, `CapDT='CD01'`, `PubWeb=1`, `InUse=1`
  trả **91 CTĐT**, khớp **toàn bộ mã và tên** của 91 dòng trên trang SV khi chọn khoa CNTT.
- Mã chương trình là `tmNganh.MaNganh`, ví dụ **`1024045`**.
  Mã ngành quốc gia là `tmNganh.Kyhieu`, ví dụ **`7480201`**.
- Khung nối `tmNganh.MaNganh = tmKhungCT.MaKhung`;
  thông tin môn nối `tmKhungCT.MaHP = tmHocPhan.MaHP`.
- Điều kiện học phần nằm riêng trong `tmHocphanDK`, lọc theo `MaKhung`.
- Mã khoa được suy từ **3 ký tự đầu của mã CTĐT** rồi nối `DonVi.MaDV` để lấy tên.
  Quy tắc lọc này đã được đối chiếu với toàn bộ danh mục khoa `102` trong ảnh.

Trang SV dùng ASP.NET Web Forms và handler ASP.NET để hiển thị dữ liệu.
Không có source ASP.NET của trang SV trong repo nên chưa chứng minh được câu SQL hay database cụ thể
mà deployment trang SV đang chạy. Các phép so sánh trên chứng minh dữ liệu SQL được truy cập ở đây tái hiện
đúng danh mục và tập mã học phần của các chương trình đã đối chiếu.

## Bảng và cột

| Phần dữ liệu | Bảng/cột SQL đã đọc |
| --- | --- |
| Danh sách chương trình | `tmNganh.MaNganh`, `TenNganh`, `Kyhieu`, `TenCN`, `SoTinChi`, `Sotuchon`, `SoHK`, `CapDT`, `NgNguDT`, `BatDau`, `KetThuc` |
| Điều kiện công bố | `tmNganh.PubWeb=1`, `InUse=1`; khoa qua `LEFT(MaNganh,3)`; trình độ qua `CapDT` |
| Tên khoa | `DHBK_CDS.dbo.DonVi.MaDV`, `TenDV` |
| Tên ngành quốc gia | `DATA_GVien1.dbo.tmNganhQG.MaNganhQG`, `TenNganhQG`, `CapDT`; nối với `tmNganh.Kyhieu` |
| Học phần trong khung | `tmKhungCT.ID`, `MaKhung`, `MaHP`, `Hocky`, `Kyhoc`, `STT`, `Tuchon`, `HTDA`, `TQDA`, `DATN`, `MaHPTT`, `Note`, `LoaiKT`, `NhomKT` |
| Tên/ký hiệu/tín chỉ môn | `tmHocPhan.MaHP`, `TenHP`, `KyHieu`, `SoTC` |
| Điều kiện học phần | `tmHocphanDK.ID`, `MaKhung`, `MaHP`, `MaHPdk`, `LoaiDK`, `Hoac`, `Ghichu` |

`CD01` tương ứng Đại học và `ND01` tương ứng Tiếng Việt trong các dòng đã đối chiếu với trang SV.
`LoaiDK` nguồn được repo Course Registration chuyển thành `RequirementTypeId = LoaiDK + 1`:
0 = học trước, 1 = tiên quyết, 2 = song hành, 3 = phụ trợ.
Giữ nguyên `Hoac`, `Ghichu` và các cờ nullable để không làm mất thông tin điều kiện.
Xem [DataResource.cs](../course-registration/CourseRegistration.Application/DataResource/DataResource.cs)
và [ModelSeedData.cs](../course-registration/CourseRegistration.Data/Extensions/ModelSeedData.cs).

## Dữ liệu JSON đã xuất

- [Danh sách 91 CTĐT khoa 102](data/academic-programs-faculty-102.json).
- [Khung và điều kiện của toàn bộ 91 CTĐT](data/curriculum-faculty-102.json).

Bản khung chứa **7244 dòng khung** và **5883 dòng điều kiện**, không cắt theo học kỳ hiện tại
hoặc chỉ lấy môn của một sinh viên. Mỗi chương trình có metadata, `courses`, `requirements` và `counts`.
Giữ cả dòng có `MaHPTT`; không loại thông tin học phần thay thế chỉ vì chúng không hiện trên bảng web.

Đã kiểm tra: 91 mã chương trình không trùng, tất cả đúng khoa/cờ công bố,
số dòng khai báo khớp mảng dữ liệu, không thiếu tên/tín chỉ của học phần hoặc tên môn điều kiện
sau khi bổ sung metadata từ database thứ hai.

Chạy lại bằng script **chỉ đọc SQL**:

```bash
node scripts/export-public-curriculum.js 102
```

Script dùng `primary → DHBK_CDS` cho danh mục/khung/điều kiện;
`secondary → DATA_GVien1` bổ sung tên môn còn thiếu, tên ngành quốc gia và ngày đào tạo còn trống.
Không thay tập mã chương trình hoặc tự thêm môn từ một khung khác. Có trường nguồn bổ sung trong JSON.
SQL account là kết nối của backend tới DB; việc dữ liệu này được công bố trên web không biến SQL Server
thành dịch vụ cho truy cập ẩn danh.

## Giới hạn dữ liệu thực tế

| Mã CTĐT | Dữ liệu đã đọc |
| --- | --- |
| `1021049` | 114 dòng khung, gồm 95 dòng có `MaHPTT` rỗng khớp đủ 95 mã môn trên web và 19 dòng có học phần thay thế; 75 điều kiện; có học kỳ 1–9 |
| `1024045` | 16 dòng khung, học kỳ 1–2, chưa có dòng điều kiện; tổng quan công bố 9 học kỳ, 150 tín chỉ |
| `1024043` | 16 dòng khung, học kỳ 1–2 |
| `1024042` | 13 dòng khung, học kỳ 1–2 |
| `1024044`, `1024046` | Mỗi chương trình 14 dòng khung, học kỳ 1–2 |

Với các CTĐT K2026 trên, **SQL đang truy cập cũng chỉ có học phần của hai học kỳ đầu**.
Đã lấy toàn bộ dòng hiện có; chưa có căn cứ để dựng đủ chín học kỳ từ dữ liệu này.
Đây là giới hạn của nguồn đang truy cập, không phải chỉ lấy một phần của response HTML.

Các database không đồng bộ hoàn toàn:

- `DHBK_CDS` có đúng tập 91 CTĐT công bố theo ảnh, nhưng catalog môn thiếu một số tên môn mới và
  ngày bắt đầu/kết thúc của các CTĐT K2026 còn trống.
- `DATA_GVien1` có tên các môn mới và ngày đào tạo K2026 khớp ảnh, nhưng tập CTĐT công bố khác
  và chưa có các dòng khung `1024043`, `1024045` lúc kiểm tra.
- `DATA_SV2` đọc được qua `primary` nhưng chưa có bản ghi CTĐT `1024043`, `1024045` lúc kiểm tra.

## Truy vấn để backend trả JSON

[public-curriculum.sql](../scripts/queries/public-curriculum.sql) có bốn result set:
danh sách theo khoa, thông tin một CTĐT, toàn bộ dòng khung và toàn bộ điều kiện của CTĐT.
Tên/tín chỉ học phần dùng LEFT JOIN để không làm mất môn nếu catalog chưa đồng bộ.
Điều kiện lấy riêng để tránh nhân số dòng môn khi một môn có nhiều điều kiện.

Đã thêm module [src/modules/curriculum](../src/modules/curriculum/) đọc SQL và trả JSON:
`GET /api/public/academic-programs?facultyId=102` và
`GET /api/public/academic-programs/:programId/curriculum`.
Đã kiểm tra qua API toàn bộ 91 CTĐT khoa 102: 7244 dòng khung và 5883 dòng điều kiện.
Xem [hướng dẫn API, cấu hình và response](CURRICULUM_API.md).
Các route Course Registration hiện tại vẫn dùng HTTP như lựa chọn trước đó của người dùng.

