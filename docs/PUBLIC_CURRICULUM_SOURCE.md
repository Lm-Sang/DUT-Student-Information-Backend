# Nguồn khung chương trình đào tạo chung của DUT

Kiểm tra ngày **08/10/2026**, từ hai ảnh người dùng cung cấp.
Đã xác định đúng trang danh mục và request mở hộp thoại khung CTĐT; kiểm tra bằng HTTP thực tế,
không gửi `Authorization`, `Cookie` hoặc thông tin đăng nhập.

Đã truy sâu xuống SQL Server và xuất JSON danh mục/khung theo yêu cầu bổ sung:
xem [truy nguồn database, bảng/cột, phép đối chiếu và dữ liệu JSON](CURRICULUM_DATABASE_TRACE.md).
Phần kiểm tra HTTP dưới đây là bằng chứng đối chiếu; dữ liệu JSON mới được đọc từ SQL.

## Request mở khung trong ảnh

Trang danh mục: [G_ListCTDT.aspx](https://sv.dut.udn.vn/G_ListCTDT.aspx).
Hàm `CTDT_LoadKhung(MaCTDT, TenCTDT)` trong
[Scripts/Public.js?v=20102025](https://sv.dut.udn.vn/Scripts/Public.js?v=20102025),
dòng 1474 của bản tải lúc kiểm tra, gọi **POST** đến:

```http
POST https://sv.dut.udn.vn/WebAjax/evLopHP_Load.aspx?E=G_KhungCTDT&MaNganh=1024045
```

Không cần body. Đã kiểm tra **GET** cũng trả cùng nội dung:

```http
GET https://sv.dut.udn.vn/WebAjax/evLopHP_Load.aspx?E=G_KhungCTDT&MaNganh=1024045
```

Cả hai trả `200`, `Content-Type: text/html; charset=utf-8`, 16700 byte.
Đây là endpoint public trả HTML, chưa phải API JSON.
Tham số có tên **`MaNganh` nhưng giá trị là mã CTĐT**: trong ảnh là `1024045`,
không phải mã ngành `7480201` hoặc mã khoa `102`.

Response có hai bảng HTML:

- `G_KhungCTDT_Grid0`: thông tin tổng quan chương trình.
- `G_KhungCTDT_Grid`: danh sách học phần và quan hệ học trước/song hành/tiên quyết.

## Đối chiếu chương trình trong ảnh

| Nội dung | Giá trị từ response nguồn |
| --- | --- |
| Mã ngành | `7480201` |
| Mã CTĐT | `1024045` |
| Tên chương trình | An toàn thông tin trên không gian số K2026 |
| Số học kỳ công bố | 9 |
| Tổng tín chỉ yêu cầu | 150 |
| Tín chỉ bắt buộc | 150 |
| Tín chỉ tự chọn | 0 |
| Số dòng học phần hiện trả | 16 |
| Học kỳ của các dòng hiện trả | 1 và 2 |
| Tổng tín chỉ của 16 dòng hiện trả | 40 |

Một số dòng đối chiếu với ảnh:

| TT | Học kỳ | Mã HP | Tên học phần | Tín chỉ |
| --- | --- | --- | --- | --- |
| 1 | 1 | `2090150` | Triết học Mác - Lênin | 3 |
| 2 | 1 | `3190320` | Giải tích | 4 |
| 3 | 1 | `1025060` | Kỹ thuật lập trình | 3 |
| 16 | 2 | `3050760` | Thí nghiệm vật lý lượng tử | 1 |

Nguồn hiện trả 16 dòng, dù tổng quan ghi 9 học kỳ và 150 tín chỉ. Chưa xác định được vì sao phần
chi tiết mới có hai học kỳ; không tự bổ sung các học phần còn lại hoặc xem 40 tín chỉ là tổng yêu cầu.

Kiểm chứng thêm mã `1021049` trong ảnh: cùng endpoint trả `200`, chương trình
Công nghệ Thông tin K2016_CNPM, 95 dòng học phần trải từ học kỳ 1 đến 9 và có dữ liệu quan hệ học phần.
Ví dụ quan hệ: Vật lý 1 (`3050011`) cần học trước Giải tích 1 (`3190111`);
Phương pháp tính (`1020072`) có quan hệ song hành với Đại số (`3190131`).
Số tín chỉ yêu cầu là thông tin công bố riêng trong bảng tổng quan; không suy ra bằng cách cộng mọi dòng học phần.

## Các cột đọc được từ HTML

Bảng tổng quan có: mã/tên ngành, mã/tên CTĐT, số học kỳ, tổng tín chỉ yêu cầu,
tín chỉ bắt buộc và tín chỉ tự chọn.

Bảng chi tiết có 12 cột theo thứ tự:

| Vị trí | Cột hiển thị | Trường JSON có thể ánh xạ khi tích hợp |
| --- | --- | --- |
| 1 | TT | `order` |
| 2 | Học kỳ | `semester` |
| 3 | Tên học phần | `courseName` |
| 4 | Ký hiệu | `courseShortName` |
| 5 | Mã HP | `courseId` |
| 6 | Số tín chỉ | `credits` |
| 7 | Tự chọn | `electiveMarker` |
| 8 | HT ĐA | `preProjectMarker` |
| 9 | TQ ĐA | `projectPrerequisiteMarker` |
| 10 | Học phần cần học trước | `previousCourses` |
| 11 | Học song hành với học phần | `coRequisiteCourses` |
| 12 | Cần học phần tiên quyết | `prerequisiteCourses` |

Tên JSON trên là đề xuất ánh xạ, **chưa phải response đã triển khai trong `src`**.
Các ô đánh dấu trống cần giữ nguyên ý nghĩa nguồn; chưa xác nhận mọi dạng ký hiệu đánh dấu HTML.

## Cách tải danh mục theo khoa

`G_ListCTDT.aspx` dùng form ASP.NET Web Forms. GET ban đầu trả khung giao diện và các dropdown.
Để lấy danh mục khoa CNTT như ảnh, gửi POST form cùng các hidden field nhận từ GET,
gồm `__VIEWSTATE`, `__VIEWSTATEGENERATOR`, `__EVENTVALIDATION` nếu xuất hiện, và:

```text
_ctl0:MainContent:GListCTDT_cboTrDo=Đại học
_ctl0:MainContent:GListCTDT_cboKhoa=102
_ctl0:MainContent:GListCTDT_cboOrder=Xếp theo Tên ngành, Tên CTĐT
_ctl0:MainContent:GListCTDT_btnDuLieu=Dữ liệu
```

Content-Type request: `application/x-www-form-urlencoded`.
Đã kiểm tra không đăng nhập: POST trả `200`, 91 dòng CTĐT của khoa `102` tại thời điểm kiểm tra.
Dòng `1024045` khớp ảnh: mã ngành `7480201`, 150 tín chỉ, 9 học kỳ, từ 8/2026 đến 1/2031.

## Phân biệt với các API Course Registration đã dựng

| Nguồn | Kết quả kiểm tra / hành vi trong source |
| --- | --- |
| `sv.dut.udn.vn/...E=G_KhungCTDT&MaNganh=1024045` | Public, `200`, trả khung có danh sách học phần dạng HTML |
| `dangkytinchi.dut.udn.vn/api/AcademicPrograms/1024045` | Trả `404` tại thời điểm kiểm tra |
| `dangkytinchi.dut.udn.vn/api/AcademicPrograms/1021049` | `200`, trả thông tin chương trình nhưng không có trường `courses` |
| `GET /api/Courses` trong Course Registration BackendAPI | Có `[Authorize]`; lấy chương trình của sinh viên theo `UserId` rồi dựng danh sách học phần |
| `GET /api/admin/programs/{id}/courses` trong Course Registration AdminAPI | Có `[Authorize]` ở controller; gọi `GetDetailByIdAsync(id)` để lấy khung theo mã CTĐT |

Route hiện tại `/api/public/course-registration/academic-programs/:programId` chỉ bọc thông tin
chương trình từ `/api/AcademicPrograms/:id`. Nó không cung cấp khung học phần trong ảnh.
HTTP client public hiện chỉ nhận JSON; để tích hợp nguồn `sv.dut.udn.vn` cần thêm xử lý HTML
cho hai bảng trên, thay vì chỉ đổi base URL của client hiện tại.

Nguồn code:

- [ProgramsController.cs](../course-registration/CourseRegistration.BackendAPI/Controllers/ProgramsController.cs): public GetById gọi `GetByIdAsync`, trả metadata.
- [CoursesController.cs](../course-registration/CourseRegistration.BackendAPI/Controllers/CoursesController.cs): GET có xác thực cho sinh viên.
- [Admin ProgramsController.cs](../course-registration/CourseRegistration.AdminAPI/Controllers/ProgramsController.cs): GET khung theo chương trình có xác thực.
- [AcademicProgramService.cs](../course-registration/CourseRegistration.Application/AcademicProgram/AcademicProgramService.cs): `GetDetailByIdAsync` ghép chương trình, học phần, thứ tự/học kỳ và điều kiện học phần.

## Bảng/cột có thể đối chiếu trong repo

Đã xác nhận các bảng/cột sau trong **code Course Registration tham khảo**.
Không có source ASP.NET của `sv.dut.udn.vn` trong repo, nên chưa chứng minh đây chính là truy vấn SQL
mà handler `G_KhungCTDT` đang chạy. Phần khảo sát HTTP ban đầu không truy vấn database thật;
phần kiểm chứng SQL bổ sung được ghi riêng trong [CURRICULUM_DATABASE_TRACE.md](CURRICULUM_DATABASE_TRACE.md).

| Bảng trong luồng nhập/đọc khung của Course Registration | Cột sử dụng |
| --- | --- |
| SQL nguồn `tmKhungCT` | `MaKhung`, `MaHP`, `STT`, `HTDA`, `TQDA`, `Tuchon`, `Hocky`, `Kyhoc` |
| SQL nguồn `tmHocphanDK` | `MaKhung`, `MaHP`, `MaHPdk`, `LoaiDK` |
| BE `Programs` | `Id`, `AcademicProgramName`, `AcademicProgramNameEn`, `FacultyId`, `MajorId`, `Credits`, `ElectiveCredits`, `Semesters`, `StartDate`, `EndDate`, `EducationLevel` |
| BE `CourseInPrograms` | `AcademicProgramId`, `CourseId`, `Order`, `Semester`, `IsElectiveCourse`, `IsPreProjectRequired`, `IsProjectPrerequisite`, `Notes` |
| BE `Courses` | `Id`, `CourseName`, `CourseShortName`, `Credits` |
| BE `CourseRequirements` | `ProgramId`, `MainCourseId`, `RequiredCourseId`, `RequirementTypeId` |
| BE `CourseRequirementTypes` | `Id`, `Name` |

Trong [DataResource.cs](../course-registration/CourseRegistration.Application/DataResource/DataResource.cs),
`GetProgramCoursesAsync` lọc `tmKhungCT.MaKhung = @ProgramId`, lấy học kỳ bằng `ISNULL(Hocky, Kyhoc)`.
`GetProgramRequirementsAsync` lọc `tmHocphanDK.MaKhung = @ProgramId` và ánh xạ `RequirementTypeId = LoaiDK + 1`.
Trong [ModelSeedData.cs](../course-registration/CourseRegistration.Data/Extensions/ModelSeedData.cs),
loại 1 là học trước, loại 2 là tiên quyết, loại 3 là song hành, loại 4 là phụ trợ.

