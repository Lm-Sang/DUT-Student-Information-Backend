# Phân loại API và nguồn dữ liệu: Course Registration, PLO/CLO, TKB

Đối chiếu source trong workspace ngày **08/10/2026**. Đã đọc controller, cấu hình authentication/authorization, middleware, service, DbContext, entity/configuration và schema snapshot. Đây là kết quả đọc code; chưa gọi hệ thống đang triển khai hoặc kết nối database.

Hai tài liệu tra cứu đi kèm:

- [Danh mục 616 action HTTP](API_ENDPOINT_CATALOG.md): method, route, quyền, action/service và các bảng lần theo được.
- [Danh mục bảng/cột](API_DATABASE_COLUMNS.md): 28 bảng Course Registration, 38 bảng PLO/CLO tính cả bảng join, 10 bảng TKB, 13 bảng SQL Server nguồn của PLO/CLO và 3 bảng SQL nguồn được DataResource của Course Registration truy vấn.

## 1. Kết luận về các loại API

Các loại sau có thể chồng lên nhau: một route do BE tự triển khai vẫn có thể public; một route đổi token SSO vẫn là code của BE. Vì vậy cần xét riêng **nơi xử lý**, **cách xác thực** và **nguồn dữ liệu**.

| Loại | Ý nghĩa trong ba dự án | Ví dụ |
|---|---|---|
| BE nghiệp vụ | Controller/service thực hiện logic, đọc/ghi DB, cache, queue hoặc xuất file | GET `/api/CourseSections/me`, GET `/api/results/my-plo-scores`, GET `/api/Schedule` |
| Public theo code | Không bắt buộc JWT qua attribute; có thể vẫn kiểm tra credential/token/cookie trong action | POST `/api/accounts/login`, GET `/api/CourseSections`, GET `/api/Schedule` |
| SSO/token exchange | Nhận danh tính từ SSO/Microsoft, đối chiếu tài khoản nội bộ rồi phát JWT riêng | POST `/api/microsoft/course-registration-token`, POST `/api/accounts/login/microsoft`, POST `/api/Auth/login-sso` |
| API tích hợp | BE mở route cho hệ thống khác; có API key hoặc quyền tích hợp | POST `/api/classes/external`, GET `/api/students/external/{studentCode}/scores` |
| API bên ngoài được gọi | BE redirect hoặc gọi một dịch vụ độc lập | Cổng SSO của trường, CA DUT |
| SQL nguồn | Đọc trực tiếp DB đào tạo để đồng bộ vào DB ứng dụng | SourceDbContext, DataResource; không đi qua SSO |
| Stub | Có route nhưng action rỗng hoặc chỉ trả giá trị mẫu | POST `/api/Students` trong Course Registration BackendAPI |

**Không thấy ba BE lấy hồ sơ/điểm/thời khóa biểu từ một “public API dữ liệu sinh viên” chung của trường.** Code nghiệp vụ chủ yếu truy vấn DB ứng dụng; luồng đồng bộ đọc SQL Server nguồn. Các dịch vụ ngoài xác định được là SSO/Microsoft và CA DUT. Không thấy code ba dự án gọi REST API của nhau.

| Thành phần | Action HTTP | Không có yêu cầu auth qua attribute | Stub action |
|---|---:|---:|---:|
| Course Registration BackendAPI | 116 | 78 | 24 |
| Course Registration AdminAPI | 131 | 4 | 0 |
| Course Registration RegistrationConsumer | 1 | 1 | 0 |
| PLO/CLO | 308 | 4 | 0 |
| TKB | 60 | 57 | 0 |
| Tổng | 616 | 144 | 24 |

Số 78 của Course BackendAPI gồm route SSO, route mẫu và **hai route tự yêu cầu UserId trong action**: GET `/api/StudentGrades/me`, GET `/api/Settings/demand-notes`. Vì vậy không được diễn giải toàn bộ 144 route thành “ai cũng đọc được dữ liệu”. Không tính Swagger/SignalR trong 616 action.

## 2. Course Registration

### 2.1. BE và database

