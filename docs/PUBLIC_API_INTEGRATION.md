# API public Course Registration và TKB

Module `src/modules/public` cung cấp **39 route GET**, không yêu cầu đăng nhập, dưới `/api/public`.
Dữ liệu được lấy qua HTTP từ hai BE đã chọn:

| Nguồn | Base URL mặc định | Route trên backend này |
| --- | --- | --- |
| Course Registration | `https://dangkytinchi.dut.udn.vn` | `/api/public/course-registration/*` |
| TKB | `https://timetable.dut.udn.vn` | `/api/public/tkb/*` |

Luồng xử lý: `route → controller → service → HTTP client → BE nguồn`.
Module này không truy vấn SQL Server và không cần token SSO. Các tên bảng/cột của BE nguồn đã được ghi trong
[bản audit](API_DATA_SOURCE_AUDIT.md) và [danh sách cột](API_DATABASE_COLUMNS.md).

Danh sách CTĐT theo khoa và khung đầy đủ đã có thêm hai route đọc SQL trong module `curriculum`:
`GET /api/public/academic-programs?facultyId=102` và
`GET /api/public/academic-programs/:programId/curriculum`.
Xem [API khung CTĐT](CURRICULUM_API.md) để lấy học phần, học phần thay thế và các điều kiện.

## Cấu hình và chạy

Yêu cầu Node.js 22 trở lên. Thêm các biến sau vào `.env` nếu cần thay đổi mặc định:

```dotenv
COURSE_REGISTRATION_API_BASE_URL=https://dangkytinchi.dut.udn.vn
TKB_API_BASE_URL=https://timetable.dut.udn.vn
PUBLIC_API_TIMEOUT_MS=8000
PUBLIC_API_MAX_RESPONSE_BYTES=5242880
```

Base URL là gốc dịch vụ trước `/api/...`. Có thể chứa prefix triển khai, ví dụ
`https://example.com/backend`; khi đó route nguồn là `/backend/api/Faculty`.
URL phải dùng HTTP(S), không chứa username, password, query hoặc fragment.
Timeout áp dụng cho cả kết nối và đọc body, cho phép từ 100 đến 60000 ms.
Giới hạn body cho phép từ 1024 đến 20971520 byte, mặc định 5 MiB.

```bash
npm install
npm run dev
```

Server mặc định chạy tại `http://localhost:3003`. Ví dụ:

```http
GET http://localhost:3003/api/public/course-registration/faculties
GET http://localhost:3003/api/public/course-registration/academic-programs/paged?pageIndex=1&pageSize=20
GET http://localhost:3003/api/public/course-registration/settings/current-semester-code
GET http://localhost:3003/api/public/course-registration/course-sections?academicYearCode=2610&facultyId=102
GET http://localhost:3003/api/public/tkb/schedules?lecturerId=42&academicYear=2026-2027&semester=1&onlyScheduled=true
```

`2610`, `102` và `42` chỉ là giá trị ví dụ. Lấy mã học kỳ đang dùng qua
`settings/current-semester-code`, ID qua route danh mục tương ứng.

## Course Registration: 16 route

Thêm prefix **`/api/public/course-registration`** vào cột route của backend này.
Tất cả route trong bảng dùng phương thức **GET**. Ký hiệu `*` là query bắt buộc.

| Route backend này | Route nguồn | Query hỗ trợ | Dữ liệu |
| --- | --- | --- | --- |
| `/faculties` | `/api/Faculties` | — | Danh sách khoa |
| `/faculties/:facultyId` | `/api/Faculties/:facultyId` | — | Chi tiết khoa |
| `/majors` | `/api/Majors` | — | Danh sách ngành |
| `/majors/:majorId` | `/api/Majors/:majorId` | — | Chi tiết ngành |
| `/lecturers` | `/api/Lecturers` | `facultyId` | Danh sách giảng viên |
| `/classes` | `/api/Classes` | — | Danh sách lớp sinh hoạt |
| `/academic-programs` | `/api/AcademicPrograms` | — | Danh sách chương trình đào tạo |
| `/academic-programs/paged` | `/api/AcademicPrograms/paged` | `facultyId`, `educationLevel`, `keyword`, `pageIndex`, `pageSize`, `sortBy`, `sortDescending` | Chương trình đào tạo phân trang |
| `/academic-programs/:programId` | `/api/AcademicPrograms/:programId` | — | Thông tin chương trình, chưa gồm danh sách học phần trong khung |
| `/semesters` | `/api/Semesters` | — | Danh sách học kỳ |
| `/semesters/:semesterId` | `/api/Semesters/:semesterId` | — | Chi tiết học kỳ |
| `/course-sections` | `/api/CourseSections` | `academicYearCode`*, `facultyId` | Lớp học phần của học kỳ |
| `/registration-phases/current-semester` | `/api/RegistrationPhase/current-semester` | `facultyId`, `cohort` | Các đợt đăng ký học kỳ hiện tại |
| `/settings/registration-phase` | `/api/Settings/courseRegistrationPhase` | — | Phạm vi đăng ký hiện tại |
| `/settings/title` | `/api/Settings/title` | — | Tiêu đề hệ thống đăng ký |
| `/settings/current-semester-code` | `/api/StudentGrades/currentSemesterCode` | — | Mã học kỳ hiện tại |

