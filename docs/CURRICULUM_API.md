# API danh sách CTĐT theo khoa và khung chương trình

Triển khai tại [src/modules/curriculum](../src/modules/curriculum/), trả JSON,
không yêu cầu đăng nhập hoặc token SSO. Module đọc SQL bằng tài khoản backend đã cấu hình.

## Route và cách gọi

| Phương thức | Route | Kết quả |
| --- | --- | --- |
| GET | `/api/public/academic-programs?facultyId=102` | Toàn bộ CTĐT công bố của khoa CNTT, mặc định trình độ Đại học |
| GET | `/api/public/academic-programs/1021049/curriculum` | Tổng quan, toàn bộ dòng khung và điều kiện của một CTĐT |

```powershell
npm run dev
curl.exe "http://localhost:3003/api/public/academic-programs?facultyId=102"
curl.exe "http://localhost:3003/api/public/academic-programs/1021049/curriculum"
curl.exe "http://localhost:3003/api/public/academic-programs/1024045/curriculum"
```

`facultyId` bắt buộc, gồm 3 chữ số. Query `educationLevelCode` tùy chọn, mặc định `CD01`;
định dạng `CD` + 2 chữ số. Mã khoa/trình độ không có CTĐT công bố trả danh sách rỗng.
Danh sách trả tất cả chương trình đúng bộ lọc, không phân trang.

`programId` là **mã CTĐT gồm 7 chữ số**, ví dụ `1024045`.
`7480201` là mã ngành quốc gia và không dùng để tìm khung CTĐT.
Route khung không nhận bộ lọc học kỳ: response chứa mọi dòng hiện có của chương trình.
Query lặp, không hợp lệ hoặc không được hỗ trợ trả `400` trước khi truy vấn SQL.

## Response

Response thành công dùng `{ "success": true, "data": ... }`.
Danh sách có `data` là mảng chương trình:

| Trường | Nội dung |
| --- | --- |
| `id`, `name` | Mã và tên CTĐT |
| `facultyId`, `facultyName` | Mã và tên khoa quản lý |
| `majorCode`, `majorName`, `specialization` | Mã ngành quốc gia, tên ngành và chuyên ngành |
| `educationLevelCode`, `trainingLanguageCode` | Mã trình độ/ngôn ngữ; `CD01` là Đại học, `ND01` là Tiếng Việt |
| `semesters` | Số học kỳ công bố |
| `requiredCredits`, `electiveCredits`, `requiredCompulsoryCredits` | Tổng tín chỉ yêu cầu, tín chỉ tự chọn yêu cầu, hiệu của hai số đó |
| `startDate`, `endDate` | Ngày bắt đầu/kết thúc, hoặc `null` nếu nguồn chưa có |

Khung có `data` là object:

| Trường | Nội dung |
| --- | --- |
| `program` | Tổng quan CTĐT theo cấu trúc trên |
| `counts` | Số dòng khung, dòng có/không có học phần thay thế, số điều kiện và số dòng thiếu metadata |
| `coverage` | Số học kỳ công bố, học kỳ có dòng khung, học kỳ chưa có dòng và `hasAllSemesters` |
| `courses` | Tất cả học phần và dòng học phần thay thế trong khung |
| `requirements` | Tất cả điều kiện của chương trình |

`courses` trả `id`, `courseId`, `courseName`, `courseShortName`, `credits`, `semester`,
`semesterText`, `order`, `alternativeCourseId`, `electiveFlag`, `preProjectFlag`,
`projectPrerequisiteFlag`, `graduationProjectFlag`, `notes`, `assessmentType`, `assessmentGroup`.
`id` là ID dòng khung; `courseId` là mã học phần. Giữ các cờ nguồn và giá trị `null`.
`alternativeCourseId` giữ quan hệ `MaHPTT`; dòng có trường này vẫn nằm trong `courses`.

`requirements` trả `id`, `courseId`, `requiredCourseId`, `requiredCourseName`,
`sourceRequirementType`, `type`, `alternativeCondition`, `notes`.
Ghép điều kiện vào học phần bằng `courseId`. `type` dùng:

| `sourceRequirementType` | `type` | Ý nghĩa |
| --- | --- | --- |
| 0 | `previous` | Học trước |
| 1 | `prerequisite` | Tiên quyết |
| 2 | `co-requisite` | Song hành |
| 3 | `supporting` | Phụ trợ |
| Giá trị khác | `null` | Giữ mã nguồn để tránh suy diễn |

`alternativeCondition` giữ giá trị `Hoac`, `notes` giữ `Ghichu`; không chuyển toàn bộ điều kiện thành AND.
Các dòng thiếu metadata vẫn được trả về, kèm số lượng trong `counts`.
`coverage.hasAllSemesters` chỉ cho biết mỗi học kỳ công bố có ít nhất một dòng khung;
không xác nhận tính đầy đủ về nghiệp vụ của chương trình. Giá trị là `null` nếu nguồn không có số học kỳ hợp lệ.