BackendAPI phục vụ sinh viên, viewer và một số route quản trị/import; AdminAPI có prefix `/api/admin`. Cả hai dùng `CourseRegistrationDBContext` với **PostgreSQL**. Redis lưu cache, phiên đăng nhập và trạng thái chờ; Kafka chuyển lệnh đăng ký sang RegistrationConsumer, chuyển log sang LogConsumer. [Backend Program](../course-registration/CourseRegistration.BackendAPI/Program.cs#L42), [Admin Program](../course-registration/CourseRegistration.AdminAPI/Program.cs#L45).

Các route nghiệp vụ có JWT dùng `[Authorize]`, role `Viewer,Admin`, hoặc policy `ActiveStudent`. Policy này kiểm tra trạng thái sinh viên. `ActiveTokenMiddleware` đối chiếu Redis `ActiveToken:{role}:{identifier}` **khi request đã được xác thực**; middleware không tự chặn toàn bộ request anonymous. [Middleware](../course-registration/CourseRegistration.BackendAPI/Middlewares/ActiveTokenMiddleware.cs#L50).

### 2.2. API SSO: cổng của trường → JWT Course Registration

| API của BE | Token/tham số | Xử lý và bảng/cột chính |
|---|---|---|
| GET `/api/microsoft/signin` | Không cần JWT ứng dụng | Redirect đến `https://sso.dev.dut.navia.io.vn/microsoft/login`, kèm callbackUrl/response_mode |
| GET `/api/microsoft/callback` | Query `accessToken` | Xác minh chữ ký token bằng cấu hình `JwtSettings:SSOSecretKey`, đọc `unique_name`; tìm `Users.MicrosoftId`, join `Users.UserId = Students.Id` |
| POST `/api/microsoft/course-registration-token` | Query `ssoToken` | Cùng luồng xác minh và tìm sinh viên; phát JWT ký bằng `JwtSettings:SecretKey`, lưu phiên Redis |
| GET `/api/microsoft/logout` | Có thể dùng JWT hiện tại để xóa phiên | Redirect đến `/microsoft/logout` của cổng SSO |
| GET `/api/microsoft/logout-confirm` | Không cần JWT | Trả thông báo logout |
| GET `/api/admin/Auth/microsoft/login` | Không cần JWT ứng dụng | Redirect đến cổng SSO; callback cấu hình bởi `SSOScheme:SSOCallbackUrl` |
| GET `/api/admin/Auth/microsoft/callback` | Query `accessToken`, tùy chọn `linkState` | Xác minh token, đọc `unique_name`; tra `Admins.MicrosoftId`, `Lecturers.Id/MicrosoftId`, `AcademicAffairs.MicrosoftId`; có nhánh liên kết tài khoản giảng viên |
| GET `/api/admin/Auth/microsoft/logout` | Không cần JWT | Trả URL logout lấy từ `SSOScheme:SSOLogoutUrl` |

Nguồn: [MicrosoftController](../course-registration/CourseRegistration.BackendAPI/Controllers/MicrosoftController.cs#L31), [UserService](../course-registration/CourseRegistration.Application/User/UserService.cs#L31), [Admin AuthController](../course-registration/CourseRegistration.AdminAPI/Controllers/AuthController.cs#L95).

SSO cấp danh tính; **hồ sơ sinh viên và quyền nằm trong DB Course Registration**. JWT mới có các claim như `student_id`, `full_name`, role. Bảng `Users` lưu `UserId`, `MicrosoftId`, `PasswordHash`, `IsDeleted`; không có bảng SSO riêng lưu điểm hoặc lịch học.

### 2.3. API nghiệp vụ và cột sử dụng chính

| API | Bảng và các cột phục vụ nghiệp vụ |
|---|---|
| GET `/api/Account/profile`, GET `/api/Students/me` | `Students`: Id, StudentCardNumber, FullName, ClassId, ProgramId, AcademicProgramId, Gender, EnrollmentDate, MaxCreditsAllowed, IsHighQuality, IsWebsiteLocked, IsSuspended, IsOverdue, IsProfileComplete; `Users`: UserId, MicrosoftId, PasswordHash; `Classes`: Id, Name, ScheduleGroup; `StudentCreditLimits`: StudentId, AcademicYearCode, IsCreditLoadRestricted, MaxCredits |
| GET `/api/Courses` | `Courses`: Id, CourseName, Credits và các loại tín chỉ; `CourseInPrograms`: CourseId, AcademicProgramId, Order, Semester, IsElectiveCourse, IsPreProjectRequired, IsProjectPrerequisite; `CourseRequirements`: ProgramId, MainCourseId, RequiredCourseId, RequirementTypeId; join chương trình/khoa/ngành |
| GET `/api/CourseSections?facultyId=...&academicYearCode=...` | `CourseSections`: Id, FacultyId, AcademicYearCode, CourseName, LecturerId, Schedule, StudyWeeks, ScheduleGroup, Capacity, RegisteredCount, ReservedCapacity, ReservedCount; join `Courses`, `Lecturers`, `StudentInCourseSections` |
| GET `/api/CourseSections/available` | Thêm trạng thái sinh viên, giới hạn tín chỉ, điều kiện học phần, học phần thay thế, điểm đã có và đợt đăng ký: `Students`, `StudentCreditLimits`, `CourseRequirements`, `AlternativeCourses`, `StudentGrades`, `CourseExemptions`, `RegistrationPhases`, `CourseRegistrationSettings` |
| GET `/api/CourseSections/me`, `/me/full`, `/me/pending` | `StudentInCourseSections`: StudentId, CourseSectionId, AcademicYearCode, RegisteredAt, IsReserved, IsConfirmed, Notes; `CourseSections`: Schedule, StudyWeeks và thông tin lớp; `/pending` còn đọc trạng thái chờ Redis |
| POST `/api/CourseSections/register`, `/register-multiple`, `/unregister`, `/unregister-multiple`, `/reserve`, `/unreserve` | Controller kiểm tra dữ liệu, gửi Kafka; consumer/service thêm/xóa `StudentInCourseSections`, cập nhật `CourseSections.RegisteredCount/ReservedCount` và các cờ IsRegistrationClosed, IsRegistrationDisabled, IsDropDisabled, AllowReserve; kiểm tra điểm, điều kiện, tín chỉ, thời gian đợt đăng ký; ghi log qua consumer riêng |
| GET `/api/StudentGrades/me`, GET `/api/StudentGrades/{studentId}` | `StudentGrades`: SemesterCode, StudentId, CourseId, CourseSectionCode, Score10Scale, LetterGrade, Score4Scale, Retake; gộp `CourseExemptions` và join `Courses` để lấy CourseName/Credits, `CourseSections` để lấy thông tin lớp |
| GET/POST `/api/CourseRegistrationDemand/me`; PUT `/me/{id}/schedule`; DELETE `/me/{id}` | `CourseRegistrationDemands`: Id, StudentId, CourseId, Schedule, SemesterCode, SubmittedAt, IsConfirmed; kiểm tra `Students`, `Courses`, `StudentGrades`, `CourseInPrograms`, cấu hình/đợt đăng ký |
| GET `/api/Settings/title`, `/courseRegistrationPhase`; GET `/api/RegistrationPhase/current-semester` | `CourseRegistrationSettings`: Key, Value; `RegistrationPhases`: SemesterCode, PhaseName, Type, StartTime, EndTime, TargetAudience, Notes, AllowedMajorId, AllowedGroupId, AllowedFacultyId, AllowedCohorts, AllowBackupRegistration |

Các cột trên là cột chính trong chuỗi xử lý, không khẳng định một request cụ thể sẽ chạm mọi bảng. Xem nguồn action/service của từng route trong [catalog](API_ENDPOINT_CATALOG.md).

Thời khóa biểu sinh viên trong dự án này nằm ở **`CourseSections.Schedule`, `CourseSections.StudyWeeks` + đăng ký của sinh viên**; không phải bảng `Timetable` của TKB.

### 2.4. SQL nguồn phục vụ đồng bộ

POST `/api/admin/programs/{id}/sync-courses` yêu cầu role `Admin,AcademicAffairs`. Controller gọi DataResource qua kết nối `DUT_CDS_DB`, đọc trực tiếp:

| Bảng SQL Server | Cột đọc | Cột BE nhận/lưu |
|---|---|---|
| `[DATA_SV2202605111528].[dbo].[tmKhungCT]` | MaHP, MaKhung, STT, HTDA, TQDA, Tuchon, Hocky, Kyhoc | CourseInPrograms.CourseId, AcademicProgramId, Order, IsPreProjectRequired, IsProjectPrerequisite, IsElectiveCourse, Semester |
| `[DATA_SV2202605111528].[dbo].[tmHocphanDK]` | MaKhung, MaHP, MaHPdk, LoaiDK | CourseRequirements.ProgramId, MainCourseId, RequiredCourseId, RequirementTypeId; LoaiDK được cộng 1 |

DataResource còn có `GetStudentByIdAsync`, đọc `tmDiemkyhoc.IDCode, MaHS, MaHP, MalopHP, Diem, DiemC, Diem4`; **chưa thấy call site** của hàm này trong ba dự án. API xem điểm hiện tại đọc `StudentGrades`/`CourseExemptions`, không tự gọi hàm SQL này mỗi request. [SyncCourses](../course-registration/CourseRegistration.AdminAPI/Controllers/ProgramsController.cs#L72), [DataResource](../course-registration/CourseRegistration.Application/DataResource/DataResource.cs#L22).

### 2.5. Public thực tế và các route chưa hoàn chỉnh

Các GET danh mục như `/api/Faculties`, `/api/Majors`, `/api/Lecturers`, `/api/Classes`, `/api/AcademicPrograms`, `/api/Semesters`, `/api/CourseSections` không yêu cầu auth qua attribute. Một số route thay đổi dữ liệu cũng chưa gắn quyền, ví dụ POST `/api/Courses/upload`, POST `/api/Classes/upload`, POST `/api/Faculties`, POST `/api/Settings/yearCode`.

Hai route mở thực hiện thay đổi mật khẩu: POST `/api/Account/admin/reset-pass/{userId}` và GET `/api/Account/temp-setup-lecturer-passwords` (route thứ hai có AllowAnonymous). Đây là hành vi hiện tại của code, không nên dùng tên “admin” trong URL để suy ra đã được bảo vệ. [AccountController](../course-registration/CourseRegistration.BackendAPI/Controllers/AccountController.cs#L265).

24 action là stub trong Classes, Courses, CourseSections, Lecturers, AcademicPrograms, StudentGrades, Students. Ví dụ GET `/api/Classes/{id}` chỉ trả `"value"`; POST/PUT/DELETE `/api/Students` tương ứng là hàm rỗng. Các hàm service khác còn có NotImplementedException nhưng không nhất thiết được route hiện tại gọi. [ClassesController](../course-registration/CourseRegistration.BackendAPI/Controllers/ClassesController.cs#L30).

## 3. PLO/CLO

### 3.1. BE, SSO và quyền

Database ứng dụng hỗ trợ **PostgreSQL hoặc SQL Server theo DbProvider**; `SourceDbContext` luôn là SQL Server để đọc DB đào tạo. [Program](../plo-clo-backend/Program.cs#L85).

| API/cơ chế | Xác thực | Bảng/cột |
|---|---|---|
| POST `/api/accounts/login` | Username/password nội bộ → CustomJWT | Accounts.Username, Password, IsActive, RoleId; Roles và quyền |
| POST `/api/accounts/login/microsoft` | `[Authorize(Policy = "Microsoft")]`; bearer Microsoft được middleware xác minh theo Authority/Audience; đọc preferred_username/upn/email | Accounts.MicrosoftEmail, IsActive, Id, Username, RoleId; trả JWT riêng cho từng account nội bộ khớp email |
| POST `/api/accounts/session` | CustomJWT | RefreshTokens: AccountId, SlotIndex, TokenHash, ExpiresAt, RevokedAt, ReplacedByTokenHash, CreatedAt |
| POST `/api/accounts/refresh` | Không cần access JWT; cần refresh cookie hợp lệ theo slot | RefreshTokens + Accounts; rotate refresh token và phát CustomJWT mới |
| POST `/api/accounts/logout`, GET `/api/accounts/sessions` | Không cần access JWT; xử lý cookie `rt_{index}` | RefreshTokens và tài khoản liên quan |
| API nghiệp vụ `[Authorize]`/`[HasPermission]` | CustomJWT + kiểm tra quyền/phạm vi bản ghi | Accounts, Roles, RolePermissions; permission catalogue ở Permissions |
| API `external` | Thường `CustomJWT,ApiKey` + Permissions.Integration.* | Header `X-Api-Key` đối chiếu cấu hình ApiKey; identity là account `system.integration`, quyền lấy từ DB |

Nguồn: [AccountController](../plo-clo-backend/Controllers/AccountController.cs#L166), [AccountService](../plo-clo-backend/Services/AccountService.cs#L273), [auth schemes](../plo-clo-backend/Program.cs#L264), [ApiKey handler](../plo-clo-backend/Auth/ApiKeyAuthenticationHandler.cs#L54), [CustomJwtBearerEvents](../plo-clo-backend/Authorization/CustomJwtBearerEvents.cs#L21).

Khác Course Registration, PLO/CLO cấu hình **Microsoft Entra trực tiếp** bằng AzureAd.Instance/TenantId/ClientId; controller không redirect đến cổng SSO của trường. Scheme `DDUT_JWT` được đăng ký nhưng chưa thấy action controller yêu cầu scheme/policy này. Không được giả định JWT Course Registration tự dùng được cho PLO/CLO.

### 3.2. API nghiệp vụ và bảng/cột chính

| API/nhóm route | Bảng/cột |
|---|---|
| `/api/students`, GET `/api/students/me/result-summary` | Students.Id, Code, Name, EnrollmentYear, ProgrammeId, CohortId, AccountId, Status; summary đọc Classes, ClassStudent, Curriculums, Exams, Questions, Results để tính kết quả |
| `/api/programmes`, `/api/courses` | Programmes.Code/Name/MajorId/AccountId; Courses.Code/Name/Credits/FacultyId/DependentCourseId; Curriculums.CourseId/ProgrammeId/AcademicSemester/IsCore |
| `/api/classes` | Classes.Id, Code, Name, CourseId, SemesterId, TeacherId, Teacher2Id, ParentExamSessionId, IsCore, IsDoctoral, IsConfirmed; ClassStudent.ClassesId/StudentsId |
| `/api/clos` | CLOs.Id, Name, Description, CourseId, SemesterId; CLOPLO.CLOsId/PLOsId; CLOQuestion.CLOsId/QuestionsId (snapshot có thêm shadow QuestionId) |
| `/api/plos`, `/api/course-plos` | PLOs.Id, Name, Description, ProgrammeId; CoursePLO.CourseId, PLOId, Weight |
| `/api/exams`, `/api/questions` | Exams.Id, Type, Category, Weight, ClassId, ParentExamSessionId, các hạn nhập/sửa điểm, ConfirmedAt, IsQuestionLocked, IsScoreLocked; Questions.Id, ExamId, Name, Scale, Weight |
| GET/POST `/api/results`; PUT `/api/results/{id}`, `/upsert`, `/bulk`; POST `/api/results/confirm` | Results.Id, StudentId, QuestionId, Score; các bảng câu hỏi, thành phần thi, mapping CLO/PLO và bảng điểm tổng hợp tùy thao tác |
| GET `/api/results/my-plo-scores` | Students.AccountId → Students.Id; StudentPLOs.StudentId, PLOId, Score, CalculatedAt, IsActive |
| GET `/api/results/my-programme-completion` | Students.AccountId → Students.Id; StudentProgrammeCompletions.StudentId, ProgrammeId, IsCompleted, FailureReasons, PloScoreThreshold, CalculatedAt, IsActive |
| `/api/parent-exam-sessions`, `/api/child-exam-sessions`, `/api/student-exams` | ParentExamSessions, ChildExamSessions; StudentChildExamSessions.StudentId/ChildExamSessionId/AnonymousMarkingCode; StudentExam.StudentId/ExamId/Score/Note |
| `/api/corrected-results`, `/api/score-appeals` | CorrectedResults, ScoreAppeals, AppealedResults; liên kết StudentId/QuestionId, điểm sửa, người xử lý, trạng thái và thời điểm xác nhận tùy bảng |
| `/api/pdf-export`, `/api/word-export`, `/api/export` | Các bảng điểm/câu hỏi/CLO/PLO/StudentExam phục vụ xuất; SignedScoreSheets phục vụ trạng thái ký số; không phải mọi route export đều gọi CA |

`Semesters.Code` là property **NotMapped**, tính từ Name và Year. Không có cột Code trong bảng Semesters của PLO/CLO. Một số quan hệ many-to-many có bảng vật lý riêng và shadow columns; danh mục cột đi kèm giữ tên trong snapshot, không dùng tên DTO thay tên SQL.

### 3.3. API tích hợp `external`

| Method/route | Quyền | Bảng chính |
|---|---|---|
| POST `/api/courses/external` | Integration.SyncCourses | Courses + Faculties |
| PUT `/api/courses/external/{courseCode}` | Integration.SyncCourses | Courses + Faculties |
| POST `/api/classes/external` | Integration.SyncClasses | Classes + Courses/Semesters/Teachers |
| PUT `/api/classes/external/{classCode}/students` | Integration.SyncClasses | Classes, Students, ClassStudent |
| GET `/api/classes/external/{classCode}/grade-composition` | Integration.ReadScores | Classes, Exams |
| GET `/api/classes/external/{classCode}/scores` | Integration.ReadScores | Classes, Exams, StudentExam |
| PUT `/api/classes/external/{classCode}/grade-composition` | Integration.SyncClasses | Classes, Exams, Questions |
| GET `/api/students/external/{studentCode}/scores` | Integration.ReadScores | Students, ClassStudent, Classes, Exams, StudentExam |
| POST `/api/teachers/external` | Integration.SyncTeachers | Teachers, Accounts, Roles |

Các route trên chấp nhận CustomJWT/ApiKey, không phải public anonymous. Cột xác thực đầy đủ được ghi theo attribute thực tế trong [catalog](API_ENDPOINT_CATALOG.md).

Một ngoại lệ: GET `/api/courses/external` dùng `[Authorize(AuthenticationSchemes = "ApiKey", Roles = "Admin,AcademicAffairs")]`, khác cơ chế permission của các route external khác. ApiKey handler hiện cấp identity role của account Integration, nên route này có sự lệch quyền với account tích hợp mặc định. [CourseController](../plo-clo-backend/Controllers/CourseController.cs#L37), [ApiKey handler](../plo-clo-backend/Auth/ApiKeyAuthenticationHandler.cs#L113).

### 3.4. SQL nguồn → DB PLO/CLO

Nhóm `/api/data-transfer/*` yêu cầu `Permissions.DataTransfer.Run`. Các resource dưới thường có GET `/{resource}/preview` và POST `/{resource}/transfer` để đọc/áp dụng thay đổi; tên đầy đủ của 48 route nằm trong catalog. Đây là luồng SQL đồng bộ, không phải API qua SSO.

| Resource | Bảng/cột nguồn | Bảng/cột nhận chính |
|---|---|---|
| majors | tmNganh.MaNganh, TenNganh, Kyhieu | Majors.Code, Name, OfficialCode, FacultyId |
| programmes | tmNganh.MaNganh, TenNganh, Kyhieu | Programmes.Code, Name, MajorId |
| courses | tmHocPhan.MaHP, TenHP, SoTC | Courses.Code, Name, Credits; FacultyId được tra theo prefix mã |
| course-dependencies | tmHocPhan_PT.MaHP, MaHPPT | Courses.DependentCourseId |
| curriculums | tmKhungCT.MaKhung, MaHP, Hocky | Curriculums.ProgrammeId, CourseId, AcademicSemester |
| cohorts | tmLop.MaLop, TenLop, MaKhung | Cohorts.Code, Name, ProgrammeId |
| students | tmHoSoSV.MaHS, Hoten, MaLop, MaNganh | Accounts.Username/Name/RoleId và Students.Code/AccountId/CohortId/ProgrammeId |
| semesters | tmKehoach.IDCode | Semesters.Name, Year; Code tính trong C# |
| classes | tmLopHP.MalopHP, TenLopHP, MaGV, LopCotLoi | Classes.Code, Name, CourseId, SemesterId, TeacherId, IsCore |
| class-student | tmDiemkyhoc.MalopHP, MaHS | ClassStudent.ClassesId, StudentsId |
| exams | tmLopHP.MalopHP, CongThucDiem; tmConfig.VarType = 21, VarName, VarString3 | Parse công thức thành Exams.Type/Weight/ClassId; tạo/cập nhật cấu trúc câu hỏi theo logic service |
| exam-deadlines | tmLopHP: QT/GK/CK_HanNhap, _HanDChinh, _GiaHanN | Exams.ScoreEntryDeadline, ScoreCorrectionDeadline, ExtendedScoreEntryDeadline và hạn tương ứng theo thành phần |
| teachers | tmHosoGV.MaHS, Hoten, Email, KhoaPC | Accounts.Username/Name/MicrosoftEmail; Teachers.Code/Name/AccountId/WorkUnitId |
| parent-exam-sessions | tmThiCaHP.MaCaTong | ParentExamSessions.Code, SemesterId, CourseId |
| child-exam-sessions | tmThiCaCT.MaCa, TenCa, NguoiNhap1, CaTong, Phach, Tui | ChildExamSessions.Code, Name, ScoreEntryUserAccountId, ParentExamSessionId, IsAnonymousMarking, AnonymizedBagNumber |
| class-parent-exam-sessions | tmThiCaHP.MaCaTong, LopHP | Classes.ParentExamSessionId |
| student-child-exam-sessions | tmDiemkyhoc.MaCaThi, MaHS, SoPhach; MalopHP dùng lọc kỳ | StudentChildExamSessions.ChildExamSessionId, StudentId, AnonymousMarkingCode |

Nguồn chính: [DataTransferService](../plo-clo-backend/Services/DataTransferService.cs#L28), [SourceDbContext](../plo-clo-backend/Data/SourceDbContext.cs#L17). Tên property C# như `MaHs`, `MalopHp`, `SoTc` được ánh xạ sang cột SQL `MaHS`, `MalopHP`, `SoTC`; bảng/cột đi kèm có cả hai tên khi khác nhau.

Route xuất SQL là **POST `/api/export/scores/sql`**. ScoreSqlExportService tạo file INSERT vào `tmDiemSRMS` với `IDCode, MaHS, MaHP, MalopHP, Diem, DiemC, Diem4, CUSBT, CUSCC, ...`; code không tự thực thi file SQL trên DB nguồn. [ScoreSqlExportService](../plo-clo-backend/Services/ScoreSqlExportService.cs#L207).

### 3.5. API ngoài CA DUT

CA DUT phục vụ chứng thư/chữ ký/bảng điểm PDF, **không phải SSO**. Base URL lấy từ `CaDut` options; các path dưới được ghép vào base URL.

| Method | Path gọi ra ngoài | Công dụng |
|---|---|---|
| POST | `auth/token/` | Lấy token dịch vụ CA |
| GET | `certificates/?user_email=...` | Danh sách chứng thư |
| POST | `certificates/requests/` | Yêu cầu cấp chứng thư |
| GET | `certificates/requests/?user_email=...` | Danh sách yêu cầu |
| GET | `documents/categories/` | Loại tài liệu |
| POST | `documents/` | Upload PDF |
| POST | `signatures/sign/` | Ký tài liệu |
| GET | `documents/{documentId}/view-file/` | Tải PDF đã ký |
| GET | `signatures/user-signatures/external/?email=...` | Mẫu chữ ký |

Phía BE, các route như POST `/api/pdf-export/drafts/{draftId:guid}/sign`, POST `/api/pdf-export/score-sheet/{classId}/sign`, GET `/api/pdf-export/score-sheet/{classId}/signed/file` gọi service ký số. Metadata lưu ở SignedScoreSheets; nội dung tài liệu lưu/đọc qua CA. [CaDutClient](../plo-clo-backend/Services/CaSignature/CaDutClient.cs#L21), [token provider](../plo-clo-backend/Services/CaSignature/CaDutTokenProvider.cs#L109), [ExportPdfController](../plo-clo-backend/Controllers/ExportPdfController.cs#L108).

## 4. TKB

### 4.1. BE và SSO

TKB dùng **SQL Server**, SmartScheduleContext, Redis cache và Google OR-Tools để xếp lịch. Các API danh mục/xếp lịch xử lý tại BE, không gọi SSO để lấy dữ liệu lịch.

- POST `/api/Auth/login`: tài khoản/mật khẩu nội bộ → JWT TKB.
- POST `/api/Auth/login-sso`: nhận body Token, dùng `ReadJwtToken`, đọc preferred_username/email/upn; tìm Account.MicrosoftEmail, hoặc Lecturer.MicrosoftEmail → Lecturer.AccountID; kiểm tra Account.IsActive và Account_Role/Role rồi phát JWT TKB.
- GET `/api/Auth/profile`, PUT `/api/Auth/change-password`, POST `/api/Auth/select-role`: ba route duy nhất có `[Authorize]`.

**LoginSso hiện chỉ decode JWT, không ValidateToken/chữ ký/issuer/audience/lifetime.** Cấu hình JwtBearer trong Program chỉ xác minh JWT TKB khi request đi qua auth; không tự xác minh token truyền trong body LoginSso. Không thấy controller/backend này redirect tới cổng SSO hoặc gọi Microsoft API để xác minh body token. [AuthController](../tkb-be/Controllers/AuthController.cs#L53), [Program](../tkb-be/Program.cs#L88).

### 4.2. API và bảng/cột

| API/nhóm | Bảng/cột chính |
|---|---|
| `/api/Account`, GET `/api/Account/roles` | Account.AccountID, Username, Password, MicrosoftEmail, IsActive; Account_Role.AccountID/RoleID; Role.RoleID/RoleName/Description; join Lecturer để lấy giảng viên liên kết |
| `/api/Lecturer` | Lecturer.LecturerID, AccountID, FacultyID, LecturerName, MicrosoftEmail, Position, HasMeeting; xóa có kiểm tra CourseSection/Timetable |
| `/api/Faculty` | Faculty.FacultyID, FacultyName; FacultyCode trong model bị Ignore, không phải cột EF |
| `/api/CourseSection` | CourseSection.CourseID, LecturerID, FacultyID, CourseCode, CourseName, Credits, NumberStudents, IsSpecial, IsLanguage, IsPFIEV |
| `/api/Classroom` | Classroom.ClassroomID, Capacity, RoomType, IsSpecialized, IsAvailable, Building; ClassroomPeriodLock.ClassroomID/Period |
| GET `/api/Lookup/course-section-form` | Lecturer.LecturerID/LecturerName; Faculty.FacultyID/FacultyName |
| GET `/api/Schedule`, GET `/api/Schedule/lecturer/{lecturerId:int}` | Timetable.CourseID, LecturerID, ClassroomID, CourseName, AcademicYear, Semester, Week, DayOfWeek, Session, StartLesson, TotalWeek; join CourseSection/Lecturer/Classroom |
| POST `/api/Schedule/generate`, `/generate-semester` | CourseSection, Lecturer, Classroom, ClassroomPeriodLock, SystemConfigs, Timetable; thuật toán đọc sức chứa, loại phòng, thời gian/tuần học, trạng thái khóa, các ràng buộc và cấu hình |
| POST `/api/Schedule/save`, `/assign-room`; POST `/lock-semester`, `/reset-semester`, `/dedupe-semester`; GET `/batch/{batchId:guid}`, `/history`; POST `/lock/{batchId:guid}`, `/unlock/{batchId:guid}`; DELETE `/batch/{batchId:guid}` | Timetable.TimetableID, ScheduleBatchId, IsLocked, SolverStatus, ObjectiveValue, CreatedAt, UpdatedAt và các cột lịch; assign-room còn kiểm tra phòng/ràng buộc |
| POST `/api/Schedule/generate-semester/start`; GET `/jobs`, `/jobs/{jobId:guid}`; POST `/jobs/{jobId:guid}/cancel` | Trạng thái job giữ trong bộ nhớ SemesterScheduleJobService; job chạy service xếp lịch và ghi Timetable, không có bảng Jobs |
| GET `/api/Dashboard/stats`, `/rooms-by-building`, `/course-sections-by-building`, `/room-usage-by-day`, `/schedule-conflicts` | Tổng hợp CourseSection, Lecturer, Faculty, Classroom, Timetable tùy biểu đồ/thống kê; có cache |
| GET/PUT `/api/SystemConfig` | SystemConfigs.ConfigKey, ConfigValue |

Nguồn: [SmartScheduleContext](../tkb-be/Data/SmartScheduleContext.cs#L71), [ScheduleController](../tkb-be/Controllers/ScheduleController.cs#L23), [ScheduleService](../tkb-be/Services/ScheduleService.cs#L12), [job service](../tkb-be/Services/SemesterScheduleJobService.cs#L75).

57/60 action không có yêu cầu auth qua attribute và không thấy fallback/global authorization. Điều này bao gồm API tạo/sửa/xóa Account và API lưu/xóa/khóa lịch. Vì vậy đây là **route đang mở trong code**, không chỉ API xem danh mục.

## 5. Đối chiếu khóa dữ liệu giữa ba hệ thống

| Dữ liệu | Course Registration | PLO/CLO | TKB |
|---|---|---|---|
| Sinh viên | Students.Id là mã dạng chuỗi; StudentCardNumber riêng | Students.Id là khóa số; Students.Code là mã nghiệp vụ | Không có bảng Student |
| Định danh Microsoft | Users.MicrosoftId; Lecturers/Admins/AcademicAffairs.MicrosoftId | Accounts.MicrosoftEmail | Account.MicrosoftEmail hoặc Lecturer.MicrosoftEmail |
| Lớp học phần | CourseSections.Id | Classes.Id là khóa số; Classes.Code là mã lớp | CourseSection.CourseID |
| Học phần | Courses.Id; lớp còn có CourseCodeExtracted/CourseSymbol | Courses.Id là khóa số; Courses.Code là mã học phần | CourseSection.CourseCode |
| Lịch học | CourseSections.Schedule/StudyWeeks + StudentInCourseSections | Không phải hệ thống xếp TKB | Timetable: CourseID, Week, DayOfWeek, StartLesson, Session, ClassroomID |
| Điểm | StudentGrades và CourseExemptions | Results → StudentExam → StudentPLOs/StudentProgrammeCompletions | Không có bảng điểm |

Các cột ở mỗi hàng **là ứng viên để đối chiếu theo nghiệp vụ, không phải bằng chứng đã có đồng bộ tự động**. Cần đối chiếu giá trị/mã thực tế trước khi nối hệ thống. SSO không thay thế việc ánh xạ MSSV, mã lớp, mã học phần hoặc quyền riêng từng ứng dụng.

## 6. Phạm vi kiểm chứng

Catalog đã được đối chiếu số action với HTTP attributes đang hoạt động sau khi loại comment. Đối chiếu thêm với EndpointAccess.golden.txt của PLO/CLO: tất cả route trong snapshot đều có trong catalog; source hiện tại có thêm 8 route so với snapshot đó. Bảng/cột được đọc từ model/configuration/schema snapshot; các luồng SQL nguồn, SSO và các ví dụ nghiệp vụ ở báo cáo này đã được đọc trực tiếp.

Cột “bảng lần theo được” trong catalog là phân tích tĩnh, chưa có SQL trace. Cache, factory, job/consumer và nhánh runtime có thể thay đổi tập truy vấn thực tế. Không chạy endpoint reset password, import, transfer, delete hoặc các tác vụ ghi dữ liệu để thực hiện việc khảo sát này.