ID Course Registration là chuỗi; số `0` ở đầu được giữ nguyên.
`academicYearCode` có đúng 4 chữ số, ví dụ `2610`.
Route phân trang mặc định `pageIndex=1`, `pageSize=20`; `pageSize` tối đa 100.

Mapping dựa trên controller trong
[`CourseRegistration.BackendAPI`](../course-registration/CourseRegistration.BackendAPI/Controllers/).
Tên file `ProgramsController.cs` chứa class **`AcademicProgramsController`**;
file `SemesterController.cs` chứa class **`SemestersController`**, nên route nguồn theo tên class.

Khung chương trình chung trên `sv.dut.udn.vn/G_ListCTDT.aspx` được tải qua endpoint AJAX HTML public riêng;
xem [request nguồn, đối chiếu ảnh và bảng/cột liên quan](PUBLIC_CURRICULUM_SOURCE.md).
Nguồn này chưa được tích hợp thành API JSON trong `src`.

## TKB: 23 route

Thêm prefix **`/api/public/tkb`** vào cột route của backend này.
Tất cả route trong bảng dùng phương thức **GET**. Ký hiệu `*` là query bắt buộc.

| Route backend này | Route nguồn | Query hỗ trợ | Dữ liệu |
| --- | --- | --- | --- |
| `/faculties` | `/api/Faculty` | `keyword`, `page`, `pageSize` | Danh sách khoa |
| `/faculties/:facultyId` | `/api/Faculty/:facultyId` | — | Chi tiết khoa |
| `/lecturers` | `/api/Lecturer` | `lecturerId`, `keyword`, `page`, `pageSize` | Giảng viên phân trang |
| `/course-sections` | `/api/CourseSection` | `keyword`, `lecturerId`, `facultyId`, `page`, `pageSize` | Lớp học phần phân trang |
| `/course-sections/:courseId` | `/api/CourseSection/:courseId` | — | Chi tiết lớp học phần |
| `/classrooms` | `/api/Classroom` | `roomId`, `keyword`, `page`, `pageSize` | Phòng học phân trang |
| `/classrooms/building` | `/api/Classroom/building` | `building`* | Phòng học theo khu |
| `/classrooms/suggest` | `/api/Classroom/suggest` | `building`*, `capacity`* | Gợi ý phòng theo khu và sức chứa |
| `/lookup/course-section-form` | `/api/Lookup/course-section-form` | — | Danh mục dùng cho form lớp học phần |
| `/schedules` | `/api/Schedule` | `lecturerId`, `academicYear`, `semester`, `week`, `onlyScheduled` | Thời khóa biểu |
| `/schedules/semester-stats` | `/api/Schedule/semester-stats` | — | Thống kê TKB theo học kỳ |
| `/schedules/pending-room-assignments` | `/api/Schedule/pending-room-assignments` | `academicYear`*, `semester`* | Lớp đã có tiết nhưng chưa được gán phòng |
| `/schedules/history` | `/api/Schedule/history` | `academicYear`, `semester`, `week` | Lịch sử TKB |
| `/schedules/batch/:batchId` | `/api/Schedule/batch/:batchId` | — | TKB theo batch |
| `/schedules/lecturer/:lecturerId` | `/api/Schedule/lecturer/:lecturerId` | `academicYear`, `semester`, `week`, `onlyScheduled` | TKB của giảng viên |
| `/schedules/:timetableId/room-candidates` | `/api/Schedule/:timetableId/room-candidates` | — | Phòng có thể gán cho một lịch học |
| `/schedules/:timetableId` | `/api/Schedule/:timetableId` | — | TKB theo ID |
| `/dashboard/stats` | `/api/Dashboard/stats` | — | Thống kê tổng quan |
| `/dashboard/rooms-by-building` | `/api/Dashboard/rooms-by-building` | — | Phòng học theo khu |
| `/dashboard/course-sections-by-building` | `/api/Dashboard/course-sections-by-building` | — | Lớp học phần theo khu |
| `/dashboard/room-usage-by-day` | `/api/Dashboard/room-usage-by-day` | `semester`, `academicYear` | Sử dụng phòng theo ngày |
| `/dashboard/schedule-conflicts` | `/api/Dashboard/schedule-conflicts` | `semester`, `academicYear` | Xung đột lịch học |
| `/system-config` | `/api/SystemConfig` | — | Cấu hình nghiệp vụ xếp lịch |