Response lỗi dùng `{ "success": false, "message": "..." }`:

- `400`: mã hoặc query không hợp lệ.
- `404`: chương trình không tồn tại hoặc không được công bố/không còn sử dụng.
- `503`: SQL/SSH hoặc nguồn metadata không truy cập được; response không chứa lỗi SQL hay thông tin đăng nhập.

## Nguồn SQL và cấu hình

```dotenv
CURRICULUM_PRIMARY_DATABASE=DHBK_CDS
CURRICULUM_METADATA_DATABASE=DATA_GVien1
```

Hai biến có các giá trị trên làm mặc định, dùng cùng cấu hình SQL/SSH và tài khoản
`DB_PRIMARY_*`, `DB_SECONDARY_*` hiện có. Kết nối mở khi gọi module lần đầu;
khởi động app và các API khác không cần chờ SQL. Các lần gọi đồng thời dùng chung pool.

| Nguồn | Bảng/cột sử dụng |
| --- | --- |
| `primary` → `DHBK_CDS` | `tmNganh`: `MaNganh`, `TenNganh`, `Kyhieu`, `TenCN`, `SoTinChi`, `Sotuchon`, `SoHK`, `CapDT`, `NgNguDT`, `BatDau`, `KetThuc`, `PubWeb`, `InUse` |
| `primary` → `DHBK_CDS` | `DonVi`: `MaDV`, `TenDV`; mã khoa qua `LEFT(tmNganh.MaNganh,3)` |
| `primary` → `DHBK_CDS` | `tmKhungCT`: `ID`, `MaKhung`, `MaHP`, `MaHPTT`, `Hocky`, `Kyhoc`, `STT`, `Tuchon`, `HTDA`, `TQDA`, `DATN`, `Note`, `LoaiKT`, `NhomKT` |
| `primary` → `DHBK_CDS` | `tmHocPhan`: `MaHP`, `TenHP`, `KyHieu`, `SoTC` |
| `primary` → `DHBK_CDS` | `tmHocphanDK`: `ID`, `MaKhung`, `MaHP`, `MaHPdk`, `LoaiDK`, `Hoac`, `Ghichu` |
| `secondary` → `DATA_GVien1` | `tmNganhQG`: `MaNganhQG`, `TenNganhQG`, `CapDT` để lấy tên ngành quốc gia |
| `secondary` → `DATA_GVien1` | `tmNganh`: `MaNganh`, `BatDau`, `KetThuc` để bổ sung ngày còn thiếu |
| `secondary` → `DATA_GVien1` | `tmHocPhan`: `MaHP`, `TenHP`, `KyHieu`, `SoTC` để bổ sung metadata học phần còn thiếu |

Danh mục và mọi truy vấn khung/điều kiện đều lọc `PubWeb=1 AND InUse=1`.
Nguồn thứ hai chỉ bổ sung metadata còn thiếu và tên ngành quốc gia;
tập mã CTĐT, dòng khung và điều kiện lấy từ nguồn chính. Truy vấn dùng SELECT và tham số SQL.
Điều kiện lấy riêng để không nhân số dòng môn. API đọc SQL mỗi lần gọi;
không đọc các file JSON đã xuất trong `docs/data`.

Các route HTTP `/api/public/course-registration/*` tiếp tục hoạt động theo cấu hình trước đó.
Xem [kết quả truy nguồn và đối chiếu trang SV](CURRICULUM_DATABASE_TRACE.md).

## Kết quả kiểm tra dữ liệu thật

Kiểm tra ngày 08/10/2026 qua chính các route mới:

- Khoa `102`: **91 CTĐT**, gọi được khung của cả 91 CTĐT.
- Tổng cộng **7244 dòng khung**, **5883 dòng điều kiện**; không thiếu tên/tín chỉ học phần hoặc tên môn điều kiện sau khi bổ sung metadata.
- `1021049`: **114 dòng khung** (95 dòng không có học phần thay thế, 19 dòng có học phần thay thế), **75 điều kiện**, có học kỳ **1–9**.
- `1024045`: **16 dòng khung**, **0 điều kiện**, chỉ có học kỳ **1–2** dù công bố **9 học kỳ, 150 tín chỉ**. `coverage.missingSemesters` là `[3,4,5,6,7,8,9]`.

API trả toàn bộ dòng có trong nguồn. Với CTĐT K2026, nguồn chưa có đủ các học kỳ sau;
không tự thêm môn từ một CTĐT khác.

```powershell
npm test
npm run test:curriculum:live
# Kiểm tra khoa khác, nếu cần:
npm run test:curriculum:live -- 101
```

`npm test` dùng fixture, không truy cập SQL. Lệnh `test:curriculum:live` chạy server HTTP tạm,
đọc SQL và kiểm tra từng CTĐT của khoa; đóng server, SQL pool và SSH khi hoàn tất.