Mapping dựa trên [`tkb-be/Controllers`](../tkb-be/Controllers/).

- `facultyId`, `lecturerId`, `timetableId` là số nguyên dương, tối đa 2147483647.
- `courseId`, `roomId`, `building` là chuỗi ID. `batchId` phải là UUID.
- `lecturers`, `course-sections`, `classrooms` mặc định `page=1`, `pageSize=20`.
  Route `faculties` chỉ phân trang khi có `page`; không truyền `page` trả toàn bộ khoa theo hành vi BE nguồn.
- `pageSize` tối đa 100. `capacity` từ 1 đến 10000.
- `semester` chấp nhận `1`, `2`, `3`, `10`, `20`, `21`.
  BE Schedule quy đổi `10 → 1`, `20 → 2`, `21 → 3` trong các action có `NormalizeSemesterQuery`;
  backend này chuyển tiếp giá trị hợp lệ để giữ hành vi từng action nguồn.
- `academicYear` là chuỗi tối đa 32 ký tự, ví dụ `2026-2027`. `week` giữ định dạng BE nguồn, ví dụ `1-5;7-9`.
- Khi bỏ `onlyScheduled`, BE nguồn dùng `false` ở `/schedules` và `true` ở `/schedules/lecturer/:lecturerId`.

## Response và validation

Response thành công thống nhất với các module hiện tại:

```json
{
  "success": true,
  "data": [
    { "id": "102", "facultyName": "Công nghệ thông tin" }
  ]
}
```

Module nhận cả JSON trực tiếp và envelope `{isSuccess,data}`, `{success,data}`,
hoặc phiên bản PascalCase. Envelope được gỡ một lần; `data` giữ cấu trúc và tên trường của BE nguồn,
gồm cả object phân trang (`items`, `totalRecords`, ...). Các trường ngoài `data` của envelope nguồn,
như `message`, `count`, `lecturerId`, không được đưa vào response mới. `data` có thể là chuỗi,
ví dụ mã học kỳ hiện tại.

Query ngoài danh sách, query lặp, giá trị rỗng, tham số bắt buộc bị thiếu và ID sai định dạng trả `400`
trước khi gọi nguồn. Query dạng boolean chỉ chấp nhận `true`/`false`, không phân biệt hoa thường.
Chuỗi tìm kiếm hỗ trợ Unicode, tối đa 200 ký tự; chuỗi ID chỉ nhận chữ/số ASCII và các ký tự `._-`,
tối đa 80 ký tự, không chấp nhận `.` hoặc `..`.

HTTP client dùng GET, yêu cầu JSON, không chuyển tiếp `Authorization` hoặc `Cookie` của người gọi
và không tự theo redirect. Danh sách route cố định trong
[`public.endpoints.js`](../src/modules/public/public.endpoints.js); người gọi không thể chọn URL upstream.
Response thành công có `Cache-Control: no-store`.

| HTTP trả về | Trường hợp |
| --- | --- |
| `400` | Tham số không hợp lệ hoặc nguồn từ chối request với `400` |
| `404` | Route không tồn tại hoặc tài nguyên nguồn trả `404` |
| `502` | Nguồn yêu cầu đăng nhập, redirect, trả HTML/JSON sai, envelope thất bại/thiếu data hoặc body vượt giới hạn |
| `503` | Không kết nối được, thiếu cấu hình nguồn, nguồn trả `429` hoặc `5xx` |
| `504` | Quá timeout |

Lỗi upstream chỉ cung cấp thông báo chung và `details.source`, kèm `details.upstreamStatus`
khi lỗi là HTTP status; không trả nguyên error body của dịch vụ nguồn. Ví dụ:

```json
{
  "success": false,
  "message": "Upstream resource was not found.",
  "details": { "source": "tkb", "upstreamStatus": 404 }
}
```

## Phạm vi triển khai

Các route GET ở trên phục vụ danh mục đào tạo, đợt đăng ký, phòng học, lịch học và thống kê.
Không mount các action ghi/xóa/upload/reset của BE nguồn, các route tài khoản, job xếp lịch,
các action stub trả `"value"`, hoặc dữ liệu cá nhân cần SSO như hồ sơ sinh viên, điểm và lớp đã đăng ký.
PLO/CLO không được gọi trong module này vì các route dữ liệu cần access token.

## Kiểm chứng

Ngày kiểm tra: **08/10/2026**.

- `npm test`: 9 test đạt, dùng HTTP server cục bộ; không truy vấn SQL Server hoặc phụ thuộc mạng trường.
  Kiểm tra envelope, mapping, phân trang, Unicode, thứ tự route, validation, cách ly cookie/token,
  lỗi HTTP, timeout khi đọc body, giới hạn body và prefix triển khai.
- Gọi qua Express module tới địa chỉ Course Registration: cả **16 route trả `200`**;
  ID chi tiết và mã học kỳ lấy từ response danh mục/cấu hình.
- `https://timetable.dut.udn.vn/api/Faculty` hiện trả **`404`**; route public tương ứng trả lỗi nguồn `404`.
  Root và Swagger của địa chỉ này cũng trả `404` lúc kiểm tra. Các route TKB đã được dựng theo source và
  kiểm thử bằng dữ liệu giả lập, nhưng chưa xác minh được dữ liệu thật từ BE TKB.
  Các route này thuộc source `tkb-be`; phản hồi `404` không có nghĩa toàn bộ dịch vụ trên domain TKB không hoạt động.
  Khi có deployment phù hợp với source `tkb-be`, cập nhật `TKB_API_BASE_URL` rồi khởi động lại server.

## TKB cá nhân trong `d_dut`: cần SSO

Kiểm tra bổ sung ngày **08/10/2026**: ứng dụng `d_dut` dùng cùng domain
`https://timetable.dut.udn.vn` nhưng gọi bộ route **`/api/Timetable/...`**,
khác bộ **`/api/Schedule/...`** của source `tkb-be`.
[`schedule_service.dart`](../d_dut/lib/features/schedule/data/data_sources/remote_data_source/schedule_service.dart)
gửi `Authorization: Bearer <authToken>` trong các request lịch cá nhân.

| Route nguồn (GET) | Query | Dữ liệu theo client |
| --- | --- | --- |
| `/api/Timetable/GetListSemesters` | — | Danh sách học kỳ |
| `/api/Timetable/GetListStudentTimetablesBySemester` | `idSemester` | Học phần, giảng viên, tín chỉ, lịch học và lịch thi của sinh viên theo học kỳ |
| `/api/Timetable/GetListTeacherTimetablesBySemester` | `idSemester` | Lịch giảng viên theo học kỳ |
| `/api/Timetable/GetListStudentTimetablesByDate` | `date=yyyy-MM-dd` | Lịch học/thi của sinh viên theo ngày |
| `/api/Timetable/GetListTeacherTimetablesByDate` | `date=yyyy-MM-dd` | Lịch giảng viên theo ngày |
| `/api/Timetable/GetStudentCalendarEvents` | `month`, `year` | Ngày có sự kiện học/thi của sinh viên trong tháng |
| `/api/Timetable/GetTeacherCalendarEvents` | `month`, `year` | Ngày có sự kiện của giảng viên trong tháng |
| `/api/Timetable/GetWeekSemester` | `date=yyyy-MM-dd` | `idSemester`, `noWeek` ứng với ngày |

Theo [`auth_bloc.dart`](../d_dut/lib/features/auth/bloc/auth_bloc.dart) và
[`auth_service.dart`](../d_dut/lib/features/auth/data/data_sources/remote_data_source/auth_service.dart),
luồng Microsoft là: đăng nhập Microsoft → lấy Microsoft access token → gọi
`GET https://sso.dut.udn.vn/api/microsoft/me` với token đó → nhận `accessToken` từ SSO →
lưu token SSO và dùng để gọi TKB. Client cũng hỗ trợ đăng nhập tài khoản bằng
`POST https://sso.dut.udn.vn/api/login` với `{username,password}`, nhận cùng trường `accessToken`.
JWT tự phát hành bởi BE hiện tại chưa được xác nhận dùng được với TKB; tích hợp cần token SSO của từng người dùng.

Gọi không kèm token: `GetListSemesters` và `GetListStudentTimetablesByDate?date=2026-10-08`
đều trả **`401`**, xác nhận hai route này yêu cầu xác thực ở deployment hiện tại.
Chưa kiểm chứng response với token thật. Client đọc envelope có `statusCode`, `data`, `message`.
Model học kỳ có `idSemester`, `noSemester`, `startYear`, `endYear`;
không mặc định `idSemester` giống mã `academicYearCode` của Course Registration.

Các route `/api/Timetable/...` **chưa được mount trong `src`**; cần module có đăng nhập riêng khi tích hợp.
Không thêm chúng vào module public hiện tại. `d_dut` chỉ cung cấp code client nên các tên trường JSON
đọc được ở đây chưa chứng minh tên bảng/cột database của BE nguồn.

Ngoài ra,
[`weekly_schedule_repository.dart`](../d_dut/lib/features/weekly_schedule/data/weekly_schedule_repository.dart)
gọi URL từ `WEEKLY_SCHEDULE_API_BASE` với query `email`, `date` và chỉ gửi `Accept: application/json`.
Source client này không gửi Bearer token, nhưng chưa có URL triển khai được xác minh để kết luận API đó là public.

