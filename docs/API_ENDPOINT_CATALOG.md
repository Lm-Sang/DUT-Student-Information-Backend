# Danh mục API trong ba dự án

Đọc tĩnh từ source ngày 08/10/2026. Tổng cộng 616 action HTTP trong controller; không tính Swagger và SignalR hub.

Mỗi dòng chỉ ra method, route, quyền trong code, action/service và các bảng lần theo được. Routes `[controller]` giữ cách viết hoa của tên controller; ASP.NET Core thường khớp route không phân biệt hoa/thường.

**Giới hạn của cột bảng:** được lần tĩnh qua action → service → helper, không phải SQL trace. Có thể bao gồm bảng của nhánh điều kiện chưa chạy, thiếu truy vấn qua cache hit, factory/DI động, job nền hoặc consumer. Navigation được đối chiếu với schema; các bảng join được ghi khi nhận diện được. Không suy ra rằng một API đọc/ghi mọi cột của bảng. Xem [bảng/cột](API_DATABASE_COLUMNS.md) và [đối chiếu nghiệp vụ đã đọc trực tiếp](API_DATA_SOURCE_AUDIT.md).

Quyền `Public` có nghĩa action không bắt buộc đăng nhập qua attribute, không chứng minh endpoint được chủ đích công bố. Code không cấu hình FallbackPolicy ở ba web API. Course ActiveTokenMiddleware kiểm tra token khi đã xác thực, không tự bắt buộc request anonymous phải đăng nhập.

## course-registration — BackendAPI

116 action HTTP.

### AccountController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/Account/profile` | `Authorize` | BE nghiệp vụ | [Profile](../course-registration/CourseRegistration.BackendAPI/Controllers/AccountController.cs#L50); `SettingsService.GetCourseRegistrationSettingsAsync`, `StudentService.GetByIdAsync` | `Classes`, `CourseRegistrationSettings`, `RegistrationPhases`, `StudentCreditLimits`, `Students`, `Users` |
| POST | `/api/Account/login` | `Public (AllowAnonymous)` | BE nghiệp vụ | [Login](../course-registration/CourseRegistration.BackendAPI/Controllers/AccountController.cs#L90); `UserService.LoginAsync` | `AcademicAffairs`, `Admins`, `Classes`, `CourseRegistrationSettings`, `Lecturers`, `RegistrationPhases`, `StudentCreditLimits`, `Students`, `Users`, `Viewers` |
| POST | `/api/Account/change-password` | `Authorize` | BE nghiệp vụ | [ChangePassword](../course-registration/CourseRegistration.BackendAPI/Controllers/AccountController.cs#L115); `UserService.ChangePasswordAsync`, `RedisCacheService.RemoveData` | `AcademicAffairs`, `Admins`, `Lecturers`, `Users` |
| POST | `/api/Account/set-password` | `Authorize` | BE nghiệp vụ | [SetPassword](../course-registration/CourseRegistration.BackendAPI/Controllers/AccountController.cs#L238); `UserService.SetPasswordAsync`, `RedisCacheService.RemoveData` | `AcademicAffairs`, `Admins`, `Lecturers`, `Users` |
| POST | `/api/Account/admin/reset-pass/{userId}` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [AdminResetStudentPassword](../course-registration/CourseRegistration.BackendAPI/Controllers/AccountController.cs#L267); `UserService.AdminResetPassAsync` | `AcademicAffairs`, `Lecturers`, `Users`, `Viewers` |
| GET | `/api/Account/temp-setup-lecturer-passwords` | `Public (AllowAnonymous)` | BE nghiệp vụ | [SetupLecturerPasswords](../course-registration/CourseRegistration.BackendAPI/Controllers/AccountController.cs#L285); `UserService.SetPasswordAllLecturersAsync` | `Lecturers` |
| POST | `/api/Account/logout` | `Authorize` | BE nghiệp vụ | [Logout](../course-registration/CourseRegistration.BackendAPI/Controllers/AccountController.cs#L306); `RedisCacheService.RemoveData` | Không truy vấn trực tiếp / xem luồng gọi |

### ClassesController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/Classes` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [GetAll](../course-registration/CourseRegistration.BackendAPI/Controllers/ClassesController.cs#L23); `ClassService.GetAllAsync` | `Classes` |
| GET | `/api/Classes/{id}` | `Public: không có thuộc tính auth` | Stub: action chưa triển khai | [Get](../course-registration/CourseRegistration.BackendAPI/Controllers/ClassesController.cs#L31) | Không truy vấn trực tiếp / xem luồng gọi |
| POST | `/api/Classes` | `Public: không có thuộc tính auth` | Stub: action chưa triển khai | [Post](../course-registration/CourseRegistration.BackendAPI/Controllers/ClassesController.cs#L38) | Không truy vấn trực tiếp / xem luồng gọi |
| POST | `/api/Classes/upload` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [UploadExcel](../course-registration/CourseRegistration.BackendAPI/Controllers/ClassesController.cs#L44); `ClassService.CreateManyAsync` | `Classes` |
| PUT | `/api/Classes/{id}` | `Public: không có thuộc tính auth` | Stub: action chưa triển khai | [Put](../course-registration/CourseRegistration.BackendAPI/Controllers/ClassesController.cs#L67) | Không truy vấn trực tiếp / xem luồng gọi |
| DELETE | `/api/Classes/{id}` | `Public: không có thuộc tính auth` | Stub: action chưa triển khai | [Delete](../course-registration/CourseRegistration.BackendAPI/Controllers/ClassesController.cs#L73) | Không truy vấn trực tiếp / xem luồng gọi |

### CourseRegistrationDemandController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/CourseRegistrationDemand/me/status` | `Authorize(Policy = "ActiveStudent")` | BE nghiệp vụ | [GetMyDemandStatus](../course-registration/CourseRegistration.BackendAPI/Controllers/CourseRegistrationDemandController.cs#L44) | `CourseRegistrationSettings`, `RegistrationPhases` |
| GET | `/api/CourseRegistrationDemand/me` | `Authorize(Policy = "ActiveStudent")` | BE nghiệp vụ | [GetMyDemands](../course-registration/CourseRegistration.BackendAPI/Controllers/CourseRegistrationDemandController.cs#L55); `SettingsService.GetCourseRegistrationSettingsAsync`, `CourseRegistrationDemandService.GetByStudentIdAsync` | `CourseRegistrationDemands`, `CourseRegistrationSettings`, `Courses`, `RegistrationPhases`, `StudentGrades` |
| GET | `/api/CourseRegistrationDemand/me/course-summary` | `Authorize(Policy = "ActiveStudent")` | BE nghiệp vụ | [GetMyCourseDemandSummary](../course-registration/CourseRegistration.BackendAPI/Controllers/CourseRegistrationDemandController.cs#L77); `SettingsService.GetCourseRegistrationSettingsAsync`, `CourseRegistrationDemandService.GetCourseDemandSummariesAsync` | `CourseRegistrationDemands`, `CourseRegistrationSettings`, `Courses`, `RegistrationPhases` |
| POST | `/api/CourseRegistrationDemand/me` | `Authorize(Policy = "ActiveStudent")` | BE nghiệp vụ | [CreateMyDemand](../course-registration/CourseRegistration.BackendAPI/Controllers/CourseRegistrationDemandController.cs#L91); `SettingsService.GetCourseRegistrationSettingsAsync`, `CourseRegistrationDemandService.CreateAsync` | `CourseInPrograms`, `CourseRegistrationDemands`, `CourseRegistrationSettings`, `Courses`, `RegistrationPhases`, `StudentGrades`, `Students` |
| PUT | `/api/CourseRegistrationDemand/me/{id}/schedule` | `Authorize(Policy = "ActiveStudent")` | BE nghiệp vụ | [UpdateMyDemandSchedule](../course-registration/CourseRegistration.BackendAPI/Controllers/CourseRegistrationDemandController.cs#L131); `CourseRegistrationDemandService.UpdateScheduleAsync` | `CourseRegistrationDemands`, `CourseRegistrationSettings`, `Courses`, `RegistrationPhases`, `StudentGrades` |
| DELETE | `/api/CourseRegistrationDemand/me/{id}` | `Authorize(Policy = "ActiveStudent")` | BE nghiệp vụ | [DeleteMyDemand](../course-registration/CourseRegistration.BackendAPI/Controllers/CourseRegistrationDemandController.cs#L170); `CourseRegistrationDemandService.DeleteAsync` | `CourseRegistrationDemands`, `CourseRegistrationSettings`, `RegistrationPhases` |
| PUT | `/api/CourseRegistrationDemand/{id}/confirmation` | `Authorize(Policy = "ActiveStudent")` | BE nghiệp vụ | [UpdateConfirmation](../course-registration/CourseRegistration.BackendAPI/Controllers/CourseRegistrationDemandController.cs#L207); `CourseRegistrationDemandService.UpdateConfirmationAsync` | `CourseRegistrationDemands`, `CourseRegistrationSettings`, `RegistrationPhases` |
| PUT | `/api/CourseRegistrationDemand/me/confirmations` | `Authorize(Policy = "ActiveStudent")` | BE nghiệp vụ | [UpdateConfirmations](../course-registration/CourseRegistration.BackendAPI/Controllers/CourseRegistrationDemandController.cs#L244); `CourseRegistrationDemandService.UpdateConfirmationsAsync` | `CourseRegistrationDemands`, `CourseRegistrationSettings`, `RegistrationPhases` |

### CoursesController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/Courses` | `Authorize` | BE nghiệp vụ | [Get](../course-registration/CourseRegistration.BackendAPI/Controllers/CoursesController.cs#L41) | `Classes`, `CourseInPrograms`, `CourseRegistrationSettings`, `CourseRequirements`, `Courses`, `Faculties`, `Majors`, `Programs`, `RegistrationPhases`, `Semesters`, `StudentCreditLimits`, `Students`, `Users` |
| GET | `/api/Courses/alternative-courses` | `Authorize` | BE nghiệp vụ | [GetMyAlternativeCourses](../course-registration/CourseRegistration.BackendAPI/Controllers/CoursesController.cs#L76); `AcademicProgramService.GetAllAlternativeCoursesByProgramAsync` | `AlternativeCourses`, `Classes`, `CourseInPrograms`, `CourseRegistrationSettings`, `Courses`, `RegistrationPhases`, `StudentCreditLimits`, `Students`, `Users` |
| GET | `/api/Courses/{studentId}` | `Authorize(Roles = "Viewer,Admin")` | BE nghiệp vụ | [GetStudentCourses](../course-registration/CourseRegistration.BackendAPI/Controllers/CoursesController.cs#L111) | `Classes`, `CourseInPrograms`, `CourseRegistrationSettings`, `CourseRequirements`, `Courses`, `Faculties`, `Majors`, `Programs`, `RegistrationPhases`, `Semesters`, `StudentCreditLimits`, `Students`, `Users` |
| GET | `/api/Courses/{studentId}/alternative-courses` | `Authorize(Roles = "Viewer,Admin")` | BE nghiệp vụ | [GetStudentAlternativeCourses](../course-registration/CourseRegistration.BackendAPI/Controllers/CoursesController.cs#L144); `AcademicProgramService.GetAllAlternativeCoursesByProgramAsync` | `AlternativeCourses`, `Classes`, `CourseInPrograms`, `CourseRegistrationSettings`, `Courses`, `RegistrationPhases`, `StudentCreditLimits`, `Students`, `Users` |
| POST | `/api/Courses` | `Public: không có thuộc tính auth` | Stub: action chưa triển khai | [Post](../course-registration/CourseRegistration.BackendAPI/Controllers/CoursesController.cs#L256) | Không truy vấn trực tiếp / xem luồng gọi |
| POST | `/api/Courses/upload` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [UploadExcel](../course-registration/CourseRegistration.BackendAPI/Controllers/CoursesController.cs#L262); `CourseService.CreateManyAsync` | `Courses` |
| PUT | `/api/Courses/{id}` | `Public: không có thuộc tính auth` | Stub: action chưa triển khai | [Put](../course-registration/CourseRegistration.BackendAPI/Controllers/CoursesController.cs#L285) | Không truy vấn trực tiếp / xem luồng gọi |
| DELETE | `/api/Courses/{id}` | `Public: không có thuộc tính auth` | Stub: action chưa triển khai | [Delete](../course-registration/CourseRegistration.BackendAPI/Controllers/CoursesController.cs#L291) | Không truy vấn trực tiếp / xem luồng gọi |

### CourseSectionsController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/CourseSections` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [GetCourseSections](../course-registration/CourseRegistration.BackendAPI/Controllers/CourseSectionsController.cs#L80); `CourseSectionService.GetCourseSectionsAsync` | `CourseSections`, `Courses`, `Lecturers`, `StudentInCourseSections` |
| GET | `/api/CourseSections/available` | `Authorize(Policy = "ActiveStudent")` | BE nghiệp vụ | [GetCourseSectionsForStudent](../course-registration/CourseRegistration.BackendAPI/Controllers/CourseSectionsController.cs#L95); `CourseSectionCacheService.GetRegisteringCourseSectionsByStudentAsync`, `SettingsService.GetCourseRegistrationSettingsAsync`, `CourseRegistrationService.GetAvailableCourseSectionsAsync`, `TrackingCacheService.UpdateRequestCount` | `AlternativeCourses`, `Classes`, `CourseExemptions`, `CourseInPrograms`, `CourseRegistrationSettings`, `CourseRequirements`, `CourseSections`, `Courses`, `Lecturers`, `RegistrationPhases`, `StudentCreditLimits`, `StudentGrades`, `StudentInCourseSections`, `Students` |
| GET | `/api/CourseSections/viewer/available/{studentId}` | `Authorize(Roles = "Viewer,Admin")` | BE nghiệp vụ | [GetCourseSectionsForStudent](../course-registration/CourseRegistration.BackendAPI/Controllers/CourseSectionsController.cs#L146); `CourseSectionCacheService.GetRegisteringCourseSectionsByStudentAsync`, `SettingsService.GetCourseRegistrationSettingsAsync`, `CourseRegistrationService.GetAvailableCourseSectionsAsync`, `TrackingCacheService.UpdateRequestCount` | `AlternativeCourses`, `Classes`, `CourseExemptions`, `CourseInPrograms`, `CourseRegistrationSettings`, `CourseRequirements`, `CourseSections`, `Courses`, `Lecturers`, `RegistrationPhases`, `StudentCreditLimits`, `StudentGrades`, `StudentInCourseSections`, `Students` |
| GET | `/api/CourseSections/viewer/section-students/{courseSectionId}` | `Authorize(Roles = "Viewer,Admin")` | BE nghiệp vụ | [GetSectionStudents](../course-registration/CourseRegistration.BackendAPI/Controllers/CourseSectionsController.cs#L197); `CourseSectionService.GetSectionStudentsAsync` | `Classes`, `StudentInCourseSections`, `Students` |
| GET | `/api/CourseSections/me` | `Authorize` | BE nghiệp vụ | [GetMyCourseSections](../course-registration/CourseRegistration.BackendAPI/Controllers/CourseSectionsController.cs#L265); `SettingsService.GetCourseRegistrationSettingsAsync`, `CourseSectionCacheService.GetUnregisteringCourseSectionsByStudentAsync` | `CourseRegistrationSettings`, `CourseSections`, `Courses`, `Lecturers`, `RegistrationPhases`, `StudentInCourseSections` |
| GET | `/api/CourseSections/me/pending` | `Authorize` | BE nghiệp vụ | [GetMyPendingCourseSections](../course-registration/CourseRegistration.BackendAPI/Controllers/CourseSectionsController.cs#L323); `CourseSectionCacheService.GetRegisteringCourseSectionsByStudentAsync`, `CourseSectionCacheService.GetUnregisteringCourseSectionsByStudentAsync` | `CourseSections`, `Courses`, `Lecturers`, `StudentInCourseSections` |
| GET | `/api/CourseSections/me/full` | `Authorize(Policy = "ActiveStudent")` | BE nghiệp vụ | [GetMyFullCourseSections](../course-registration/CourseRegistration.BackendAPI/Controllers/CourseSectionsController.cs#L377); `SettingsService.GetCourseRegistrationSettingsAsync`, `CourseSectionCacheService.GetRegisteringCourseSectionsByStudentAsync`, `CourseSectionCacheService.GetUnregisteringCourseSectionsByStudentAsync` | `CourseRegistrationSettings`, `CourseSections`, `Courses`, `Lecturers`, `RegistrationPhases`, `StudentInCourseSections` |
| GET | `/api/CourseSections/viewer/full/{studentId}` | `Authorize(Roles = "Viewer,Admin")` | BE nghiệp vụ | [GetMyFullCourseSections](../course-registration/CourseRegistration.BackendAPI/Controllers/CourseSectionsController.cs#L466); `SettingsService.GetCourseRegistrationSettingsAsync`, `CourseSectionCacheService.GetRegisteringCourseSectionsByStudentAsync`, `CourseSectionCacheService.GetUnregisteringCourseSectionsByStudentAsync` | `CourseRegistrationSettings`, `CourseSections`, `Courses`, `Lecturers`, `RegistrationPhases`, `StudentInCourseSections` |
| POST | `/api/CourseSections/register` | `Authorize` | BE nghiệp vụ | [Register](../course-registration/CourseRegistration.BackendAPI/Controllers/CourseSectionsController.cs#L562); `RegistrationPhaseService.IsInRegisterTimeAsync`, `CourseSectionCacheService.IsRegisteredByStudentAsync`, `TrackingCacheService.AddRegisteredStudent`, `TrackingCacheService.AddRegistrationRequestCount`, `CourseSectionCacheService.AddRegisteringCourseToStudentAsync`, `KafkaProducerService.SendMessageAsync`, `RedisCacheService.RemoveData`, `CourseSectionCacheService.RemoveRegisteringCourseSectionsFromStudentAsync` | `CourseRegistrationSettings`, `RegistrationPhaseTimes`, `RegistrationPhases`, `StudentInCourseSections` |
| POST | `/api/CourseSections/register-multiple` | `Authorize` | BE nghiệp vụ | [RegisterMultiple](../course-registration/CourseRegistration.BackendAPI/Controllers/CourseSectionsController.cs#L650); `RegistrationPhaseService.IsInRegisterTimeAsync`, `CourseSectionCacheService.IsRegisteredByStudentAsync`, `CourseSectionCacheService.AddRegisteringCourseToStudentAsync`, `KafkaProducerService.SendMessageAsync`, `RedisCacheService.RemoveData`, `CourseSectionCacheService.RemoveRegisteringCourseSectionsFromStudentAsync` | `CourseRegistrationSettings`, `RegistrationPhaseTimes`, `RegistrationPhases`, `StudentInCourseSections` |
| POST | `/api/CourseSections/unregister` | `Authorize` | BE nghiệp vụ | [Unregister](../course-registration/CourseRegistration.BackendAPI/Controllers/CourseSectionsController.cs#L767); `RegistrationPhaseService.IsInRegistrationTimeAsync`, `CourseSectionCacheService.IsRegisteredByStudentAsync`, `CourseSectionService.GetByIdAsync`, `CourseRegistrationService.GetDependentSectionsAsync`, `TrackingCacheService.AddRegisteredStudent`, `TrackingCacheService.AddRegistrationRequestCount`, `CourseSectionCacheService.AddUnregisteringCourseToStudentAsync`, `KafkaProducerService.SendMessageAsync`, `RedisCacheService.RemoveData`, `CourseSectionCacheService.RemoveUnregisteringCourseSectionsFromStudentAsync` | `AlternativeCourses`, `ClassRooms`, `Classes`, `CourseExemptions`, `CourseInPrograms`, `CourseRegistrationSettings`, `CourseRequirements`, `CourseSections`, `Courses`, `Lecturers`, `RegistrationPhaseTimes`, `RegistrationPhases`, `StudentCreditLimits`, `StudentGrades`, `StudentInCourseSections`, `Students` |
| POST | `/api/CourseSections/unregister-multiple` | `Authorize` | BE nghiệp vụ | [UnregisterMultiple](../course-registration/CourseRegistration.BackendAPI/Controllers/CourseSectionsController.cs#L891); `RegistrationPhaseService.IsInRegistrationTimeAsync`, `CourseSectionCacheService.IsRegisteredByStudentAsync`, `CourseSectionService.GetByIdAsync`, `CourseRegistrationService.GetDependentSectionsAsync`, `CourseSectionCacheService.AddUnregisteringCourseToStudentAsync`, `KafkaProducerService.SendMessageAsync`, `RedisCacheService.RemoveData`, `CourseSectionCacheService.RemoveUnregisteringCourseSectionsFromStudentAsync` | `AlternativeCourses`, `ClassRooms`, `Classes`, `CourseExemptions`, `CourseInPrograms`, `CourseRegistrationSettings`, `CourseRequirements`, `CourseSections`, `Courses`, `Lecturers`, `RegistrationPhaseTimes`, `RegistrationPhases`, `StudentCreditLimits`, `StudentGrades`, `StudentInCourseSections`, `Students` |
| POST | `/api/CourseSections/reserve` | `Authorize` | BE nghiệp vụ | [Reserve](../course-registration/CourseRegistration.BackendAPI/Controllers/CourseSectionsController.cs#L1081); `RegistrationPhaseService.IsInRegisterTimeAsync`, `CourseSectionCacheService.IsRegisteredByStudentAsync`, `TrackingCacheService.AddRegisteredStudent`, `TrackingCacheService.AddRegistrationRequestCount`, `CourseSectionCacheService.AddRegisteringCourseToStudentAsync`, `KafkaProducerService.SendMessageAsync`, `RedisCacheService.RemoveData`, `CourseSectionCacheService.RemoveRegisteringCourseSectionsFromStudentAsync` | `CourseRegistrationSettings`, `RegistrationPhaseTimes`, `RegistrationPhases`, `StudentInCourseSections` |
| POST | `/api/CourseSections/unreserve` | `Authorize` | BE nghiệp vụ | [Unreserve](../course-registration/CourseRegistration.BackendAPI/Controllers/CourseSectionsController.cs#L1170); `RegistrationPhaseService.IsInRegistrationTimeAsync`, `CourseSectionCacheService.IsRegisteredByStudentAsync`, `CourseSectionService.GetByIdAsync`, `CourseRegistrationService.GetDependentSectionsAsync`, `TrackingCacheService.AddRegisteredStudent`, `TrackingCacheService.AddRegistrationRequestCount`, `CourseSectionCacheService.AddUnregisteringCourseToStudentAsync`, `KafkaProducerService.SendMessageAsync`, `RedisCacheService.RemoveData`, `CourseSectionCacheService.RemoveUnregisteringCourseSectionsFromStudentAsync` | `AlternativeCourses`, `ClassRooms`, `Classes`, `CourseExemptions`, `CourseInPrograms`, `CourseRegistrationSettings`, `CourseRequirements`, `CourseSections`, `Courses`, `Lecturers`, `RegistrationPhaseTimes`, `RegistrationPhases`, `StudentCreditLimits`, `StudentGrades`, `StudentInCourseSections`, `Students` |
| GET | `/api/CourseSections/{id}` | `Public: không có thuộc tính auth` | Stub: action chưa triển khai | [GetById](../course-registration/CourseRegistration.BackendAPI/Controllers/CourseSectionsController.cs#L1293) | Không truy vấn trực tiếp / xem luồng gọi |
| POST | `/api/CourseSections` | `Public: không có thuộc tính auth` | Stub: action chưa triển khai | [Post](../course-registration/CourseRegistration.BackendAPI/Controllers/CourseSectionsController.cs#L1300) | Không truy vấn trực tiếp / xem luồng gọi |
| POST | `/api/CourseSections/upload` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [UploadExcel](../course-registration/CourseRegistration.BackendAPI/Controllers/CourseSectionsController.cs#L1306); `CourseSectionService.CreateManyAsync` | `CourseSections` |
| PUT | `/api/CourseSections/{id}` | `Public: không có thuộc tính auth` | Stub: action chưa triển khai | [Put](../course-registration/CourseRegistration.BackendAPI/Controllers/CourseSectionsController.cs#L1348) | Không truy vấn trực tiếp / xem luồng gọi |
| DELETE | `/api/CourseSections/{id}` | `Public: không có thuộc tính auth` | Stub: action chưa triển khai | [Delete](../course-registration/CourseRegistration.BackendAPI/Controllers/CourseSectionsController.cs#L1354) | Không truy vấn trực tiếp / xem luồng gọi |

### FacultiesController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/Faculties` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [GetAll](../course-registration/CourseRegistration.BackendAPI/Controllers/FacultiesController.cs#L24); `FacultyService.GetAllAsync` | `Faculties` |
| GET | `/api/Faculties/{id}` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [GetById](../course-registration/CourseRegistration.BackendAPI/Controllers/FacultiesController.cs#L32); `FacultyService.GetByIdAsync` | `Faculties` |
| POST | `/api/Faculties` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [Create](../course-registration/CourseRegistration.BackendAPI/Controllers/FacultiesController.cs#L41); `FacultyService.CreateAsync` | `Faculties` |
| POST | `/api/Faculties/upload` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [UploadExcel](../course-registration/CourseRegistration.BackendAPI/Controllers/FacultiesController.cs#L53); `FacultyService.CreateManyAsync` | `Faculties` |
| PUT | `/api/Faculties/{id}` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [Update](../course-registration/CourseRegistration.BackendAPI/Controllers/FacultiesController.cs#L76); `FacultyService.UpdateAsync` | `Faculties` |
| DELETE | `/api/Faculties/{id}` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [Delete](../course-registration/CourseRegistration.BackendAPI/Controllers/FacultiesController.cs#L88); `FacultyService.DeleteAsync` | `Faculties` |

### LecturersController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/Lecturers` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [GetAll](../course-registration/CourseRegistration.BackendAPI/Controllers/LecturersController.cs#L24); `LecturerService.GetByFacultyIdAsync`, `LecturerService.GetAllAsync` | `Lecturers` |
| GET | `/api/Lecturers/{id}` | `Public: không có thuộc tính auth` | Stub: action chưa triển khai | [Get](../course-registration/CourseRegistration.BackendAPI/Controllers/LecturersController.cs#L42) | Không truy vấn trực tiếp / xem luồng gọi |
| POST | `/api/Lecturers` | `Public: không có thuộc tính auth` | Stub: action chưa triển khai | [Post](../course-registration/CourseRegistration.BackendAPI/Controllers/LecturersController.cs#L49) | Không truy vấn trực tiếp / xem luồng gọi |
| POST | `/api/Lecturers/upload` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [UploadExcel](../course-registration/CourseRegistration.BackendAPI/Controllers/LecturersController.cs#L55); `LecturerService.CreateManyAsync` | `Faculties`, `Lecturers` |
| PUT | `/api/Lecturers/{id}` | `Public: không có thuộc tính auth` | Stub: action chưa triển khai | [Put](../course-registration/CourseRegistration.BackendAPI/Controllers/LecturersController.cs#L78) | Không truy vấn trực tiếp / xem luồng gọi |
| DELETE | `/api/Lecturers/{id}` | `Public: không có thuộc tính auth` | Stub: action chưa triển khai | [Delete](../course-registration/CourseRegistration.BackendAPI/Controllers/LecturersController.cs#L84) | Không truy vấn trực tiếp / xem luồng gọi |

### LogsController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/Logs` | `Authorize(Roles = "Viewer,Admin")` | BE nghiệp vụ | [GetAll](../course-registration/CourseRegistration.BackendAPI/Controllers/LogsController.cs#L28); `CourseRegistrationLogService.GetListByStudentIdAsync` | `CourseRegistrationLogs` |
| GET | `/api/Logs/viewer/{studentId}` | `Authorize(Roles = "Viewer,Admin")` | BE nghiệp vụ | [GetStudentHistory](../course-registration/CourseRegistration.BackendAPI/Controllers/LogsController.cs#L37); `CourseRegistrationLogService.GetListByStudentIdAsync` | `CourseRegistrationLogs` |
| POST | `/api/Logs` | `Authorize(Roles = "Admin")` | BE nghiệp vụ | [Create](../course-registration/CourseRegistration.BackendAPI/Controllers/LogsController.cs#L57); `KafkaProducerService.SendMessageAsync` | Không truy vấn trực tiếp / xem luồng gọi |

### MajorsController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/Majors` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [Get](../course-registration/CourseRegistration.BackendAPI/Controllers/MajorsController.cs#L23); `MajorService.GetAllAsync` | `Majors` |
| GET | `/api/Majors/{id}` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [GetById](../course-registration/CourseRegistration.BackendAPI/Controllers/MajorsController.cs#L30); `MajorService.GetByIdAsync` | `Majors` |
| POST | `/api/Majors` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [Post](../course-registration/CourseRegistration.BackendAPI/Controllers/MajorsController.cs#L39); `MajorService.CreateAsync` | `Majors` |
| POST | `/api/Majors/upload` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [UploadExcel](../course-registration/CourseRegistration.BackendAPI/Controllers/MajorsController.cs#L51); `MajorService.CreateManyAsync` | `Majors` |
| PUT | `/api/Majors/{id}` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [Put](../course-registration/CourseRegistration.BackendAPI/Controllers/MajorsController.cs#L74); `MajorService.UpdateAsync` | `Majors` |
| DELETE | `/api/Majors/{id}` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [Delete](../course-registration/CourseRegistration.BackendAPI/Controllers/MajorsController.cs#L86); `MajorService.DeleteAsync` | `Majors` |

### MicrosoftController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/microsoft/signin` | `Public: không có thuộc tính auth` | BE nhận/đổi token SSO | [SignIn](../course-registration/CourseRegistration.BackendAPI/Controllers/MicrosoftController.cs#L32) | Không truy vấn trực tiếp / xem luồng gọi |
| GET | `/api/microsoft/callback` | `Public: không có thuộc tính auth` | BE nhận/đổi token SSO | [SignInCallback](../course-registration/CourseRegistration.BackendAPI/Controllers/MicrosoftController.cs#L38); `UserService.GetByMicrosoftIdAsync` | `Classes`, `CourseRegistrationSettings`, `RegistrationPhases`, `StudentCreditLimits`, `Students`, `Users` |
| POST | `/api/microsoft/course-registration-token` | `Public: không có thuộc tính auth` | BE nhận/đổi token SSO | [CreateCourseRegistrationToken](../course-registration/CourseRegistration.BackendAPI/Controllers/MicrosoftController.cs#L93); `UserService.GetByMicrosoftIdAsync` | `Classes`, `CourseRegistrationSettings`, `RegistrationPhases`, `StudentCreditLimits`, `Students`, `Users` |
| GET | `/api/microsoft/logout` | `Public: không có thuộc tính auth` | BE nhận/đổi token SSO | [LogOut](../course-registration/CourseRegistration.BackendAPI/Controllers/MicrosoftController.cs#L233) | Không truy vấn trực tiếp / xem luồng gọi |
| GET | `/api/microsoft/logout-confirm` | `Public: không có thuộc tính auth` | BE nhận/đổi token SSO | [LogOutConfirm](../course-registration/CourseRegistration.BackendAPI/Controllers/MicrosoftController.cs#L241) | Không truy vấn trực tiếp / xem luồng gọi |

### AcademicProgramsController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/AcademicPrograms` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [GetAll](../course-registration/CourseRegistration.BackendAPI/Controllers/ProgramsController.cs#L24); `AcademicProgramService.GetAllAsync` | `Faculties`, `Majors`, `Programs`, `Semesters` |
| GET | `/api/AcademicPrograms/{id}` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [GetById](../course-registration/CourseRegistration.BackendAPI/Controllers/ProgramsController.cs#L32); `AcademicProgramService.GetByIdAsync` | `Faculties`, `Majors`, `Programs`, `Semesters` |
| GET | `/api/AcademicPrograms/paged` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [GetPaged](../course-registration/CourseRegistration.BackendAPI/Controllers/ProgramsController.cs#L39); `AcademicProgramService.GetPagedProgramsAsync` | `Faculties`, `Majors`, `Programs` |
| POST | `/api/AcademicPrograms` | `Public: không có thuộc tính auth` | Stub: action chưa triển khai | [Post](../course-registration/CourseRegistration.BackendAPI/Controllers/ProgramsController.cs#L47) | Không truy vấn trực tiếp / xem luồng gọi |
| POST | `/api/AcademicPrograms/upload` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [UploadExcel](../course-registration/CourseRegistration.BackendAPI/Controllers/ProgramsController.cs#L52); `AcademicProgramService.CreateManyAsync` | `Programs`, `Semesters` |
| POST | `/api/AcademicPrograms/courses/upload` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [UploadAcademicProgramCoursesExcel](../course-registration/CourseRegistration.BackendAPI/Controllers/ProgramsController.cs#L75); `AcademicProgramService.CreateManyDetailProgramAsync` | `CourseInPrograms`, `Students` |
| POST | `/api/AcademicPrograms/courses/requirement/upload` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [UploadCoursesRequirementExcel](../course-registration/CourseRegistration.BackendAPI/Controllers/ProgramsController.cs#L98); `AcademicProgramService.CreateManyCourseRequirementAsync` | `CourseRequirements` |
| PUT | `/api/AcademicPrograms/{id}` | `Public: không có thuộc tính auth` | Stub: action chưa triển khai | [Put](../course-registration/CourseRegistration.BackendAPI/Controllers/ProgramsController.cs#L122) | Không truy vấn trực tiếp / xem luồng gọi |
| DELETE | `/api/AcademicPrograms/{id}` | `Public: không có thuộc tính auth` | Stub: action chưa triển khai | [Delete](../course-registration/CourseRegistration.BackendAPI/Controllers/ProgramsController.cs#L128) | Không truy vấn trực tiếp / xem luồng gọi |
| POST | `/api/AcademicPrograms/alternative/upload` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [UploadAlternativeCourse](../course-registration/CourseRegistration.BackendAPI/Controllers/ProgramsController.cs#L134); `AcademicProgramService.CreateManyAlternativeCoursesAsync` | `CourseInPrograms`, `Students` |

### RegistrationPhaseController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/RegistrationPhase/current-semester` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [GetCurrentSemesterPhases](../course-registration/CourseRegistration.BackendAPI/Controllers/RegistrationPhaseController.cs#L25); `RegistrationPhaseService.GetCurrentSemesterPhasesAsync` | `CourseRegistrationSettings`, `RegistrationPhaseTimes`, `RegistrationPhases`, `Semesters` |
| POST | `/api/RegistrationPhase` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [Create](../course-registration/CourseRegistration.BackendAPI/Controllers/RegistrationPhaseController.cs#L42); `RegistrationPhaseService.CreateAsync` | `RegistrationPhaseTimes`, `RegistrationPhases` |
| PUT | `/api/RegistrationPhase/{id}` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [Update](../course-registration/CourseRegistration.BackendAPI/Controllers/RegistrationPhaseController.cs#L67); `RegistrationPhaseService.UpdateAsync` | `RegistrationPhaseTimes`, `RegistrationPhases` |
| DELETE | `/api/RegistrationPhase/{id}` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [Delete](../course-registration/CourseRegistration.BackendAPI/Controllers/RegistrationPhaseController.cs#L96); `RegistrationPhaseService.DeleteAsync` | `RegistrationPhases` |

### SemestersController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/Semesters` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [Get](../course-registration/CourseRegistration.BackendAPI/Controllers/SemesterController.cs#L19); `SemesterService.GetAllAsync` | `Semesters` |
| GET | `/api/Semesters/{id}` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [GetById](../course-registration/CourseRegistration.BackendAPI/Controllers/SemesterController.cs#L24); `SemesterService.GetByIdAsync` | `Semesters` |
| POST | `/api/Semesters` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [Post](../course-registration/CourseRegistration.BackendAPI/Controllers/SemesterController.cs#L32); `SemesterService.CreateAsync` | `Semesters` |
| POST | `/api/Semesters/upload` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [UploadExcel](../course-registration/CourseRegistration.BackendAPI/Controllers/SemesterController.cs#L42); `SemesterService.CreateManyAsync` | `Semesters` |
| PUT | `/api/Semesters/{id}` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [Put](../course-registration/CourseRegistration.BackendAPI/Controllers/SemesterController.cs#L62); `SemesterService.UpdateAsync` | `Semesters` |
| DELETE | `/api/Semesters/{id}` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [Delete](../course-registration/CourseRegistration.BackendAPI/Controllers/SemesterController.cs#L72); `SemesterService.DeleteAsync` | `Semesters` |

### SettingsController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| POST | `/api/Settings/yearCode` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [CurrentAcademicYearCode](../course-registration/CourseRegistration.BackendAPI/Controllers/SettingsController.cs#L23); `SettingsService.SetCurrentAcademicYearCodeAsync` | `CourseRegistrationSettings` |
| GET | `/api/Settings/courseRegistrationPhase` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [CourseRegistrationPhase](../course-registration/CourseRegistration.BackendAPI/Controllers/SettingsController.cs#L40); `SettingsService.GetCourseRegistrationPhaseAsync` | `CourseRegistrationSettings`, `RegistrationPhases` |
| POST | `/api/Settings/courseRegistrationPhase` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [CourseRegistrationPhase](../course-registration/CourseRegistration.BackendAPI/Controllers/SettingsController.cs#L65); `SettingsService.SetCourseRegistrationPhaseAsync` | `CourseRegistrationSettings` |
| GET | `/api/Settings/title` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [GetTitle](../course-registration/CourseRegistration.BackendAPI/Controllers/SettingsController.cs#L100); `SettingsService.GetTitleAsync` | `CourseRegistrationSettings` |
| GET | `/api/Settings/demand-notes` | `JWT: kiểm tra UserId trong action` | BE nghiệp vụ | [GetMyDemandNotes](../course-registration/CourseRegistration.BackendAPI/Controllers/SettingsController.cs#L113); `SettingsService.GetDemandNoteAsync` | `CourseRegistrationSettings` |

### StudentGradesController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/StudentGrades/me` | `JWT: kiểm tra UserId trong action` | BE nghiệp vụ | [GetMyGrade](../course-registration/CourseRegistration.BackendAPI/Controllers/StudentGradesController.cs#L31); `StudentGradeService.GetDetailByStudentIdAsync` | `CourseExemptions`, `CourseSections`, `Courses`, `StudentGrades` |
| GET | `/api/StudentGrades/currentSemesterCode` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [GetCurrentSemesterCode](../course-registration/CourseRegistration.BackendAPI/Controllers/StudentGradesController.cs#L65); `SettingsService.GetCurrentAcademicYearCodeAsync` | `CourseRegistrationSettings` |
| GET | `/api/StudentGrades/{studentId}` | `Authorize(Roles = "Viewer,Admin")` | BE nghiệp vụ | [GetStudentGrades](../course-registration/CourseRegistration.BackendAPI/Controllers/StudentGradesController.cs#L78); `StudentGradeService.GetDetailByStudentIdAsync` | `CourseExemptions`, `CourseSections`, `Courses`, `StudentGrades` |
| POST | `/api/StudentGrades` | `Public: không có thuộc tính auth` | Stub: action chưa triển khai | [Post](../course-registration/CourseRegistration.BackendAPI/Controllers/StudentGradesController.cs#L117) | Không truy vấn trực tiếp / xem luồng gọi |
| POST | `/api/StudentGrades/upload` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [UploadExcel](../course-registration/CourseRegistration.BackendAPI/Controllers/StudentGradesController.cs#L123); `StudentGradeService.CreateManyAsync` | `StudentGrades` |
| PUT | `/api/StudentGrades/{id}` | `Public: không có thuộc tính auth` | Stub: action chưa triển khai | [Put](../course-registration/CourseRegistration.BackendAPI/Controllers/StudentGradesController.cs#L148) | Không truy vấn trực tiếp / xem luồng gọi |
| DELETE | `/api/StudentGrades/{id}` | `Public: không có thuộc tính auth` | Stub: action chưa triển khai | [Delete](../course-registration/CourseRegistration.BackendAPI/Controllers/StudentGradesController.cs#L154) | Không truy vấn trực tiếp / xem luồng gọi |

### StudentsController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/Students` | `Authorize(Roles = "Viewer,Admin")` | BE nghiệp vụ | [GetAll](../course-registration/CourseRegistration.BackendAPI/Controllers/StudentsController.cs#L32); `SettingsService.GetCourseRegistrationSettingsAsync`, `StudentService.GetByClassIdAsync`, `StudentService.GetAllAsync` | `Classes`, `CourseRegistrationSettings`, `CourseSections`, `Courses`, `Lecturers`, `RegistrationPhases`, `StudentCreditLimits`, `StudentInCourseSections`, `Students` |
| GET | `/api/Students/me` | `Authorize` | BE nghiệp vụ | [Get](../course-registration/CourseRegistration.BackendAPI/Controllers/StudentsController.cs#L55); `SettingsService.GetCourseRegistrationSettingsAsync`, `StudentService.GetByIdAsync` | `Classes`, `CourseRegistrationSettings`, `RegistrationPhases`, `StudentCreditLimits`, `Students`, `Users` |
| POST | `/api/Students` | `Public: không có thuộc tính auth` | Stub: action chưa triển khai | [Post](../course-registration/CourseRegistration.BackendAPI/Controllers/StudentsController.cs#L78) | Không truy vấn trực tiếp / xem luồng gọi |
| POST | `/api/Students/upload` | `Authorize(Roles = "Admin")` | BE nghiệp vụ | [UploadExcel](../course-registration/CourseRegistration.BackendAPI/Controllers/StudentsController.cs#L85); `StudentService.CreateManyAsync` | `Students`, `Users` |
| PUT | `/api/Students/{id}` | `Public: không có thuộc tính auth` | Stub: action chưa triển khai | [Put](../course-registration/CourseRegistration.BackendAPI/Controllers/StudentsController.cs#L108) | Không truy vấn trực tiếp / xem luồng gọi |
| DELETE | `/api/Students/{id}` | `Public: không có thuộc tính auth` | Stub: action chưa triển khai | [Delete](../course-registration/CourseRegistration.BackendAPI/Controllers/StudentsController.cs#L114) | Không truy vấn trực tiếp / xem luồng gọi |
| GET | `/api/Students/{studentId}` | `Authorize(Roles = "Viewer,Admin")` | BE nghiệp vụ | [GetById](../course-registration/CourseRegistration.BackendAPI/Controllers/StudentsController.cs#L121); `SettingsService.GetCourseRegistrationSettingsAsync`, `StudentService.GetByIdAsync` | `Classes`, `CourseRegistrationSettings`, `RegistrationPhases`, `StudentCreditLimits`, `Students`, `Users` |
| GET | `/api/Students/paging` | `Authorize(Roles = "Viewer")` | BE nghiệp vụ | [GetStudentsPaging](../course-registration/CourseRegistration.BackendAPI/Controllers/StudentsController.cs#L155); `StudentService.GetPagedStudentsAsync` | `Classes`, `CourseRegistrationSettings`, `CourseSections`, `Courses`, `Lecturers`, `StudentInCourseSections`, `Students`, `Users` |

### TestingCourseSectionsController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| POST | `/api/TestingCourseSections/simulate-group-registration` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [SimulateGroupRegistration](../course-registration/CourseRegistration.BackendAPI/Controllers/TestingCourseSectionsController.cs#L86); `SettingsService.GetCourseRegistrationSettingsAsync` | `AlternativeCourses`, `Classes`, `CourseExemptions`, `CourseInPrograms`, `CourseRegistrationSettings`, `CourseRequirements`, `CourseSections`, `Courses`, `Lecturers`, `RegistrationPhases`, `StudentCreditLimits`, `StudentGrades`, `StudentInCourseSections`, `Students` |
| POST | `/api/TestingCourseSections/bulk-register-test` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [BulkRegisterTest](../course-registration/CourseRegistration.BackendAPI/Controllers/TestingCourseSectionsController.cs#L510) | Không truy vấn trực tiếp / xem luồng gọi |

## course-registration — AdminAPI

131 action HTTP.

### AccountController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/admin/accounts` | `Authorize` | BE nghiệp vụ | [GetAccounts](../course-registration/CourseRegistration.AdminAPI/Controllers/AccountController.cs#L43); `StudentService.GetPagedStudentsAsync`, `ViewerService.GetPagedViewersAsync`, `AcademicAffairsService.GetPagedAcademicAffairsAsync` | `AcademicAffairs`, `Classes`, `CourseRegistrationSettings`, `CourseSections`, `Courses`, `Lecturers`, `StudentInCourseSections`, `Students`, `Users`, `Viewers` |
| POST | `/api/admin/accounts/{userId}/reset-password` | `Authorize + Authorize(Roles = "Admin")` | BE nghiệp vụ | [ResetPassword](../course-registration/CourseRegistration.AdminAPI/Controllers/AccountController.cs#L74); `UserService.AdminResetPassAsync` | `AcademicAffairs`, `Lecturers`, `Users`, `Viewers` |
| POST | `/api/admin/accounts/viewers` | `Authorize + Authorize(Roles = "Admin")` | BE nghiệp vụ | [CreateViewer](../course-registration/CourseRegistration.AdminAPI/Controllers/AccountController.cs#L107); `ViewerService.CreateAsync` | `Viewers` |
| GET | `/api/admin/accounts/viewers/{id}` | `Authorize` | BE nghiệp vụ | [GetViewer](../course-registration/CourseRegistration.AdminAPI/Controllers/AccountController.cs#L128); `ViewerService.GetByIdAsync` | `Viewers` |
| PUT | `/api/admin/accounts/viewers/{id}` | `Authorize + Authorize(Roles = "Admin")` | BE nghiệp vụ | [UpdateViewer](../course-registration/CourseRegistration.AdminAPI/Controllers/AccountController.cs#L140); `ViewerService.UpdateAsync` | `Viewers` |
| POST | `/api/admin/accounts/change-password` | `Authorize + Authorize(Roles = "Admin,Lecturer,AcademicAffairs")` | BE nghiệp vụ | [ChangePassword](../course-registration/CourseRegistration.AdminAPI/Controllers/AccountController.cs#L160); `UserService.ChangePasswordAsync` | `AcademicAffairs`, `Admins`, `Lecturers`, `Users` |
| POST | `/api/admin/accounts/lecturers/reset-password-all` | `Authorize + Authorize(Roles = "Admin")` | BE nghiệp vụ | [ResetAllLecturerPasswords](../course-registration/CourseRegistration.AdminAPI/Controllers/AccountController.cs#L182); `UserService.SetPasswordAllLecturersAsync` | `Lecturers` |
| POST | `/api/admin/accounts/academic-affairs` | `Authorize + Authorize(Roles = "Admin")` | BE nghiệp vụ | [CreateAcademicAffairs](../course-registration/CourseRegistration.AdminAPI/Controllers/AccountController.cs#L212); `AcademicAffairsService.CreateAsync` | `AcademicAffairs` |
| GET | `/api/admin/accounts/academic-affairs/{id}` | `Authorize` | BE nghiệp vụ | [GetAcademicAffairs](../course-registration/CourseRegistration.AdminAPI/Controllers/AccountController.cs#L242); `AcademicAffairsService.GetByIdAsync` | `AcademicAffairs` |
| PUT | `/api/admin/accounts/academic-affairs/{id}` | `Authorize + Authorize(Roles = "Admin")` | BE nghiệp vụ | [UpdateAcademicAffairs](../course-registration/CourseRegistration.AdminAPI/Controllers/AccountController.cs#L255); `AcademicAffairsService.UpdateAsync` | `AcademicAffairs` |

### AdminActionLogsController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/admin/adminactionlogs` | `Authorize(Roles = "Admin")` | BE nghiệp vụ | [GetLogs](../course-registration/CourseRegistration.AdminAPI/Controllers/AdminActionLogsController.cs#L25); `AdminActionLogService.GetPagedAdminLogsAsync` | `AdminActionLogs`, `Classes`, `CourseSections`, `Courses`, `Lecturers`, `StudentCreditLimits`, `StudentInCourseSections`, `Students`, `Users` |

### AlternativeCoursesController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/admin/alternative-courses` | `Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [GetAll](../course-registration/CourseRegistration.AdminAPI/Controllers/AlternativeCoursesController.cs#L43); `AcademicProgramService.GetAllAlternativeCoursesAsync` | `AlternativeCourses`, `CourseInPrograms`, `Courses`, `Faculties`, `Programs` |
| POST | `/api/admin/alternative-courses/bulk-delete` | `Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [BulkDelete](../course-registration/CourseRegistration.AdminAPI/Controllers/AlternativeCoursesController.cs#L67); `AcademicProgramService.DeleteAlternativeCoursesAsync`, `AdminActionLogService.AddLogAsync` | `AdminActionLogs`, `AlternativeCourses`, `CourseInPrograms`, `Students` |

### AuthController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| POST | `/api/admin/Auth/login` | `Public (AllowAnonymous)` | BE nghiệp vụ | [Login](../course-registration/CourseRegistration.AdminAPI/Controllers/AuthController.cs#L37); `UserService.LoginAsync` | `AcademicAffairs`, `Admins`, `Classes`, `CourseRegistrationSettings`, `Lecturers`, `RegistrationPhases`, `StudentCreditLimits`, `Students`, `Users`, `Viewers` |
| GET | `/api/admin/Auth/microsoft/login` | `Public (AllowAnonymous)` | BE nhận/đổi token SSO | [SignInWithMicrosoft](../course-registration/CourseRegistration.AdminAPI/Controllers/AuthController.cs#L97) | Không truy vấn trực tiếp / xem luồng gọi |
| GET | `/api/admin/Auth/microsoft/callback` | `Public (AllowAnonymous)` | BE nhận/đổi token SSO | [SignInCallback](../course-registration/CourseRegistration.AdminAPI/Controllers/AuthController.cs#L111); `UserService.LinkLecturerMicrosoftAccountAsync`, `RedisCacheService.RemoveData`, `UserService.GetAdminAccountAsync` | `AcademicAffairs`, `Admins`, `Lecturers` |
| GET | `/api/admin/Auth/microsoft/logout` | `Public (AllowAnonymous)` | BE nhận/đổi token SSO | [LogOutMicrosoft](../course-registration/CourseRegistration.AdminAPI/Controllers/AuthController.cs#L237) | Không truy vấn trực tiếp / xem luồng gọi |
| POST | `/api/admin/Auth/logout` | `Authorize` | BE nghiệp vụ | [Logout](../course-registration/CourseRegistration.AdminAPI/Controllers/AuthController.cs#L245); `RedisCacheService.RemoveData` | Không truy vấn trực tiếp / xem luồng gọi |
| GET | `/api/admin/Auth/profile` | `Authorize` | BE nghiệp vụ | [GetProfile](../course-registration/CourseRegistration.AdminAPI/Controllers/AuthController.cs#L277); `UserService.GetAdminAccountAsync` | `AcademicAffairs`, `Admins`, `Lecturers` |

### CacheController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| POST | `/api/admin/cache/clear-all` | `Authorize(Roles = "Admin")` | BE nghiệp vụ | [ClearAll](../course-registration/CourseRegistration.AdminAPI/Controllers/CacheController.cs#L58); `RedisCacheService.ClearAllExceptAsync`, `AdminActionLogService.AddLogAsync` | `AdminActionLogs` |

### ClassesController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/admin/classes` | `Authorize` | BE nghiệp vụ | [GetClasses](../course-registration/CourseRegistration.AdminAPI/Controllers/ClassesController.cs#L36); `ClassService.GetPagedClassesAsync` | `Classes`, `Lecturers`, `Programs` |
| GET | `/api/admin/classes/{classId}/students` | `Authorize` | BE nghiệp vụ | [GetStudentsByClassId](../course-registration/CourseRegistration.AdminAPI/Controllers/ClassesController.cs#L72); `ClassService.GetByIdAsync`, `SettingsService.GetCourseRegistrationSettingsAsync`, `StudentService.GetByClassIdAsync` | `Classes`, `CourseRegistrationSettings`, `CourseSections`, `Courses`, `Lecturers`, `RegistrationPhases`, `StudentCreditLimits`, `StudentInCourseSections`, `Students` |

### ClassRoomsController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/admin/classrooms` | `Authorize` | BE nghiệp vụ | [GetPagedClassRooms](../course-registration/CourseRegistration.AdminAPI/Controllers/ClassRoomsController.cs#L27); `ClassRoomService.GetPagedClassRoomsAsync` | `ClassRooms` |
| GET | `/api/admin/classrooms/all` | `Authorize` | BE nghiệp vụ | [GetAllClassRooms](../course-registration/CourseRegistration.AdminAPI/Controllers/ClassRoomsController.cs#L84); `ClassRoomService.GetAllAsync` | `ClassRooms` |
| GET | `/api/admin/classrooms/buildings` | `Authorize` | BE nghiệp vụ | [GetDistinctBuildings](../course-registration/CourseRegistration.AdminAPI/Controllers/ClassRoomsController.cs#L99); `ClassRoomService.GetDistinctBuildingsAsync` | `ClassRooms` |
| GET | `/api/admin/classrooms/room-types` | `Authorize` | BE nghiệp vụ | [GetDistinctRoomTypes](../course-registration/CourseRegistration.AdminAPI/Controllers/ClassRoomsController.cs#L114); `ClassRoomService.GetDistinctRoomTypesAsync` | `ClassRooms` |
| GET | `/api/admin/classrooms/{id}` | `Authorize` | BE nghiệp vụ | [GetById](../course-registration/CourseRegistration.AdminAPI/Controllers/ClassRoomsController.cs#L129); `ClassRoomService.GetByIdAsync` | `ClassRooms` |
| POST | `/api/admin/classrooms` | `Authorize` | BE nghiệp vụ | [Create](../course-registration/CourseRegistration.AdminAPI/Controllers/ClassRoomsController.cs#L149); `ClassRoomService.CreateAsync` | `ClassRooms` |
| POST | `/api/admin/classrooms/bulk` | `Authorize` | BE nghiệp vụ | [CreateMany](../course-registration/CourseRegistration.AdminAPI/Controllers/ClassRoomsController.cs#L174); `ClassRoomService.CreateManyAsync` | `ClassRooms` |
| PUT | `/api/admin/classrooms/{id}` | `Authorize` | BE nghiệp vụ | [Update](../course-registration/CourseRegistration.AdminAPI/Controllers/ClassRoomsController.cs#L199); `ClassRoomService.UpdateAsync` | `ClassRooms` |
| DELETE | `/api/admin/classrooms/{id}` | `Authorize` | BE nghiệp vụ | [Delete](../course-registration/CourseRegistration.AdminAPI/Controllers/ClassRoomsController.cs#L224); `ClassRoomService.DeleteAsync` | `ClassRooms` |
| GET | `/api/admin/classrooms/export-template` | `Authorize` | BE nghiệp vụ | [ExportTemplate](../course-registration/CourseRegistration.AdminAPI/Controllers/ClassRoomsController.cs#L244) | Không truy vấn trực tiếp / xem luồng gọi |
| POST | `/api/admin/classrooms/import` | `Authorize` | BE nghiệp vụ | [ImportFromExcel](../course-registration/CourseRegistration.AdminAPI/Controllers/ClassRoomsController.cs#L259); `ClassRoomService.CreateManyAsync` | `ClassRooms` |

### CourseRegistrationDemandsController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/admin/course-registration-demands` | `Authorize(Roles = "Admin")` | BE nghiệp vụ | [GetCourseDemands](../course-registration/CourseRegistration.AdminAPI/Controllers/CourseRegistrationDemandsController.cs#L35); `CourseRegistrationDemandService.GetCourseDemandsAsync` | `CourseRegistrationDemands`, `CourseRegistrationSettings`, `Courses`, `RegistrationPhases` |
| GET | `/api/admin/course-registration-demands/courses/{courseId}/students` | `Authorize(Roles = "Admin")` | BE nghiệp vụ | [GetCourseDemandStudents](../course-registration/CourseRegistration.AdminAPI/Controllers/CourseRegistrationDemandsController.cs#L74); `CourseRegistrationDemandService.GetCourseDemandStudentsAsync` | `Classes`, `CourseRegistrationDemands`, `CourseRegistrationSettings`, `Courses`, `RegistrationPhases`, `Students` |
| GET | `/api/admin/course-registration-demands/export` | `Authorize(Roles = "Admin")` | BE nghiệp vụ | [ExportCourseDemands](../course-registration/CourseRegistration.AdminAPI/Controllers/CourseRegistrationDemandsController.cs#L118); `CourseRegistrationDemandService.ExportCourseDemandsAsync` | `Classes`, `CourseRegistrationDemands`, `CourseRegistrationSettings`, `Courses`, `RegistrationPhases`, `Students` |

### CoursesController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/admin/courses` | `Authorize` | BE nghiệp vụ | [GetPagedCourses](../course-registration/CourseRegistration.AdminAPI/Controllers/CoursesController.cs#L26); `CourseService.GetPagedCoursesAsync` | `Courses` |
| GET | `/api/admin/courses/all` | `Authorize` | BE nghiệp vụ | [GetAllCourses](../course-registration/CourseRegistration.AdminAPI/Controllers/CoursesController.cs#L57); `CourseService.GetAllAsync` | `Courses` |
| GET | `/api/admin/courses/{id}` | `Authorize` | BE nghiệp vụ | [GetById](../course-registration/CourseRegistration.AdminAPI/Controllers/CoursesController.cs#L72); `CourseService.GetByIdAsync` | `Courses` |
| POST | `/api/admin/courses` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [Create](../course-registration/CourseRegistration.AdminAPI/Controllers/CoursesController.cs#L93); `CourseService.CreateAsync` | `Courses` |
| PUT | `/api/admin/courses/{id}` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [Update](../course-registration/CourseRegistration.AdminAPI/Controllers/CoursesController.cs#L119); `CourseService.UpdateAsync` | `Courses` |
| DELETE | `/api/admin/courses/{id}` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [Delete](../course-registration/CourseRegistration.AdminAPI/Controllers/CoursesController.cs#L145); `CourseService.DeleteAsync` | `Courses` |
| GET | `/api/admin/courses/import-template` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [DownloadImportTemplate](../course-registration/CourseRegistration.AdminAPI/Controllers/CoursesController.cs#L166) | Không truy vấn trực tiếp / xem luồng gọi |
| POST | `/api/admin/courses/upload` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [UploadCourses](../course-registration/CourseRegistration.AdminAPI/Controllers/CoursesController.cs#L192); `CourseService.CreateManyAsync` | `Courses` |

### CourseSectionsController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/admin/course-sections` | `Authorize` | BE nghiệp vụ | [GetCourseSections](../course-registration/CourseRegistration.AdminAPI/Controllers/CourseSectionsController.cs#L72); `SettingsService.GetCourseRegistrationSettingsAsync`, `CourseSectionService.GetPagedCourseSectionsAsync` | `ClassRooms`, `CourseRegistrationSettings`, `CourseSections`, `Courses`, `Lecturers`, `RegistrationPhases`, `StudentInCourseSections` |
| GET | `/api/admin/course-sections/{id}` | `Authorize` | BE nghiệp vụ | [GetCourseSectionById](../course-registration/CourseRegistration.AdminAPI/Controllers/CourseSectionsController.cs#L124); `CourseSectionService.GetByIdAsync` | `ClassRooms`, `CourseSections`, `Courses`, `Lecturers`, `StudentInCourseSections` |
| PUT | `/api/admin/course-sections/{id}` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [UpdateCourseSection](../course-registration/CourseRegistration.AdminAPI/Controllers/CourseSectionsController.cs#L144); `CourseSectionService.UpdateAsync`, `AdminActionLogService.AddLogAsync`, `RedisCacheService.RemoveData`, `SettingsService.GetCourseRegistrationSettingsAsync`, `RedisCacheService.RemoveByPrefixAsync`, `StudentService.GetListStudentIdByCourseSection` | `AdminActionLogs`, `CourseRegistrationSettings`, `CourseSections`, `Courses`, `Lecturers`, `RegistrationPhases`, `StudentInCourseSections` |
| GET | `/api/admin/course-sections/{id}/students` | `Authorize` | BE nghiệp vụ | [GetStudentsInCourseSection](../course-registration/CourseRegistration.AdminAPI/Controllers/CourseSectionsController.cs#L209); `CourseSectionService.GetStudentDetailInCourseSectionAsync`, `CourseSectionService.GetByIdAsync` | `ClassRooms`, `Classes`, `CourseSections`, `Courses`, `Lecturers`, `StudentInCourseSections`, `Students` |
| POST | `/api/admin/course-sections` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [CreateCourseSection](../course-registration/CourseRegistration.AdminAPI/Controllers/CourseSectionsController.cs#L233); `CourseSectionService.CreateAsync`, `CourseSectionService.GetByIdAsync`, `RedisCacheService.RemoveData`, `SettingsService.GetCourseRegistrationSettingsAsync`, `RedisCacheService.RemoveByPrefixAsync`, `StudentService.GetListStudentIdByCourseSection`, `AdminActionLogService.AddLogAsync` | `AdminActionLogs`, `ClassRooms`, `CourseRegistrationSettings`, `CourseSections`, `Courses`, `Lecturers`, `RegistrationPhases`, `StudentInCourseSections` |
| POST | `/api/admin/course-sections/{courseSectionId}/students/{studentId}` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [RegisterStudentToSection](../course-registration/CourseRegistration.AdminAPI/Controllers/CourseSectionsController.cs#L339); `CourseSectionService.GetCourseSectionsByStudentIdAsync`, `CourseSectionService.RemoveStudentFromCourseSectionAsync`, `CourseRegistrationService.RegisterCourseSectionAsync`, `AdminActionLogService.AddLogAsync` | `AdminActionLogs`, `CourseRegistrationSettings`, `CourseSections`, `Courses`, `Lecturers`, `RegistrationPhases`, `StudentInCourseSections` |
| GET | `/api/admin/course-sections/{id}/merge-options` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [GetCanMergeCourseSection](../course-registration/CourseRegistration.AdminAPI/Controllers/CourseSectionsController.cs#L409); `CourseSectionService.GetByIdAsync`, `CourseSectionService.GetCourseSectionsByCourseIdAsync` | `ClassRooms`, `CourseSections`, `Courses`, `Lecturers`, `StudentInCourseSections` |
| POST | `/api/admin/course-sections/{id}/merge/{desCourseSectionId}` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [MergeCourseSection](../course-registration/CourseRegistration.AdminAPI/Controllers/CourseSectionsController.cs#L433); `CourseSectionService.GetByIdAsync`, `CourseSectionService.GetStudentInCourseSectionAsync`, `CourseSectionService.GetCourseSectionsByStudentIdAsync`, `CourseSectionService.MoveStudentToAnotherCourseSectionAsync`, `AdminActionLogService.AddLogAsync` | `AdminActionLogs`, `ClassRooms`, `CourseRegistrationSettings`, `CourseSections`, `Courses`, `Lecturers`, `RegistrationPhases`, `StudentInCourseSections` |
| DELETE | `/api/admin/course-sections/{courseSectionId}/students/{studentId}` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [RemoveStudent](../course-registration/CourseRegistration.AdminAPI/Controllers/CourseSectionsController.cs#L524); `CourseSectionService.RemoveStudentFromCourseSectionAsync`, `AdminActionLogService.AddLogAsync` | `AdminActionLogs`, `CourseRegistrationSettings`, `CourseSections`, `Courses`, `Lecturers`, `RegistrationPhases`, `StudentInCourseSections` |
| POST | `/api/admin/course-sections/{id}/students/bulk` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [SubmitAddStudents](../course-registration/CourseRegistration.AdminAPI/Controllers/CourseSectionsController.cs#L607); `CourseRegistrationService.RegisterCourseSectionAsync`, `RedisCacheService.RemoveKeysAsync` | `CourseRegistrationSettings`, `CourseSections`, `Courses`, `Lecturers`, `RegistrationPhases`, `StudentInCourseSections` |
| GET | `/api/admin/course-sections/students/{studentId}/registered` | `Authorize` | BE nghiệp vụ | [GetCourseSectionsByStudentId](../course-registration/CourseRegistration.AdminAPI/Controllers/CourseSectionsController.cs#L695); `CourseSectionCacheService.GetUnregisteringCourseSectionsByStudentAsync` | `CourseRegistrationSettings`, `CourseSections`, `Courses`, `Lecturers`, `StudentInCourseSections` |
| GET | `/api/admin/course-sections/{id}/students/export` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [ExportStudentsInCourseSection](../course-registration/CourseRegistration.AdminAPI/Controllers/CourseSectionsController.cs#L740); `CourseSectionService.GetByIdAsync`, `CourseSectionService.GetStudentDetailInCourseSectionAsync` | `ClassRooms`, `Classes`, `CourseSections`, `Courses`, `Lecturers`, `StudentInCourseSections`, `Students` |
| PATCH | `/api/admin/course-sections/quick-update-flags` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [QuickUpdateFlags](../course-registration/CourseRegistration.AdminAPI/Controllers/CourseSectionsController.cs#L797); `CourseSectionService.QuickUpdateFlagsAsync`, `CourseSectionService.GetByIdsAsync`, `SettingsService.GetCourseRegistrationSettingsAsync`, `CourseSectionService.GetStudentInCourseSectionsAsync`, `RedisCacheService.RemoveKeysAsync`, `RedisCacheService.RemoveByPrefixAsync` | `CourseRegistrationSettings`, `CourseSections`, `Courses`, `Lecturers`, `RegistrationPhases`, `StudentInCourseSections` |
| GET | `/api/admin/course-sections/export` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [ExportCourseSections](../course-registration/CourseRegistration.AdminAPI/Controllers/CourseSectionsController.cs#L901); `SettingsService.GetCourseRegistrationSettingsAsync`, `CourseSectionService.ExportCourseSectionsAsync` | `CourseRegistrationSettings`, `CourseSections`, `Courses`, `Lecturers`, `RegistrationPhases`, `StudentInCourseSections` |
| GET | `/api/admin/course-sections/registrations/export` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [ExportCourseSectionRegistrations](../course-registration/CourseRegistration.AdminAPI/Controllers/CourseSectionsController.cs#L947); `SettingsService.GetCourseRegistrationSettingsAsync`, `CourseSectionService.ExportCourseSectionRegistrationsAsync` | `Classes`, `CourseRegistrationSettings`, `CourseSections`, `RegistrationPhases`, `StudentInCourseSections`, `Students` |
| POST | `/api/admin/course-sections/students/move` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [MoveStudentsToAnotherCourseSection](../course-registration/CourseRegistration.AdminAPI/Controllers/CourseSectionsController.cs#L994); `CourseSectionService.GetByIdAsync`, `CourseSectionService.MoveSelectedStudentToAnotherCourseSectionAsync`, `AdminActionLogService.AddLogAsync`, `RedisCacheService.RemoveKeysAsync` | `AdminActionLogs`, `ClassRooms`, `CourseRegistrationSettings`, `CourseSections`, `Courses`, `Lecturers`, `RegistrationPhases`, `StudentInCourseSections` |
| GET | `/api/admin/course-sections/students/{studentId}/schedule-conflict/{courseSectionId}` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [CheckStudentScheduleConflict](../course-registration/CourseRegistration.AdminAPI/Controllers/CourseSectionsController.cs#L1115); `CourseSectionService.CheckStudentScheduleConflictAsync` | `CourseSections`, `StudentInCourseSections` |
| GET | `/api/admin/course-sections/import-template` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [DownloadImportTemplate](../course-registration/CourseRegistration.AdminAPI/Controllers/CourseSectionsController.cs#L1151); `CourseSectionService.ExportImportTemplateAsync` | Không truy vấn trực tiếp / xem luồng gọi |
| POST | `/api/admin/course-sections/upload` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [UploadCourseSections](../course-registration/CourseRegistration.AdminAPI/Controllers/CourseSectionsController.cs#L1181); `CourseSectionService.CreateManyAsync`, `AdminActionLogService.AddLogAsync`, `CourseSectionService.GetByIdsAsync`, `SettingsService.GetCourseRegistrationSettingsAsync`, `RedisCacheService.RemoveData`, `RedisCacheService.RemoveByPrefixAsync` | `AdminActionLogs`, `CourseRegistrationSettings`, `CourseSections`, `Courses`, `Lecturers`, `RegistrationPhases`, `StudentInCourseSections` |
| POST | `/api/admin/course-sections/transfer/check-conflicts` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [CheckTransferScheduleConflicts](../course-registration/CourseRegistration.AdminAPI/Controllers/CourseSectionsController.cs#L1363); `CourseSectionService.CheckTransferScheduleConflictsAsync` | `CourseSections`, `StudentInCourseSections` |
| GET | `/api/admin/course-sections/classes/{classId}/schedule-conflicts` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [CheckClassScheduleConflicts](../course-registration/CourseRegistration.AdminAPI/Controllers/CourseSectionsController.cs#L1413); `SettingsService.GetCourseRegistrationSettingsAsync`, `CourseSectionService.CheckClassScheduleConflictsAsync` | `Classes`, `CourseRegistrationSettings`, `CourseSections`, `RegistrationPhases`, `StudentInCourseSections`, `Students` |
| GET | `/api/admin/course-sections/integrated-requirements` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [CheckFacultyIntegratedCourseRequirements](../course-registration/CourseRegistration.AdminAPI/Controllers/CourseSectionsController.cs#L1447); `SettingsService.GetCourseRegistrationSettingsAsync`, `CourseSectionService.CheckFacultyIntegratedCourseRequirementsAsync` | `Classes`, `CourseRegistrationSettings`, `CourseRequirementTypes`, `CourseRequirements`, `CourseSections`, `Courses`, `RegistrationPhases`, `StudentInCourseSections`, `Students` |
| PATCH | `/api/admin/course-sections/quick-update-reserved` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [QuickUpdateReservedCapacity](../course-registration/CourseRegistration.AdminAPI/Controllers/CourseSectionsController.cs#L1482); `CourseSectionService.QuickUpdateReservedCapacityAsync`, `CourseSectionService.GetByIdsAsync`, `SettingsService.GetCourseRegistrationSettingsAsync`, `CourseSectionService.GetStudentInCourseSectionsAsync`, `RedisCacheService.RemoveKeysAsync`, `RedisCacheService.RemoveByPrefixAsync`, `AdminActionLogService.AddLogAsync` | `AdminActionLogs`, `CourseRegistrationSettings`, `CourseSections`, `Courses`, `Lecturers`, `RegistrationPhases`, `StudentInCourseSections` |
| GET | `/api/admin/course-sections/enrollment-years` | `Authorize` | BE nghiệp vụ | [GetDistinctEnrollmentYears](../course-registration/CourseRegistration.AdminAPI/Controllers/CourseSectionsController.cs#L1578); `SettingsService.GetCourseRegistrationSettingsAsync`, `CourseSectionService.GetDistinctEnrollmentYearsAsync` | `CourseRegistrationSettings`, `CourseSections`, `RegistrationPhases` |
| GET | `/api/admin/course-sections/group-codes` | `Authorize` | BE nghiệp vụ | [GetDistinctGroupCodes](../course-registration/CourseRegistration.AdminAPI/Controllers/CourseSectionsController.cs#L1598); `SettingsService.GetCourseRegistrationSettingsAsync`, `CourseSectionService.GetDistinctGroupCodesAsync` | `CourseRegistrationSettings`, `CourseSections`, `RegistrationPhases` |
| GET | `/api/admin/course-sections/buildings` | `Authorize` | BE nghiệp vụ | [GetDistinctBuildings](../course-registration/CourseRegistration.AdminAPI/Controllers/CourseSectionsController.cs#L1618); `SettingsService.GetCourseRegistrationSettingsAsync`, `CourseSectionService.GetDistinctBuildingsAsync` | `CourseRegistrationSettings`, `CourseSections`, `RegistrationPhases` |
| GET | `/api/admin/course-sections/lecturers` | `Authorize` | BE nghiệp vụ | [GetDistinctLecturers](../course-registration/CourseRegistration.AdminAPI/Controllers/CourseSectionsController.cs#L1637); `SettingsService.GetCourseRegistrationSettingsAsync`, `CourseSectionService.GetDistinctLecturersAsync` | `CourseRegistrationSettings`, `CourseSections`, `Lecturers`, `RegistrationPhases` |
| POST | `/api/admin/course-sections/remove-students-from-zero-capacity` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [RemoveStudentsFromZeroCapacitySections](../course-registration/CourseRegistration.AdminAPI/Controllers/CourseSectionsController.cs#L1657); `SettingsService.GetCourseRegistrationSettingsAsync`, `CourseSectionService.RemoveStudentsFromZeroCapacitySectionsAsync`, `RedisCacheService.RemoveData`, `RedisCacheService.RemoveByPrefixAsync`, `AdminActionLogService.AddLogAsync` | `AdminActionLogs`, `CourseRegistrationSettings`, `CourseSections`, `Lecturers`, `RegistrationPhases`, `StudentInCourseSections`, `Students` |
| GET | `/api/admin/course-sections/{id}/registration-history/export` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [ExportCourseSectionRegistrationHistory](../course-registration/CourseRegistration.AdminAPI/Controllers/CourseSectionsController.cs#L1748); `CourseSectionService.GetByIdAsync`, `CourseRegistrationLogService.GetLogsByCourseSectionIdAsync`, `AdminActionLogService.GetStudentActionLogsByCourseSectionIdAsync` | `AdminActionLogs`, `ClassRooms`, `Classes`, `CourseRegistrationLogs`, `CourseSections`, `Courses`, `Lecturers`, `StudentCreditLimits`, `StudentInCourseSections`, `Students`, `Users` |
| GET | `/api/admin/course-sections/registrations/export-sql` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [ExportCourseSectionRegistrationsAsSql](../course-registration/CourseRegistration.AdminAPI/Controllers/CourseSectionsController.cs#L1798); `SettingsService.GetCourseRegistrationSettingsAsync`, `CourseSectionService.ExportCourseSectionRegistrationsAsSqlAsync` | `Classes`, `CourseRegistrationSettings`, `CourseSections`, `RegistrationPhases`, `StudentInCourseSections`, `Students` |
| GET | `/api/admin/course-sections/registrations/export-student-summary` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [ExportStudentRegistrationSummary](../course-registration/CourseRegistration.AdminAPI/Controllers/CourseSectionsController.cs#L1839); `SettingsService.GetCourseRegistrationSettingsAsync`, `CourseSectionService.ExportStudentRegistrationSummaryAsync` | `CourseRegistrationSettings`, `CourseSections`, `Courses`, `Faculties`, `Programs`, `RegistrationPhases`, `Semesters`, `StudentInCourseSections`, `Students` |
| GET | `/api/admin/course-sections/students/bulk-register/import-template` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [DownloadBulkRegisterTemplate](../course-registration/CourseRegistration.AdminAPI/Controllers/CourseSectionsController.cs#L1886) | Không truy vấn trực tiếp / xem luồng gọi |
| POST | `/api/admin/course-sections/students/bulk-register/upload` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [UploadBulkRegisterStudents](../course-registration/CourseRegistration.AdminAPI/Controllers/CourseSectionsController.cs#L1912); `CourseSectionService.BulkRegisterStudentsAsync`, `RedisCacheService.RemoveKeysAsync`, `AdminActionLogService.AddLogAsync` | `AdminActionLogs`, `CourseRegistrationSettings`, `CourseSections`, `Courses`, `Lecturers`, `RegistrationPhases`, `StudentInCourseSections` |

### FacultiesController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/admin/faculties` | `Authorize` | BE nghiệp vụ | [GetFaculties](../course-registration/CourseRegistration.AdminAPI/Controllers/FacultiesController.cs#L23); `FacultyService.GetAllAsync`, `FacultyService.GetOfDUTAsync`, `FacultyService.GetNotOfDUTAsync` | `Faculties` |
| POST | `/api/admin/faculties/upload` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [CreateFromExcel](../course-registration/CourseRegistration.AdminAPI/Controllers/FacultiesController.cs#L61); `FacultyService.CreateManyAsync` | `Faculties` |
| GET | `/api/admin/faculties/{id}` | `Authorize` | BE nghiệp vụ | [GetDetails](../course-registration/CourseRegistration.AdminAPI/Controllers/FacultiesController.cs#L106); `FacultyService.GetByIdAsync` | `Faculties` |
| PUT | `/api/admin/faculties/{id}` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [UpdateFaculty](../course-registration/CourseRegistration.AdminAPI/Controllers/FacultiesController.cs#L129); `FacultyService.UpdateAsync` | `Faculties` |
| DELETE | `/api/admin/faculties/{id}` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [DeleteFaculty](../course-registration/CourseRegistration.AdminAPI/Controllers/FacultiesController.cs#L157); `FacultyService.DeleteAsync` | `Faculties` |

### MajorsController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/admin/majors` | `Authorize` | BE nghiệp vụ | [GetMajors](../course-registration/CourseRegistration.AdminAPI/Controllers/MajorsController.cs#L23); `MajorService.GetPagedMajorsAsync` | `Majors` |
| GET | `/api/admin/majors/all` | `Authorize` | BE nghiệp vụ | [GetAllMajors](../course-registration/CourseRegistration.AdminAPI/Controllers/MajorsController.cs#L47); `MajorService.GetAllAsync` | `Majors` |

### ProgramsController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/admin/programs/{id}/courses` | `Authorize` | BE nghiệp vụ | [GetProgramCourses](../course-registration/CourseRegistration.AdminAPI/Controllers/ProgramsController.cs#L55); `AcademicProgramService.GetDetailByIdAsync` | `CourseInPrograms`, `CourseRequirements`, `Courses`, `Faculties`, `Majors`, `Programs`, `Semesters` |
| POST | `/api/admin/programs/{id}/sync-courses` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ + SQL nguồn | [SyncCourses](../course-registration/CourseRegistration.AdminAPI/Controllers/ProgramsController.cs#L74); `DataResource.GetProgramCoursesAsync`, `DataResource.GetProgramRequirementsAsync`, `AcademicProgramService.SyncProgramCoursesAsync` | `CourseInPrograms`, `CourseRequirements`, `Students`, `source.tmHocphanDK`, `source.tmKhungCT` |
| GET | `/api/admin/programs/bulk-alternative-courses/preview` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [GetBulkAlternativeCoursePreview](../course-registration/CourseRegistration.AdminAPI/Controllers/ProgramsController.cs#L104); `AcademicProgramService.GetBulkAlternativeCoursePreviewAsync` | `AlternativeCourses`, `CourseInPrograms`, `Courses`, `Faculties`, `Majors`, `Programs` |
| POST | `/api/admin/programs/bulk-alternative-courses/apply` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [BulkCreateAlternativeCourses](../course-registration/CourseRegistration.AdminAPI/Controllers/ProgramsController.cs#L133); `AcademicProgramService.BulkCreateAlternativeCoursesAsync`, `AdminActionLogService.AddLogAsync` | `AdminActionLogs`, `AlternativeCourses`, `CourseInPrograms`, `Courses`, `Programs`, `Students` |
| GET | `/api/admin/programs/{programId}/courses/{courseId}/alternative` | `Authorize` | BE nghiệp vụ | [GetAlternativeCourses](../course-registration/CourseRegistration.AdminAPI/Controllers/ProgramsController.cs#L192); `AcademicProgramService.GetAlternativeCoursesAsync` | `AlternativeCourses`, `CourseInPrograms`, `Courses` |
| POST | `/api/admin/programs/{programId}/courses/{courseId}/alternative` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [CreateAlternativeCourse](../course-registration/CourseRegistration.AdminAPI/Controllers/ProgramsController.cs#L206); `AcademicProgramService.CreateAlternativeCoursesAsync`, `AdminActionLogService.AddLogAsync` | `AdminActionLogs`, `AlternativeCourses`, `CourseInPrograms`, `Courses`, `Students` |
| PUT | `/api/admin/programs/{programId}/alternative-courses/{alternativeId:int}` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [UpdateAlternativeCourse](../course-registration/CourseRegistration.AdminAPI/Controllers/ProgramsController.cs#L262); `AcademicProgramService.UpdateAlternativeCourseAsync` | `AlternativeCourses`, `CourseInPrograms`, `Courses`, `Students` |
| DELETE | `/api/admin/programs/{programId}/alternative-courses/{alternativeId:int}` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [DeleteAlternativeCourse](../course-registration/CourseRegistration.AdminAPI/Controllers/ProgramsController.cs#L289); `AcademicProgramService.DeleteAlternativeCourseAsync`, `AdminActionLogService.AddLogAsync` | `AdminActionLogs`, `AlternativeCourses`, `CourseInPrograms`, `Students` |
| POST | `/api/admin/programs/{programId}/courses` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [AddCourseToProgram](../course-registration/CourseRegistration.AdminAPI/Controllers/ProgramsController.cs#L320); `AcademicProgramService.AddCourseToProgramAsync` | `CourseInPrograms`, `Courses`, `Programs`, `Students` |
| POST | `/api/admin/programs/{programId}/courses/{courseId}/requirements` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [CreateCourseRequirement](../course-registration/CourseRegistration.AdminAPI/Controllers/ProgramsController.cs#L346); `AcademicProgramService.CreateCourseRequirementAsync` | `CourseInPrograms`, `CourseRequirements`, `Courses` |
| PUT | `/api/admin/programs/{programId}/requirements/{requirementId:int}` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [UpdateCourseRequirement](../course-registration/CourseRegistration.AdminAPI/Controllers/ProgramsController.cs#L373); `AcademicProgramService.UpdateCourseRequirementAsync` | `CourseInPrograms`, `CourseRequirements`, `Courses` |
| DELETE | `/api/admin/programs/{programId}/requirements/{requirementId:int}` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [DeleteCourseRequirement](../course-registration/CourseRegistration.AdminAPI/Controllers/ProgramsController.cs#L400); `AcademicProgramService.DeleteCourseRequirementAsync` | `CourseRequirements` |
| GET | `/api/admin/programs` | `Authorize` | BE nghiệp vụ | [GetPrograms](../course-registration/CourseRegistration.AdminAPI/Controllers/ProgramsController.cs#L421); `AcademicProgramService.GetPagedProgramsAsync` | `Faculties`, `Majors`, `Programs` |
| GET | `/api/admin/programs/{id}` | `Authorize` | BE nghiệp vụ | [GetById](../course-registration/CourseRegistration.AdminAPI/Controllers/ProgramsController.cs#L445); `AcademicProgramService.GetByIdAsync` | `Faculties`, `Majors`, `Programs`, `Semesters` |
| GET | `/api/admin/programs/{programId}/alternative-courses` | `Authorize` | BE nghiệp vụ | [GetAllAlternativeCourses](../course-registration/CourseRegistration.AdminAPI/Controllers/ProgramsController.cs#L465); `AcademicProgramService.GetAllAlternativeCoursesByProgramAsync` | `AlternativeCourses`, `CourseInPrograms`, `Courses` |

### RegistrationPhasesController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/admin/registration-phases` | `Authorize` | BE nghiệp vụ | [GetAll](../course-registration/CourseRegistration.AdminAPI/Controllers/RegistrationPhasesController.cs#L29); `RegistrationPhaseService.GetAllAsync` | `RegistrationPhaseTimes`, `RegistrationPhases` |
| GET | `/api/admin/registration-phases/{id}` | `Authorize` | BE nghiệp vụ | [GetById](../course-registration/CourseRegistration.AdminAPI/Controllers/RegistrationPhasesController.cs#L50); `RegistrationPhaseService.GetAllAsync` | `RegistrationPhaseTimes`, `RegistrationPhases` |
| POST | `/api/admin/registration-phases` | `Authorize + Authorize(Roles = "Admin")` | BE nghiệp vụ | [Create](../course-registration/CourseRegistration.AdminAPI/Controllers/RegistrationPhasesController.cs#L72); `RegistrationPhaseService.CreateAsync` | `RegistrationPhaseTimes`, `RegistrationPhases` |
| PUT | `/api/admin/registration-phases/{id}` | `Authorize + Authorize(Roles = "Admin")` | BE nghiệp vụ | [Update](../course-registration/CourseRegistration.AdminAPI/Controllers/RegistrationPhasesController.cs#L95); `RegistrationPhaseService.UpdateAsync`, `SettingsService.RemoveAllSettingsCacheAsync` | `RegistrationPhaseTimes`, `RegistrationPhases` |
| DELETE | `/api/admin/registration-phases/{id}` | `Authorize + Authorize(Roles = "Admin")` | BE nghiệp vụ | [Delete](../course-registration/CourseRegistration.AdminAPI/Controllers/RegistrationPhasesController.cs#L132); `RegistrationPhaseService.DeleteAsync` | `RegistrationPhases` |

### ReserveManagementController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/admin/reserve-management` | `Authorize` | BE nghiệp vụ | [GetPendingReserves](../course-registration/CourseRegistration.AdminAPI/Controllers/ReserveManagementController.cs#L48); `CourseRegistrationService.GetPendingBackupRegistrationsAsync` | `ClassRooms`, `CourseSections`, `Courses`, `StudentInCourseSections`, `Students` |
| POST | `/api/admin/reserve-management/approve` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [Approve](../course-registration/CourseRegistration.AdminAPI/Controllers/ReserveManagementController.cs#L75); `CourseRegistrationService.BulkApproveBackupRegistrationsAsync`, `AdminActionLogService.AddLogAsync`, `CourseSectionService.GetByIdAsync`, `RedisCacheService.RemoveData`, `AcademicProgramService.GetListProgramHavingCourseId`, `SettingsService.GetCourseRegistrationSettingsAsync`, `StudentService.GetListStudentIdByCourseSection` | `AdminActionLogs`, `ClassRooms`, `CourseInPrograms`, `CourseRegistrationSettings`, `CourseSections`, `Courses`, `Lecturers`, `RegistrationPhases`, `StudentInCourseSections` |
| POST | `/api/admin/reserve-management/reject` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [Reject](../course-registration/CourseRegistration.AdminAPI/Controllers/ReserveManagementController.cs#L163); `CourseRegistrationService.BulkRejectBackupRegistrationsAsync`, `AdminActionLogService.AddLogAsync`, `CourseSectionService.GetByIdAsync`, `RedisCacheService.RemoveData`, `AcademicProgramService.GetListProgramHavingCourseId`, `SettingsService.GetCourseRegistrationSettingsAsync` | `AdminActionLogs`, `ClassRooms`, `CourseInPrograms`, `CourseRegistrationSettings`, `CourseSections`, `Courses`, `Lecturers`, `RegistrationPhases`, `StudentInCourseSections` |
| POST | `/api/admin/reserve-management/reject-all` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [RejectAll](../course-registration/CourseRegistration.AdminAPI/Controllers/ReserveManagementController.cs#L254); `CourseRegistrationService.GetPendingBackupRegistrationsAsync`, `CourseRegistrationService.RejectAllBackupRegistrationsAsync`, `AdminActionLogService.AddLogAsync`, `SettingsService.GetCourseRegistrationSettingsAsync`, `CourseSectionService.GetByIdAsync`, `RedisCacheService.RemoveData`, `AcademicProgramService.GetListProgramHavingCourseId` | `AdminActionLogs`, `ClassRooms`, `CourseInPrograms`, `CourseRegistrationSettings`, `CourseSections`, `Courses`, `Lecturers`, `RegistrationPhases`, `StudentInCourseSections`, `Students` |

### SemestersController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/admin/semesters` | `Authorize` | BE nghiệp vụ | [GetSemesters](../course-registration/CourseRegistration.AdminAPI/Controllers/SemestersController.cs#L25); `SemesterService.GetPagedSemestersAsync` | `Semesters` |
| GET | `/api/admin/semesters/all` | `Authorize` | BE nghiệp vụ | [GetAllSemesters](../course-registration/CourseRegistration.AdminAPI/Controllers/SemestersController.cs#L49); `SemesterService.GetAllAsync` | `Semesters` |
| GET | `/api/admin/semesters/current` | `Authorize` | BE nghiệp vụ | [GetCurrentSemester](../course-registration/CourseRegistration.AdminAPI/Controllers/SemestersController.cs#L63); `SettingsService.GetCurrentAcademicYearCodeAsync` | `CourseRegistrationSettings` |
| POST | `/api/admin/semesters` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [CreateSemester](../course-registration/CourseRegistration.AdminAPI/Controllers/SemestersController.cs#L81); `SemesterService.CreateAsync` | `Semesters` |
| PUT | `/api/admin/semesters/set-current/{id}` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [SetCurrentSemester](../course-registration/CourseRegistration.AdminAPI/Controllers/SemestersController.cs#L112); `SettingsService.SetCurrentAcademicYearCodeAsync` | `CourseRegistrationSettings` |

### StudentsController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/admin/students` | `Authorize` | BE nghiệp vụ | [GetStudents](../course-registration/CourseRegistration.AdminAPI/Controllers/StudentsController.cs#L55); `StudentService.GetPagedStudentsAsync` | `Classes`, `CourseRegistrationSettings`, `CourseSections`, `Courses`, `Lecturers`, `StudentInCourseSections`, `Students`, `Users` |
| GET | `/api/admin/students/{studentId}` | `Authorize` | BE nghiệp vụ | [GetStudentDetails](../course-registration/CourseRegistration.AdminAPI/Controllers/StudentsController.cs#L75); `SettingsService.GetCourseRegistrationSettingsAsync`, `StudentService.GetByIdAsync` | `Classes`, `CourseRegistrationSettings`, `RegistrationPhases`, `StudentCreditLimits`, `Students`, `Users` |
| PUT | `/api/admin/students/{studentId}` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [UpdateStudent](../course-registration/CourseRegistration.AdminAPI/Controllers/StudentsController.cs#L98); `StudentService.UpdateAsync`, `RedisCacheService.RemoveData` | `Students` |
| GET | `/api/admin/students/{studentId}/grades` | `Authorize` | BE nghiệp vụ | [GetGrades](../course-registration/CourseRegistration.AdminAPI/Controllers/StudentsController.cs#L118); `SettingsService.GetCourseRegistrationSettingsAsync`, `StudentService.GetByIdAsync`, `StudentGradeService.GetDetailByStudentIdAsync` | `Classes`, `CourseExemptions`, `CourseRegistrationSettings`, `CourseSections`, `Courses`, `RegistrationPhases`, `StudentCreditLimits`, `StudentGrades`, `Students`, `Users` |
| GET | `/api/admin/students/{studentId}/history` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [GetHistory](../course-registration/CourseRegistration.AdminAPI/Controllers/StudentsController.cs#L143); `SettingsService.GetCourseRegistrationSettingsAsync`, `StudentService.GetByIdAsync`, `CourseRegistrationLogService.GetListByStudentIdAsync` | `Classes`, `CourseRegistrationLogs`, `CourseRegistrationSettings`, `RegistrationPhases`, `StudentCreditLimits`, `Students`, `Users` |
| POST | `/api/admin/students/{studentId}/reset-password` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [ResetPassword](../course-registration/CourseRegistration.AdminAPI/Controllers/StudentsController.cs#L166); `UserService.AdminResetPassAsync` | `AcademicAffairs`, `Lecturers`, `Users`, `Viewers` |
| GET | `/api/admin/students/unlock-website/template` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [ExportUnlockWebsiteTemplate](../course-registration/CourseRegistration.AdminAPI/Controllers/StudentsController.cs#L187) | Không truy vấn trực tiếp / xem luồng gọi |
| POST | `/api/admin/students/unlock-website/import` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [ImportUnlockWebsiteStudents](../course-registration/CourseRegistration.AdminAPI/Controllers/StudentsController.cs#L207); `StudentService.UnlockWebsiteByExcelAsync`, `RedisCacheService.RemoveData` | `Students` |
| GET | `/api/admin/students/export-no-password` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [ExportStudentsWithoutPassword](../course-registration/CourseRegistration.AdminAPI/Controllers/StudentsController.cs#L255); `StudentService.GetStudentsWithoutPasswordAsync` | `Classes`, `Students`, `Users` |
| PUT | `/api/admin/students/{studentId}/academic-program` | `Authorize` | BE nghiệp vụ | [UpdateAcademicProgram](../course-registration/CourseRegistration.AdminAPI/Controllers/StudentsController.cs#L275); `StudentService.UpdateAcademicProgramAsync` | `Students` |
| GET | `/api/admin/students/locked-website/export` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [ExportLockedWebsiteStudents](../course-registration/CourseRegistration.AdminAPI/Controllers/StudentsController.cs#L305); `StudentService.GetLockedWebsiteStudentsAsync` | `Students` |
| POST | `/api/admin/students/sync-lock-web` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [SyncLockWebsiteStudents](../course-registration/CourseRegistration.AdminAPI/Controllers/StudentsController.cs#L327); `StudentService.SyncLockWebsiteByExcelAsync`, `RedisCacheService.RemoveData` | `Students` |
| GET | `/api/admin/students/export-all` | `Authorize + Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [ExportAllStudents](../course-registration/CourseRegistration.AdminAPI/Controllers/StudentsController.cs#L371); `StudentService.GetAllStudentsForExportAsync` | `Classes`, `CourseRegistrationSettings`, `CourseSections`, `Courses`, `Lecturers`, `StudentInCourseSections`, `Students`, `Users` |

### TrackingController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/admin/tracking` | `Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [GetTrackingStatus](../course-registration/CourseRegistration.AdminAPI/Controllers/TrackingController.cs#L26); `TrackingCacheService.GetLatestRequestCount`, `TrackingCacheService.GetRegistrationHandlerCount`, `TrackingCacheService.GetRegistrationRequestCount`, `TrackingCacheService.GetRegisteredStudentCount` | Không truy vấn trực tiếp / xem luồng gọi |
| GET | `/api/admin/tracking/registration-requests/statistics` | `Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [GetRegistrationRequestStatistics](../course-registration/CourseRegistration.AdminAPI/Controllers/TrackingController.cs#L60); `CourseRegistrationLogService.GetRegistrationRequestStatisticsAsync` | `CourseRegistrationLogs` |
| GET | `/api/admin/tracking/registration-requests/logs` | `Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [GetRegistrationRequestLogs](../course-registration/CourseRegistration.AdminAPI/Controllers/TrackingController.cs#L79); `CourseRegistrationLogService.GetPagedRegistrationRequestLogsAsync` | `CourseRegistrationLogs` |
| GET | `/api/admin/tracking/registration-requests/group-statistics` | `Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [GetRegistrationRequestGroupStatistics](../course-registration/CourseRegistration.AdminAPI/Controllers/TrackingController.cs#L97); `CourseRegistrationLogService.GetRegistrationRequestGroupStatisticsAsync` | `CourseRegistrationLogs` |
| GET | `/api/admin/tracking/student-registration-ratio` | `Authorize(Roles = "Admin,AcademicAffairs")` | BE nghiệp vụ | [GetStudentRegistrationRatio](../course-registration/CourseRegistration.AdminAPI/Controllers/TrackingController.cs#L115); `CourseRegistrationLogService.GetStudentRegistrationRatioAsync` | `CourseRegistrationLogs`, `Students` |

## course-registration — RegistrationConsumer

1 action HTTP.

### SignalRController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/SignalR/Test` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [Get](../course-registration/CourseRegistration.RegistrationConsumer/Controllers/SignalRController.cs#L23) | Không truy vấn trực tiếp / xem luồng gọi |

## plo-clo-backend

308 action HTTP.

### AccountController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/accounts` | `HasPermission(Permissions.Accounts.View)` | BE nghiệp vụ | [GetAll](../plo-clo-backend/Controllers/AccountController.cs#L41); `AccountService.GetFilteredAccountsAsync` | `Accounts` |
| GET | `/api/accounts/paged` | `HasPermission(Permissions.Accounts.View)` | BE nghiệp vụ | [GetPaged](../plo-clo-backend/Controllers/AccountController.cs#L53) | Không truy vấn trực tiếp / xem luồng gọi |
| GET | `/api/accounts/{id}` | `Authorize` | BE nghiệp vụ | [GetById](../plo-clo-backend/Controllers/AccountController.cs#L71); `RecordAccessService.EnsureCanSeeAccount`, `AccountService.GetAccountByIdAsync` | `Accounts` |
| POST | `/api/accounts` | `HasPermission(Permissions.Accounts.Manage)` | BE nghiệp vụ | [Create](../plo-clo-backend/Controllers/AccountController.cs#L85); `AccountService.CreateAccountAsync` | `Accounts`, `RolePermissions`, `Roles` |
| PUT | `/api/accounts/{id}` | `HasPermission(Permissions.Accounts.Edit)` | BE nghiệp vụ | [Update](../plo-clo-backend/Controllers/AccountController.cs#L100); `AccountService.UpdateAccountAsync` | `Accounts`, `RolePermissions`, `Roles`, `Students`, `Teachers` |
| POST | `/api/accounts/login` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [Login](../plo-clo-backend/Controllers/AccountController.cs#L109); `AccountService.Login` | `Accounts`, `RolePermissions`, `Roles`, `Students`, `Teachers` |
| DELETE | `/api/accounts/{id}` | `HasPermission(Permissions.Accounts.Manage)` | BE nghiệp vụ | [DeleteAccount](../plo-clo-backend/Controllers/AccountController.cs#L126); `AccountService.DeleteAccountAsync` | `Accounts`, `RolePermissions`, `Roles`, `Students`, `Teachers` |
| PATCH | `/api/accounts/password` | `Authorize` | BE nghiệp vụ | [ChangePassword](../plo-clo-backend/Controllers/AccountController.cs#L141); `AccountService.ChangePassword` | `Accounts` |
| PATCH | `/api/accounts/{id}/resetPassword` | `HasPermission(Permissions.Accounts.ResetPassword)` | BE nghiệp vụ | [ResetPassword](../plo-clo-backend/Controllers/AccountController.cs#L154); `AccountService.ResetPasswordForStudentTeacher`, `AccountService.ResetPassword` | `Accounts`, `RolePermissions`, `Roles` |
| POST | `/api/accounts/login/microsoft` | `Authorize(Policy = "Microsoft")` | BE nhận/đổi token SSO | [MicrosoftLogin](../plo-clo-backend/Controllers/AccountController.cs#L171); `AccountService.LoginWithMicrosoftAsync` | `Accounts`, `RolePermissions`, `Roles`, `Students`, `Teachers` |
| POST | `/api/accounts/session` | `Authorize` | BE nghiệp vụ | [EstablishSession](../plo-clo-backend/Controllers/AccountController.cs#L204); `RefreshTokenService.RevokeAsync`, `RefreshTokenService.IssueAsync` | `RefreshTokens` |
| POST | `/api/accounts/refresh` | `Không cần access JWT; cần refresh cookie hợp lệ` | BE nghiệp vụ | [Refresh](../plo-clo-backend/Controllers/AccountController.cs#L243); `RefreshTokenService.RotateAsync`, `AccountService.GetAccountByIdAsync`, `TokenService.CreateToken` | `Accounts`, `RefreshTokens`, `RolePermissions`, `Roles`, `Students`, `Teachers` |
| POST | `/api/accounts/logout` | `Không cần access JWT; xử lý theo refresh cookie` | BE nghiệp vụ | [LogoutSession](../plo-clo-backend/Controllers/AccountController.cs#L265); `RefreshTokenService.RevokeAsync` | `RefreshTokens` |
| GET | `/api/accounts/sessions` | `Không cần access JWT; xử lý theo refresh cookie` | BE nghiệp vụ | [ListSessions](../plo-clo-backend/Controllers/AccountController.cs#L276) | Không truy vấn trực tiếp / xem luồng gọi |

### ChildExamSessionController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/child-exam-sessions` | `HasPermission(Permissions.ExamSessions.View, Permissions.ExamSessions.ViewAll)` | BE nghiệp vụ | [GetAll](../plo-clo-backend/Controllers/ChildExamSessionController.cs#L35); `ChildExamSessionService.GetFilteredChildExamSessionAsync` | `ChildExamSessions`, `CorrectedResults`, `Students` |
| GET | `/api/child-exam-sessions/{id}` | `HasPermission(Permissions.ExamSessions.View, Permissions.ExamSessions.ViewAll)` | BE nghiệp vụ | [GetById](../plo-clo-backend/Controllers/ChildExamSessionController.cs#L60); `RecordAccessService.EnsureCanSeeChildExamSessionAsync`, `ChildExamSessionService.GetChildExamSessionByIdAsync` | `ChildExamSessions` |
| POST | `/api/child-exam-sessions` | `HasPermission(Permissions.ExamSessions.Manage)` | BE nghiệp vụ | [Create](../plo-clo-backend/Controllers/ChildExamSessionController.cs#L74); `ChildExamSessionService.CreateChildExamSessionAsync` | `Accounts`, `ChildExamSessions` |
| PUT | `/api/child-exam-sessions/{id}` | `HasPermission(Permissions.ExamSessions.Manage)` | BE nghiệp vụ | [Update](../plo-clo-backend/Controllers/ChildExamSessionController.cs#L86); `ChildExamSessionService.UpdateChildExamSessionAsync` | `ChildExamSessions` |
| DELETE | `/api/child-exam-sessions/{id}` | `HasPermission(Permissions.ExamSessions.Manage)` | BE nghiệp vụ | [Delete](../plo-clo-backend/Controllers/ChildExamSessionController.cs#L97); `ChildExamSessionService.DeleteChildExamSessionAsync` | `ChildExamSessions` |
| GET | `/api/child-exam-sessions/{id}/students` | `HasPermission(Permissions.ExamSessions.View, Permissions.ExamSessions.ViewAll)` | BE nghiệp vụ | [GetStudents](../plo-clo-backend/Controllers/ChildExamSessionController.cs#L108); `RecordAccessService.EnsureCanSeeChildExamSessionAsync`, `ChildExamSessionService.GetStudentsInChildExamSessionAsync` | `ChildExamSessions`, `StudentChildExamSessions`, `Students` |
| GET | `/api/child-exam-sessions/{id}/unassigned-students` | `HasPermission(Permissions.ExamSessions.Manage)` | BE nghiệp vụ | [GetUnassignedStudents](../plo-clo-backend/Controllers/ChildExamSessionController.cs#L135); `ChildExamSessionService.GetUnassignedStudentsForChildExamSessionAsync` | `ChildExamSessions`, `ClassStudent`, `Classes`, `StudentChildExamSessions`, `Students` |
| POST | `/api/child-exam-sessions/{id}/students` | `HasPermission(Permissions.ExamSessions.Manage)` | BE nghiệp vụ | [AddStudents](../plo-clo-backend/Controllers/ChildExamSessionController.cs#L146); `ChildExamSessionService.AddStudentsToChildExamSessionAsync` | `ChildExamSessions`, `StudentChildExamSessions`, `Students` |
| DELETE | `/api/child-exam-sessions/{id}/students` | `HasPermission(Permissions.ExamSessions.Manage)` | BE nghiệp vụ | [RemoveStudent](../plo-clo-backend/Controllers/ChildExamSessionController.cs#L157); `ChildExamSessionService.RemoveStudentsFromChildExamSessionAsync` | `ChildExamSessions`, `Exams`, `Results`, `Students` |

### ClassController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/classes` | `Authorize` | BE nghiệp vụ | [GetAll](../plo-clo-backend/Controllers/ClassController.cs#L41); `ClassService.GetFilteredClassAsync` | `ClassStudent`, `Classes`, `CorrectedResults`, `Students` |
| GET | `/api/classes/paged` | `HasPermission(Permissions.Classes.View, Permissions.Classes.ViewAll)` | BE nghiệp vụ | [GetPaged](../plo-clo-backend/Controllers/ClassController.cs#L58) | `Classes` |
| GET | `/api/classes/ids` | `HasPermission(Permissions.Classes.View, Permissions.Classes.ViewAll)` | BE nghiệp vụ | [GetIds](../plo-clo-backend/Controllers/ClassController.cs#L86); `ClassService.GetFilteredClassIdsAsync` | `ClassStudent`, `Classes`, `CorrectedResults`, `Faculties`, `Students` |
| GET | `/api/classes/groups` | `HasPermission(Permissions.Classes.View, Permissions.Classes.ViewAll)` | BE nghiệp vụ | [GetGroups](../plo-clo-backend/Controllers/ClassController.cs#L113); `ClassService.GetDistinctClassGroupsAsync` | `Classes` |
| GET | `/api/classes/enrollment-years` | `HasPermission(Permissions.Classes.View, Permissions.Classes.ViewAll)` | BE nghiệp vụ | [GetEnrollmentYears](../plo-clo-backend/Controllers/ClassController.cs#L124); `ClassService.GetDistinctClassEnrollmentYearsAsync` | `Classes` |
| GET | `/api/classes/{id}` | `Authorize` | BE nghiệp vụ | [GetById](../plo-clo-backend/Controllers/ClassController.cs#L154); `ClassService.GetClassByIdAsync` | `Classes` |
| GET | `/api/classes/code/{code}/id` | `Authorize` | BE nghiệp vụ | [GetIdByCode](../plo-clo-backend/Controllers/ClassController.cs#L168); `ClassService.GetClassIdByCodeAsync` | `Classes` |
| POST | `/api/classes` | `HasPermission(Permissions.Classes.Manage)` | BE nghiệp vụ | [Create](../plo-clo-backend/Controllers/ClassController.cs#L181); `ClassService.CreateClassAsync` | `Classes`, `Courses`, `Semesters`, `Teachers` |
| POST | `/api/classes/external` | `HasPermission(Permissions.Integration.SyncClasses, AuthenticationSchemes = "CustomJWT,ApiKey")` | BE API tích hợp | [CreateExternal](../plo-clo-backend/Controllers/ClassController.cs#L194); `ClassService.CreateClassExternalAsync` | `Classes`, `Courses`, `Semesters`, `Teachers` |
| PUT | `/api/classes/external/{classCode}/students` | `HasPermission(Permissions.Integration.SyncClasses, AuthenticationSchemes = "CustomJWT,ApiKey")` | BE API tích hợp | [UpdateStudentsExternal](../plo-clo-backend/Controllers/ClassController.cs#L211); `ClassService.SyncStudentsToClassByCodeAsync` | `ClassStudent`, `Classes`, `Exams`, `Results`, `Students` |
| PUT | `/api/classes/{id}` | `HasPermission(Permissions.Classes.Manage)` | BE nghiệp vụ | [Update](../plo-clo-backend/Controllers/ClassController.cs#L222); `ClassService.UpdateClassAsync` | `Classes` |
| DELETE | `/api/classes/{id}` | `HasPermission(Permissions.Classes.Manage)` | BE nghiệp vụ | [Delete](../plo-clo-backend/Controllers/ClassController.cs#L234); `ClassService.DeleteClassAsync` | `Classes` |
| GET | `/api/classes/{id}/students` | `HasPermission(Permissions.Classes.View, Permissions.Classes.ViewAll)` | BE nghiệp vụ | [GetStudents](../plo-clo-backend/Controllers/ClassController.cs#L246); `RecordAccessService.EnsureCanSeeClassAsync`, `ClassService.GetStudentsInClassAsync` | `ClassStudent`, `Classes`, `Students` |
| POST | `/api/classes/{id}/students` | `HasPermission(Permissions.Classes.Manage)` | BE nghiệp vụ | [AddStudents](../plo-clo-backend/Controllers/ClassController.cs#L261); `ClassService.AddStudentsToClassAsync` | `ClassStudent`, `Classes`, `Students` |
| DELETE | `/api/classes/{id}/students` | `HasPermission(Permissions.Classes.Manage)` | BE nghiệp vụ | [RemoveStudent](../plo-clo-backend/Controllers/ClassController.cs#L272); `ClassService.RemoveStudentsFromClassAsync` | `ClassStudent`, `Classes`, `Exams`, `Results`, `Students` |
| PUT | `/api/classes/{id}/grade-composition` | `HasPermission(Permissions.Exams.Manage)` | BE nghiệp vụ | [UpdateGradeComposition](../plo-clo-backend/Controllers/ClassController.cs#L285); `ExamService.UpdateGradeComposition` | `Classes`, `Exams`, `Questions` |
| GET | `/api/classes/external/{classCode}/grade-composition` | `HasPermission(Permissions.Integration.ReadScores, AuthenticationSchemes = "CustomJWT,ApiKey")` | BE API tích hợp | [GetGradeCompositionExternal](../plo-clo-backend/Controllers/ClassController.cs#L295); `ExamService.GetGradeCompositionByCodeAsync` | `Classes`, `Exams`, `Questions` |
| GET | `/api/classes/external/{classCode}/scores` | `HasPermission(Permissions.Integration.ReadScores, AuthenticationSchemes = "CustomJWT,ApiKey")` | BE API tích hợp | [GetClassScoresExternal](../plo-clo-backend/Controllers/ClassController.cs#L305); `ExamService.GetClassScoresByCodeAsync` | `Classes`, `Exams`, `StudentExam` |
| PUT | `/api/classes/external/{classCode}/grade-composition` | `HasPermission(Permissions.Integration.SyncClasses, AuthenticationSchemes = "CustomJWT,ApiKey")` | BE API tích hợp | [UpdateGradeCompositionExternal](../plo-clo-backend/Controllers/ClassController.cs#L316); `ExamService.UpdateGradeCompositionByCodeAsync` | `Classes`, `Exams`, `Questions` |
| POST | `/api/classes/{targetClassId}/copy-structure` | `HasPermission(Permissions.Questions.Edit) + HasPermission(Permissions.QuestionClos.Map)` | BE nghiệp vụ | [CopyClassStructure](../plo-clo-backend/Controllers/ClassController.cs#L328); `ClassService.CopyClassStructureAsync` | `CLOQuestion`, `CLOs`, `Classes`, `Exams`, `Questions`, `Results` |
| PATCH | `/api/classes/is-core` | `HasPermission(Permissions.Classes.SetCore)` | BE nghiệp vụ | [UpdateClassesIsCoreStatus](../plo-clo-backend/Controllers/ClassController.cs#L340); `ClassService.UpdateClassesIsCoreStatus` | `Classes` |
| PATCH | `/api/classes/set-core-old-classes` | `HasPermission(Permissions.Classes.Manage)` | BE nghiệp vụ | [AutoSetIsCoreForOldClasses](../plo-clo-backend/Controllers/ClassController.cs#L352); `ClassService.SetIsCoreForOldClassesWithExamsOrResultsAsync` | `Classes`, `Exams`, `Results` |
| POST | `/api/classes/{id}/create-initial-questions` | `HasPermission(Permissions.Classes.SeedQuestions)` | BE nghiệp vụ | [CreateInitialQuestions](../plo-clo-backend/Controllers/ClassController.cs#L364); `ClassService.CreateInitialQuestionsForClassAsync` | `Classes`, `Exams`, `Questions` |

### CLOController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/clos` | `Authorize` | BE nghiệp vụ | [GetAll](../plo-clo-backend/Controllers/CLOController.cs#L29); `CLOService.GetFilteredCLOsAsync` | `CLOPLO`, `CLOQuestion`, `CLOs`, `PLOs`, `Questions` |
| GET | `/api/clos/{id}` | `Authorize` | BE nghiệp vụ | [GetById](../plo-clo-backend/Controllers/CLOController.cs#L39); `CLOService.GetCLOByIdAsync` | `CLOs` |
| POST | `/api/clos` | `HasPermission(Permissions.Clos.Manage)` | BE nghiệp vụ | [Create](../plo-clo-backend/Controllers/CLOController.cs#L53); `CourseService.GetCourseByIdAsync`, `CLOService.CreateCLOAsync` | `CLOs`, `Courses` |
| PUT | `/api/clos/{id}` | `HasPermission(Permissions.Clos.Manage)` | BE nghiệp vụ | [Update](../plo-clo-backend/Controllers/CLOController.cs#L78); `CLOService.GetCLOByIdAsync`, `CLOService.UpdateCLOAsync` | `CLOs` |
| PUT | `/api/clos/{id}/plos` | `HasPermission(Permissions.PloClos.Map)` | BE nghiệp vụ | [UpdatePLOs](../plo-clo-backend/Controllers/CLOController.cs#L105); `CLOService.GetCLOByIdAsync`, `ProgrammeService.GetProgrammeByIdAsync`, `CLOService.UpdatePLOsOfCLOAsync` | `CLOPLO`, `CLOs`, `CoursePLO`, `PLOs`, `Programmes` |
| DELETE | `/api/clos/{id}` | `HasPermission(Permissions.Clos.Manage)` | BE nghiệp vụ | [Delete](../plo-clo-backend/Controllers/CLOController.cs#L135); `CLOService.GetCLOByIdAsync`, `CLOService.DeleteCLOAsync` | `CLOs` |

### CorrectedResultController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/corrected-results` | `Authorize` | BE nghiệp vụ | [GetAll](../plo-clo-backend/Controllers/CorrectedResultController.cs#L29); `RecordAccessService.EnsureCanSeeScoresAsync`, `CorrectedResultService.GetCorrectedResultsAsync` | `ChildExamSessions`, `Classes`, `CorrectedResults`, `Exams`, `ParentExamSessions`, `Questions`, `Students` |
| GET | `/api/corrected-results/grouped` | `HasPermission(Permissions.CorrectedResults.View)` | BE nghiệp vụ | [GetGrouped](../plo-clo-backend/Controllers/CorrectedResultController.cs#L42); `CorrectedResultService.GetGroupedCorrectedResultsAsync` | `ChildExamSessions`, `CorrectedResults`, `Students` |
| GET | `/api/corrected-results/{id}` | `Authorize` | BE nghiệp vụ | [GetById](../plo-clo-backend/Controllers/CorrectedResultController.cs#L52); `CorrectedResultService.GetCorrectedResultByIdAsync`, `RecordAccessService.EnsureCanSeeExamScoresAsync` | `ChildExamSessions`, `Classes`, `CorrectedResults`, `Exams`, `ParentExamSessions` |
| GET | `/api/corrected-results/final-grade-comparison/{classId}` | `Authorize` | BE nghiệp vụ | [GetFinalGradeComparison](../plo-clo-backend/Controllers/CorrectedResultController.cs#L64); `RecordAccessService.EnsureCanSeeClassScoresAsync`, `CorrectedResultService.GetFinalGradeComparisonAsync` | `Classes`, `CorrectedResults`, `Exams`, `Questions`, `Results` |
| GET | `/api/corrected-results/exam-score-comparison/{classId}` | `Authorize` | BE nghiệp vụ | [GetExamScoreComparison](../plo-clo-backend/Controllers/CorrectedResultController.cs#L74); `RecordAccessService.EnsureCanSeeClassScoresAsync`, `CorrectedResultService.GetExamScoreComparisonAsync` | `Classes`, `CorrectedResults`, `Exams`, `Questions`, `Results` |
| GET | `/api/corrected-results/exam-score-comparison/child-exam-session/{childExamSessionId}` | `Authorize` | BE nghiệp vụ | [GetExamScoreComparisonForChildExamSession](../plo-clo-backend/Controllers/CorrectedResultController.cs#L84); `RecordAccessService.EnsureCanSeeChildExamSessionScoresAsync`, `CorrectedResultService.GetExamScoreComparisonForChildExamSessionAsync` | `ChildExamSessions`, `CorrectedResults`, `Questions`, `Results`, `Students` |
| POST | `/api/corrected-results` | `HasPermission(Permissions.CorrectedResults.Edit)` | BE nghiệp vụ | [Create](../plo-clo-backend/Controllers/CorrectedResultController.cs#L94); `CorrectedResultService.CreateCorrectedResultAsync` | `ChildExamSessions`, `ClassStudent`, `Classes`, `CorrectedResults`, `Questions`, `Results`, `Students` |
| PUT | `/api/corrected-results/{id}` | `HasPermission(Permissions.CorrectedResults.Edit)` | BE nghiệp vụ | [Update](../plo-clo-backend/Controllers/CorrectedResultController.cs#L105); `CorrectedResultService.UpdateCorrectedResultAsync` | `ChildExamSessions`, `CorrectedResults`, `Questions`, `Results`, `Students` |
| PUT | `/api/corrected-results/upsert` | `HasPermission(Permissions.CorrectedResults.Edit)` | BE nghiệp vụ | [Upsert](../plo-clo-backend/Controllers/CorrectedResultController.cs#L116); `CorrectedResultService.UpsertCorrectedResultAsync` | `ChildExamSessions`, `ClassStudent`, `Classes`, `CorrectedResults`, `Questions`, `Results`, `Students` |
| PUT | `/api/corrected-results/bulk` | `HasPermission(Permissions.CorrectedResults.Edit)` | BE nghiệp vụ | [UpsertBulk](../plo-clo-backend/Controllers/CorrectedResultController.cs#L131); `CorrectedResultService.UpsertCorrectedResultsBulkAsync` | `ChildExamSessions`, `ClassStudent`, `Classes`, `CorrectedResults`, `Questions`, `Results`, `Students` |
| DELETE | `/api/corrected-results/{id}` | `HasPermission(Permissions.CorrectedResults.Delete)` | BE nghiệp vụ | [Delete](../plo-clo-backend/Controllers/CorrectedResultController.cs#L142); `CorrectedResultService.DeleteCorrectedResultAsync` | `ChildExamSessions`, `CorrectedResults`, `Students` |
| POST | `/api/corrected-results/confirm` | `HasPermission(Permissions.CorrectedResults.Confirm)` | BE nghiệp vụ | [Confirm](../plo-clo-backend/Controllers/CorrectedResultController.cs#L154); `CorrectedResultService.ConfirmCorrectedResultsAsync` | `ChildExamSessions`, `Exams`, `ParentExamSessions` |
| POST | `/api/corrected-results/{id}/accept` | `HasPermission(Permissions.CorrectedResults.Approve)` | BE nghiệp vụ | [Accept](../plo-clo-backend/Controllers/CorrectedResultController.cs#L165); `CorrectedResultService.AcceptCorrectedResultAsync` | `Accounts`, `ChildExamSessions`, `ClassStudent`, `Classes`, `CorrectedResults`, `Courses`, `Exams`, `Questions`, `Results`, `StudentExam`, `Students` |
| POST | `/api/corrected-results/{id}/revert-accept` | `HasPermission(Permissions.CorrectedResults.Approve)` | BE nghiệp vụ | [RevertAccept](../plo-clo-backend/Controllers/CorrectedResultController.cs#L178); `CorrectedResultService.RevertAcceptCorrectedResultAsync` | `ChildExamSessions`, `ClassStudent`, `Classes`, `CorrectedResults`, `Courses`, `Exams`, `Questions`, `Results`, `StudentExam`, `Students` |

### CourseController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/courses` | `Authorize` | BE nghiệp vụ | [GetAll](../plo-clo-backend/Controllers/CourseController.cs#L28); `CourseService.GetFilteredCoursesAsync` | `Courses`, `PLOs`, `Programmes` |
| GET | `/api/courses/external` | `Authorize(AuthenticationSchemes = "ApiKey", Roles = "Admin,AcademicAffairs")` | BE API tích hợp | [GetAllExternal](../plo-clo-backend/Controllers/CourseController.cs#L41); `FacultyService.GetFacultyByCodeAsync`, `CourseService.GetFilteredCoursesAsync` | `Courses`, `Faculties`, `PLOs`, `Programmes` |
| GET | `/api/courses/paged` | `Authorize` | BE nghiệp vụ | [GetPaged](../plo-clo-backend/Controllers/CourseController.cs#L60) | Không truy vấn trực tiếp / xem luồng gọi |
| GET | `/api/courses/{id}` | `Authorize` | BE nghiệp vụ | [GetById](../plo-clo-backend/Controllers/CourseController.cs#L77); `CourseService.GetCourseByIdAsync` | `Courses` |
| POST | `/api/courses` | `HasPermission(Permissions.Courses.Manage)` | BE nghiệp vụ | [Create](../plo-clo-backend/Controllers/CourseController.cs#L89); `CourseService.CreateCourseAsync` | `Courses` |
| POST | `/api/courses/external` | `HasPermission(Permissions.Integration.SyncCourses, AuthenticationSchemes = "CustomJWT,ApiKey")` | BE API tích hợp | [CreateExternal](../plo-clo-backend/Controllers/CourseController.cs#L103); `FacultyService.GetFacultyByCodeAsync`, `CourseService.CreateCourseAsync` | `Courses`, `Faculties` |
| PUT | `/api/courses/external/{courseCode}` | `HasPermission(Permissions.Integration.SyncCourses, AuthenticationSchemes = "CustomJWT,ApiKey")` | BE API tích hợp | [UpdateExternal](../plo-clo-backend/Controllers/CourseController.cs#L134); `CourseService.GetCourseByCodeAsync`, `FacultyService.GetFacultyByCodeAsync`, `CourseService.UpdateCourseAsync` | `Courses`, `Faculties` |
| PUT | `/api/courses/{id}` | `HasPermission(Permissions.Courses.Edit)` | BE nghiệp vụ | [Update](../plo-clo-backend/Controllers/CourseController.cs#L165); `CourseService.UpdateCourseAsync` | `Courses` |
| DELETE | `/api/courses/{id}` | `HasPermission(Permissions.Courses.Manage)` | BE nghiệp vụ | [Delete](../plo-clo-backend/Controllers/CourseController.cs#L178); `CourseService.DeleteCourseAsync` | `Courses` |

### CoursePLOController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/course-plos` | `Authorize` | BE nghiệp vụ | [GetAll](../plo-clo-backend/Controllers/CoursePLOController.cs#L25); `CoursePLOService.GetFilteredCoursePLOsAsync` | `CoursePLO` |
| PUT | `/api/course-plos` | `HasPermission(Permissions.CoursePlos.Map)` | BE nghiệp vụ | [Upsert](../plo-clo-backend/Controllers/CoursePLOController.cs#L38); `PLOService.GetPLOByIdAsync`, `CoursePLOService.UpsertCoursePLOAsync` | `CLOPLO`, `CLOs`, `CoursePLO`, `Courses`, `Curriculums`, `PLOs`, `Programmes` |
| PUT | `/api/course-plos/bulk` | `HasPermission(Permissions.CoursePlos.Map)` | BE nghiệp vụ | [UpsertBulk](../plo-clo-backend/Controllers/CoursePLOController.cs#L66); `ProgrammeService.GetProgrammeByIdAsync`, `CoursePLOService.UpsertCoursePLOsAsync` | `CLOPLO`, `CLOs`, `CoursePLO`, `Curriculums`, `PLOs`, `Programmes` |

### DataTransferController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/data-transfer/majors/preview` | `HasPermission(Permissions.DataTransfer.Run)` | BE nghiệp vụ + SQL nguồn | [GetMajorDataTransferPreview](../plo-clo-backend/Controllers/DataTransferController.cs#L24); `DataTransferService.GetMajorDataTransferPreviewAsync` | `Faculties`, `Majors`, `source.tmNganh` |
| POST | `/api/data-transfer/majors/transfer` | `HasPermission(Permissions.DataTransfer.Run)` | BE nghiệp vụ + SQL nguồn | [TransferMajorData](../plo-clo-backend/Controllers/DataTransferController.cs#L32); `DataTransferService.TransferMajorDataAsync` | `Faculties`, `Majors`, `source.tmNganh` |
| POST | `/api/data-transfer/majors/update-programme-majorid` | `HasPermission(Permissions.DataTransfer.Run)` | BE nghiệp vụ | [UpdateProgrammeMajorId](../plo-clo-backend/Controllers/DataTransferController.cs#L40); `DataTransferService.UpdateProgrammeMajorIdAsync` | `Majors`, `Programmes` |
| GET | `/api/data-transfer/programmes/preview` | `HasPermission(Permissions.DataTransfer.Run)` | BE nghiệp vụ + SQL nguồn | [GetProgrammeDataTransferPreview](../plo-clo-backend/Controllers/DataTransferController.cs#L48); `DataTransferService.GetProgrammeDataTransferPreviewAsync` | `Majors`, `Programmes`, `source.tmNganh` |
| POST | `/api/data-transfer/programmes/transfer` | `HasPermission(Permissions.DataTransfer.Run)` | BE nghiệp vụ + SQL nguồn | [TransferProgrammeData](../plo-clo-backend/Controllers/DataTransferController.cs#L56); `DataTransferService.TransferProgrammeDataAsync` | `Majors`, `Programmes`, `source.tmNganh` |
| GET | `/api/data-transfer/courses/preview` | `HasPermission(Permissions.DataTransfer.Run)` | BE nghiệp vụ + SQL nguồn | [GetCourseDataTransferPreview](../plo-clo-backend/Controllers/DataTransferController.cs#L64); `DataTransferService.GetCourseDataTransferPreviewAsync` | `Courses`, `Faculties`, `source.tmHocPhan` |
| POST | `/api/data-transfer/courses/transfer` | `HasPermission(Permissions.DataTransfer.Run)` | BE nghiệp vụ + SQL nguồn | [TransferCourseData](../plo-clo-backend/Controllers/DataTransferController.cs#L72); `DataTransferService.TransferCourseDataAsync` | `Courses`, `Faculties`, `source.tmHocPhan` |
| GET | `/api/data-transfer/course-dependencies/preview` | `HasPermission(Permissions.DataTransfer.Run)` | BE nghiệp vụ + SQL nguồn | [GetCourseDependencyDataTransferPreview](../plo-clo-backend/Controllers/DataTransferController.cs#L80); `DataTransferService.GetCourseDependencyDataTransferPreviewAsync` | `Courses`, `source.tmHocPhan_PT` |
| POST | `/api/data-transfer/course-dependencies/transfer` | `HasPermission(Permissions.DataTransfer.Run)` | BE nghiệp vụ + SQL nguồn | [TransferCourseDependencyData](../plo-clo-backend/Controllers/DataTransferController.cs#L88); `DataTransferService.TransferCourseDependencyDataAsync` | `Courses`, `source.tmHocPhan_PT` |
| GET | `/api/data-transfer/lock-dependent-course-exams/preview` | `HasPermission(Permissions.DataTransfer.Run)` | BE nghiệp vụ | [GetLockDependentCourseExamsPreview](../plo-clo-backend/Controllers/DataTransferController.cs#L96); `DataTransferService.GetLockDependentCourseExamsPreviewAsync` | `Semesters` |
| POST | `/api/data-transfer/lock-dependent-course-exams/lock` | `HasPermission(Permissions.DataTransfer.Run)` | BE nghiệp vụ | [LockDependentCourseExams](../plo-clo-backend/Controllers/DataTransferController.cs#L104); `DataTransferService.LockDependentCourseExamsAsync` | `Semesters` |
| GET | `/api/data-transfer/unlock-all-exams/preview` | `HasPermission(Permissions.DataTransfer.Run)` | BE nghiệp vụ | [GetUnlockAllExamsPreview](../plo-clo-backend/Controllers/DataTransferController.cs#L112); `DataTransferService.GetUnlockAllExamsPreviewAsync` | `Exams`, `Semesters` |
| POST | `/api/data-transfer/unlock-all-exams/unlock` | `HasPermission(Permissions.DataTransfer.Run)` | BE nghiệp vụ | [UnlockAllExams](../plo-clo-backend/Controllers/DataTransferController.cs#L120); `DataTransferService.UnlockAllExamsAsync` | `Exams`, `Semesters` |
| GET | `/api/data-transfer/curriculums/preview` | `HasPermission(Permissions.DataTransfer.Run)` | BE nghiệp vụ + SQL nguồn | [GetCurriculumDataTransferPreview](../plo-clo-backend/Controllers/DataTransferController.cs#L128); `DataTransferService.GetCurriculumDataTransferPreviewAsync` | `Courses`, `Curriculums`, `Programmes`, `source.tmKhungCT` |
| POST | `/api/data-transfer/curriculums/transfer` | `HasPermission(Permissions.DataTransfer.Run)` | BE nghiệp vụ + SQL nguồn | [TransferCurriculumData](../plo-clo-backend/Controllers/DataTransferController.cs#L136); `DataTransferService.TransferCurriculumDataAsync` | `Courses`, `Curriculums`, `Programmes`, `source.tmKhungCT` |
| GET | `/api/data-transfer/cohorts/preview` | `HasPermission(Permissions.DataTransfer.Run)` | BE nghiệp vụ + SQL nguồn | [GetCohortDataTransferPreview](../plo-clo-backend/Controllers/DataTransferController.cs#L144); `DataTransferService.GetCohortDataTransferPreviewAsync` | `Cohorts`, `Programmes`, `source.tmLop` |
| POST | `/api/data-transfer/cohorts/transfer` | `HasPermission(Permissions.DataTransfer.Run)` | BE nghiệp vụ + SQL nguồn | [TransferCohortData](../plo-clo-backend/Controllers/DataTransferController.cs#L152); `DataTransferService.TransferCohortDataAsync` | `Cohorts`, `Programmes`, `source.tmLop` |
| GET | `/api/data-transfer/students/preview` | `HasPermission(Permissions.DataTransfer.Run)` | BE nghiệp vụ + SQL nguồn | [GetStudentAccountDataTransferPreview](../plo-clo-backend/Controllers/DataTransferController.cs#L160); `DataTransferService.GetStudentAccountDataTransferPreviewAsync` | `Accounts`, `source.tmHoSoSV` |
| POST | `/api/data-transfer/students/transfer` | `HasPermission(Permissions.DataTransfer.Run)` | BE nghiệp vụ + SQL nguồn | [TransferStudentAccountData](../plo-clo-backend/Controllers/DataTransferController.cs#L168); `DataTransferService.TransferStudentAccountDataAsync` | `Accounts`, `Cohorts`, `Programmes`, `Students`, `source.tmHoSoSV` |
| GET | `/api/data-transfer/semesters/preview` | `HasPermission(Permissions.DataTransfer.Run)` | BE nghiệp vụ + SQL nguồn | [GetSemesterDataTransferPreview](../plo-clo-backend/Controllers/DataTransferController.cs#L176); `DataTransferService.GetSemesterDataTransferPreviewAsync` | `Semesters`, `source.tmKehoach` |
| POST | `/api/data-transfer/semesters/transfer` | `HasPermission(Permissions.DataTransfer.Run)` | BE nghiệp vụ + SQL nguồn | [TransferSemesterData](../plo-clo-backend/Controllers/DataTransferController.cs#L184); `DataTransferService.TransferSemesterDataAsync` | `Semesters`, `source.tmKehoach` |
| GET | `/api/data-transfer/classes/preview` | `HasPermission(Permissions.DataTransfer.Run)` | BE nghiệp vụ + SQL nguồn | [GetClassDataTransferPreview](../plo-clo-backend/Controllers/DataTransferController.cs#L192); `DataTransferService.GetClassDataTransferPreviewAsync` | `Classes`, `Courses`, `Exams`, `Semesters`, `Teachers`, `source.tmLopHP` |
| POST | `/api/data-transfer/classes/transfer` | `HasPermission(Permissions.DataTransfer.Run)` | BE nghiệp vụ + SQL nguồn | [TransferClassData](../plo-clo-backend/Controllers/DataTransferController.cs#L200); `DataTransferService.TransferClassDataAsync` | `Classes`, `Courses`, `Exams`, `Semesters`, `Teachers`, `source.tmLopHP` |
| GET | `/api/data-transfer/class-student/preview` | `HasPermission(Permissions.DataTransfer.Run)` | BE nghiệp vụ + SQL nguồn | [GetClassStudentDataTransferPreview](../plo-clo-backend/Controllers/DataTransferController.cs#L208); `DataTransferService.GetClassStudentDataTransferPreviewAsync` | `ClassStudent`, `Classes`, `Semesters`, `Students`, `source.tmDiemkyhoc` |
| POST | `/api/data-transfer/class-student/transfer` | `HasPermission(Permissions.DataTransfer.Run)` | BE nghiệp vụ + SQL nguồn | [TransferClassStudentData](../plo-clo-backend/Controllers/DataTransferController.cs#L216); `DataTransferService.TransferClassStudentDataAsync` | `ClassStudent`, `Classes`, `Semesters`, `Students`, `source.tmDiemkyhoc` |
| GET | `/api/data-transfer/exams/preview` | `HasPermission(Permissions.DataTransfer.Run)` | BE nghiệp vụ + SQL nguồn | [GetExamDataTransferPreview](../plo-clo-backend/Controllers/DataTransferController.cs#L224); `DataTransferService.GetExamDataTransferPreviewAsync` | `Classes`, `Exams`, `Questions`, `Semesters`, `source.tmConfig`, `source.tmLopHP` |
| POST | `/api/data-transfer/exams/transfer` | `HasPermission(Permissions.DataTransfer.Run)` | BE nghiệp vụ + SQL nguồn | [TransferExamData](../plo-clo-backend/Controllers/DataTransferController.cs#L232); `DataTransferService.TransferExamDataAsync` | `Classes`, `Exams`, `Questions`, `Semesters`, `source.tmConfig`, `source.tmLopHP` |
| GET | `/api/data-transfer/exam-deadlines/preview` | `HasPermission(Permissions.DataTransfer.Run)` | BE nghiệp vụ + SQL nguồn | [GetExamDeadlineDataTransferPreview](../plo-clo-backend/Controllers/DataTransferController.cs#L245); `DataTransferService.GetExamDeadlineDataTransferPreviewAsync` | `Classes`, `Exams`, `Semesters`, `source.tmLopHP` |
| POST | `/api/data-transfer/exam-deadlines/transfer` | `HasPermission(Permissions.DataTransfer.Run)` | BE nghiệp vụ + SQL nguồn | [TransferExamDeadlineData](../plo-clo-backend/Controllers/DataTransferController.cs#L254); `DataTransferService.TransferExamDeadlineDataAsync` | `Classes`, `Exams`, `Semesters`, `source.tmLopHP` |
| GET | `/api/data-transfer/teachers/preview` | `HasPermission(Permissions.DataTransfer.Run)` | BE nghiệp vụ + SQL nguồn | [GetTeacherAccountDataTransferPreview](../plo-clo-backend/Controllers/DataTransferController.cs#L262); `DataTransferService.GetTeacherAccountDataTransferPreviewAsync` | `Accounts`, `source.tmHosoGV` |
| POST | `/api/data-transfer/teachers/transfer` | `HasPermission(Permissions.DataTransfer.Run)` | BE nghiệp vụ + SQL nguồn | [TransferTeacherAccountData](../plo-clo-backend/Controllers/DataTransferController.cs#L270); `DataTransferService.TransferTeacherAccountDataAsync` | `Accounts`, `Teachers`, `WorkUnits`, `source.tmHosoGV` |
| GET | `/api/data-transfer/course-plos/preview-orphaned` | `HasPermission(Permissions.DataTransfer.Run)` | BE nghiệp vụ | [PreviewOrphanedCoursePLORecords](../plo-clo-backend/Controllers/DataTransferController.cs#L278); `DataTransferService.PreviewOrphanedCoursePLORecords` | `CoursePLO`, `Curriculums`, `PLOs` |
| DELETE | `/api/data-transfer/course-plos/remove-orphaned` | `HasPermission(Permissions.DataTransfer.Run)` | BE nghiệp vụ | [RemoveOrphanedCoursePLORecords](../plo-clo-backend/Controllers/DataTransferController.cs#L286); `DataTransferService.RemoveOrphanedCoursePLORecords` | `CoursePLO`, `Curriculums`, `PLOs` |
| GET | `/api/data-transfer/parent-exam-sessions/preview` | `HasPermission(Permissions.DataTransfer.Run)` | BE nghiệp vụ + SQL nguồn | [GetParentExamSessionDataTransferPreview](../plo-clo-backend/Controllers/DataTransferController.cs#L294); `DataTransferService.GetParentExamSessionDataTransferPreviewAsync` | `Classes`, `Courses`, `Exams`, `ParentExamSessions`, `Semesters`, `source.tmThiCaHP` |
| POST | `/api/data-transfer/parent-exam-sessions/transfer` | `HasPermission(Permissions.DataTransfer.Run)` | BE nghiệp vụ + SQL nguồn | [TransferParentExamSessionData](../plo-clo-backend/Controllers/DataTransferController.cs#L302); `DataTransferService.TransferParentExamSessionDataAsync` | `Classes`, `Courses`, `Exams`, `ParentExamSessions`, `Semesters`, `source.tmThiCaHP` |
| GET | `/api/data-transfer/child-exam-sessions/preview` | `HasPermission(Permissions.DataTransfer.Run)` | BE nghiệp vụ + SQL nguồn | [GetChildExamSessionDataTransferPreview](../plo-clo-backend/Controllers/DataTransferController.cs#L310); `DataTransferService.GetChildExamSessionDataTransferPreviewAsync` | `Accounts`, `ChildExamSessions`, `ParentExamSessions`, `Semesters`, `StudentChildExamSessions`, `source.tmThiCaCT` |
| POST | `/api/data-transfer/child-exam-sessions/transfer` | `HasPermission(Permissions.DataTransfer.Run)` | BE nghiệp vụ + SQL nguồn | [TransferChildExamSessionData](../plo-clo-backend/Controllers/DataTransferController.cs#L318); `DataTransferService.TransferChildExamSessionDataAsync` | `Accounts`, `ChildExamSessions`, `ParentExamSessions`, `Semesters`, `StudentChildExamSessions`, `source.tmThiCaCT` |
| GET | `/api/data-transfer/class-parent-exam-sessions/preview` | `HasPermission(Permissions.DataTransfer.Run)` | BE nghiệp vụ + SQL nguồn | [GetClassParentExamSessionDataTransferPreview](../plo-clo-backend/Controllers/DataTransferController.cs#L326); `DataTransferService.GetClassParentExamSessionDataTransferPreviewAsync` | `Classes`, `ParentExamSessions`, `Semesters`, `source.tmThiCaHP` |
| POST | `/api/data-transfer/class-parent-exam-sessions/transfer` | `HasPermission(Permissions.DataTransfer.Run)` | BE nghiệp vụ + SQL nguồn | [TransferClassParentExamSessionData](../plo-clo-backend/Controllers/DataTransferController.cs#L334); `DataTransferService.TransferClassParentExamSessionDataAsync` | `Classes`, `ParentExamSessions`, `Semesters`, `source.tmThiCaHP` |
| GET | `/api/data-transfer/exam-session-related-exams/preview` | `HasPermission(Permissions.DataTransfer.Run)` | BE nghiệp vụ | [GetExamSessionRelatedExamsPreview](../plo-clo-backend/Controllers/DataTransferController.cs#L342); `DataTransferService.GetExamSessionRelatedExamsPreviewAsync` | `Classes`, `Exams`, `ParentExamSessions`, `Semesters` |
| POST | `/api/data-transfer/exam-session-related-exams/update` | `HasPermission(Permissions.DataTransfer.Run)` | BE nghiệp vụ | [UpdateExamSessionRelatedExams](../plo-clo-backend/Controllers/DataTransferController.cs#L350); `DataTransferService.UpdateExamSessionRelatedExamsAsync` | `Classes`, `Exams`, `ParentExamSessions`, `Semesters` |
| GET | `/api/data-transfer/student-child-exam-sessions/preview` | `HasPermission(Permissions.DataTransfer.Run)` | BE nghiệp vụ + SQL nguồn | [GetStudentChildExamSessionDataTransferPreview](../plo-clo-backend/Controllers/DataTransferController.cs#L358); `DataTransferService.GetStudentChildExamSessionDataTransferPreviewAsync` | `ChildExamSessions`, `Semesters`, `StudentChildExamSessions`, `Students`, `source.tmDiemkyhoc` |
| POST | `/api/data-transfer/student-child-exam-sessions/transfer` | `HasPermission(Permissions.DataTransfer.Run)` | BE nghiệp vụ + SQL nguồn | [TransferStudentChildExamSessionData](../plo-clo-backend/Controllers/DataTransferController.cs#L366); `DataTransferService.TransferStudentChildExamSessionDataAsync` | `ChildExamSessions`, `Semesters`, `StudentChildExamSessions`, `Students`, `source.tmDiemkyhoc` |
| POST | `/api/data-transfer/student-exams/populate-confirmed-scores` | `HasPermission(Permissions.DataTransfer.Run)` | BE nghiệp vụ | [PopulateStudentExamScoresForConfirmedExams](../plo-clo-backend/Controllers/DataTransferController.cs#L374); `DataTransferService.PopulateStudentExamScoresForConfirmedExamsAsync` | `Exams`, `Results`, `Semesters`, `StudentExam` |
| GET | `/api/data-transfer/activate-all-students/preview` | `HasPermission(Permissions.DataTransfer.Run)` | BE nghiệp vụ | [GetActivateAllStudentsPreview](../plo-clo-backend/Controllers/DataTransferController.cs#L382); `DataTransferService.GetActivateAllStudentsPreviewAsync` | `Students` |
| POST | `/api/data-transfer/activate-all-students/activate` | `HasPermission(Permissions.DataTransfer.Run)` | BE nghiệp vụ | [ActivateAllStudents](../plo-clo-backend/Controllers/DataTransferController.cs#L390); `DataTransferService.ActivateAllStudentsAsync` | `Students` |
| GET | `/api/data-transfer/classes/core-sync/preview` | `HasPermission(Permissions.DataTransfer.Run)` | BE nghiệp vụ | [GetCoreClassSyncPreview](../plo-clo-backend/Controllers/DataTransferController.cs#L399); `DataTransferService.GetCoreClassSyncPreviewAsync` | Không truy vấn trực tiếp / xem luồng gọi |
| POST | `/api/data-transfer/classes/core-sync` | `HasPermission(Permissions.DataTransfer.Run)` | BE nghiệp vụ | [SyncCoreClassesForConfirmedProgrammes](../plo-clo-backend/Controllers/DataTransferController.cs#L408); `DataTransferService.SyncCoreClassesForConfirmedProgrammesAsync` | Không truy vấn trực tiếp / xem luồng gọi |

### ExamController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/exams` | `Authorize` | BE nghiệp vụ | [GetAll](../plo-clo-backend/Controllers/ExamController.cs#L35); `ExamService.GetFilteredExamsAsync` | `Exams`, `Questions` |
| POST | `/api/exams/types/distinct-by-classes` | `Authorize` | BE nghiệp vụ | [GetDistinctExamTypesByClassIds](../plo-clo-backend/Controllers/ExamController.cs#L44); `ExamService.GetDistinctExamTypesByClassIds` | `Exams` |
| GET | `/api/exams/{id}` | `Authorize` | BE nghiệp vụ | [GetById](../plo-clo-backend/Controllers/ExamController.cs#L54); `ExamService.GetExamByIdAsync` | `Exams`, `Questions` |
| POST | `/api/exams` | `HasPermission(Permissions.Exams.Manage)` | BE nghiệp vụ | [Create](../plo-clo-backend/Controllers/ExamController.cs#L66); `ExamService.CreateExamAsync` | `Exams`, `ParentExamSessions` |
| PUT | `/api/exams/{id}` | `HasPermission(Permissions.Exams.Manage)` | BE nghiệp vụ | [Update](../plo-clo-backend/Controllers/ExamController.cs#L82); `ExamService.UpdateExamAsync` | `Exams` |
| DELETE | `/api/exams/{id}` | `HasPermission(Permissions.Exams.Manage)` | BE nghiệp vụ | [Delete](../plo-clo-backend/Controllers/ExamController.cs#L92); `ExamService.DeleteExamAsync` | `Exams` |
| PUT | `/api/exams/{id}/can-students-view-unconfirmed-results` | `HasPermission(Permissions.Exams.PublishUnconfirmed)` | BE nghiệp vụ | [SetCanStudentsViewUnconfirmedResults](../plo-clo-backend/Controllers/ExamController.cs#L102); `ExamService.SetCanStudentsViewUnconfirmedResultsAsync` | `Exams` |
| PUT | `/api/exams/{id}/deadline-extension` | `HasPermission(Permissions.Deadlines.Manage)` | BE nghiệp vụ | [SetDeadlineExtension](../plo-clo-backend/Controllers/ExamController.cs#L117); `ExamService.SetExamDeadlineExtensionAsync` | `Exams` |
| PUT | `/api/exams/{id}/questions` | `HasPermission(Permissions.Questions.Edit)` | BE nghiệp vụ | [UpdateListQuestion](../plo-clo-backend/Controllers/ExamController.cs#L128); `QuestionService.UpdateListQuestionAsync` | `CLOQuestion`, `CLOs`, `Classes`, `Courses`, `Exams`, `Questions`, `Results` |
| PUT | `/api/exams/deadlines/batch` | `HasPermission(Permissions.Deadlines.Manage)` | BE nghiệp vụ | [BatchUpdateExamDeadlines](../plo-clo-backend/Controllers/ExamController.cs#L140); `ExamService.BatchUpdateExamDeadlines` | `Exams` |
| PUT | `/api/exams/deadlines/batch-by-category` | `HasPermission(Permissions.Deadlines.Manage)` | BE nghiệp vụ | [BatchSetExamDeadlinesByCategory](../plo-clo-backend/Controllers/ExamController.cs#L154); `ExamService.BatchSetExamDeadlinesByCategoryAsync` | `Exams` |
| GET | `/api/exams/categories` | `Authorize` | BE nghiệp vụ | [GetExamCategories](../plo-clo-backend/Controllers/ExamController.cs#L163); `ExamService.GetExamCategories` | Không truy vấn trực tiếp / xem luồng gọi |
| GET | `/api/exams/types/distinct` | `HasPermission(Permissions.Deadlines.Manage)` | BE nghiệp vụ | [GetDistinctExamTypes](../plo-clo-backend/Controllers/ExamController.cs#L171); `ExamService.GetDistinctExamTypesAsStringAsync` | `Exams` |
| GET | `/api/exams/types/distinct-by-semester/{semesterId}` | `HasPermission(Permissions.Deadlines.Manage)` | BE nghiệp vụ | [GetDistinctExamTypesBySemesterId](../plo-clo-backend/Controllers/ExamController.cs#L179); `ExamService.GetDistinctExamTypesBySemesterIdAsStringAsync` | `Exams` |
| GET | `/api/exams/by-semester-and-types` | `HasPermission(Permissions.Scores.Enter)` | BE nghiệp vụ | [GetExamsBySemesterAndTypes](../plo-clo-backend/Controllers/ExamController.cs#L187); `ExamService.GetExamsBySemesterAndTypesAsync` | `Classes`, `Exams` |
| PUT | `/api/exams/deadlines/batch-by-class-code` | `HasPermission(Permissions.Deadlines.Manage)` | BE nghiệp vụ | [BatchUpdateExamDeadlinesByClassCode](../plo-clo-backend/Controllers/ExamController.cs#L199); `ExamService.UpdateExamDeadline` | `Exams` |

### ReportController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/export/faculties` | `HasPermission(Permissions.Reports.ExportAdmin)` | BE nghiệp vụ | [ExportAllFaculty](../plo-clo-backend/Controllers/ExportExcellController.cs#L35); `ExcelHandler.ExportAllFaculty` | `Faculties` |
| GET | `/api/export/teachers` | `HasPermission(Permissions.Reports.ExportAdmin)` | BE nghiệp vụ | [ExportAllTeacher](../plo-clo-backend/Controllers/ExportExcellController.cs#L45); `ExcelHandler.ExportAllTeachers` | `Classes`, `Teachers` |
| GET | `/api/export/teachers/workunit/{workUnitId}` | `HasPermission(Permissions.Reports.ExportAdmin)` | BE nghiệp vụ | [ExportAllTeacherByWorkUnit](../plo-clo-backend/Controllers/ExportExcellController.cs#L54); `ExcelHandler.ExportAllTeachersByWorkUnit` | `Classes`, `Teachers`, `WorkUnits` |
| GET | `/api/export/students/faculty/{facultyId}` | `HasPermission(Permissions.Reports.Export)` | BE nghiệp vụ | [ExportAllStudentsByFaculty](../plo-clo-backend/Controllers/ExportExcellController.cs#L62); `RecordAccessService.EnsureCanSeeFaculty`, `ExcelHandler.ExportAllStudentsByFaculty` | `ClassStudent`, `Classes`, `Faculties`, `Programmes`, `Students` |
| GET | `/api/export/students/programme/{programmeId}` | `HasPermission(Permissions.Reports.Export)` | BE nghiệp vụ | [ExportAllStudentsByProgramme](../plo-clo-backend/Controllers/ExportExcellController.cs#L71); `RecordAccessService.EnsureCanSeeProgrammeAsync`, `ExcelHandler.ExportAllStudentsByProgramme` | `ClassStudent`, `Classes`, `Programmes`, `Students` |
| GET | `/api/export/courses` | `HasPermission(Permissions.Reports.Export)` | BE nghiệp vụ | [ExportAllCourse](../plo-clo-backend/Controllers/ExportExcellController.cs#L80); `RecordAccessService.EnsureSeesEveryProgramme`, `ExcelHandler.ExportAllCourse` | `Courses`, `PLOs`, `Programmes` |
| GET | `/api/export/courses/faculty/{facultyId}` | `HasPermission(Permissions.Reports.Export)` | BE nghiệp vụ | [ExportAllCourseByFacultyId](../plo-clo-backend/Controllers/ExportExcellController.cs#L89); `RecordAccessService.EnsureCanSeeFaculty`, `ExcelHandler.ExportAllCourseByFacultyId` | `Courses`, `Faculties`, `PLOs`, `Programmes` |
| GET | `/api/export/courses/programme/{programmeId}` | `HasPermission(Permissions.Reports.Export)` | BE nghiệp vụ | [ExportAllCourseByProgrammeId](../plo-clo-backend/Controllers/ExportExcellController.cs#L98); `RecordAccessService.EnsureCanSeeProgrammeAsync`, `ExcelHandler.ExportAllCourseByProgrammeId` | `Courses`, `PLOs`, `Programmes` |
| GET | `/api/export/classes` | `HasPermission(Permissions.Reports.Export)` | BE nghiệp vụ | [ExportAllClass](../plo-clo-backend/Controllers/ExportExcellController.cs#L107); `RecordAccessService.EnsureSeesEveryProgramme`, `ExcelHandler.ExportAllClass` | `ClassStudent`, `Classes`, `CorrectedResults`, `Programmes`, `Students` |
| GET | `/api/export/classes/course/{courseId}` | `HasPermission(Permissions.Reports.Export)` | BE nghiệp vụ | [ExportClassByCourseId](../plo-clo-backend/Controllers/ExportExcellController.cs#L116); `RecordAccessService.EnsureSeesEveryProgramme`, `ExcelHandler.ExportClassByCourseId` | `ClassStudent`, `Classes`, `CorrectedResults`, `Courses`, `Programmes`, `Students` |
| GET | `/api/export/classes/semester/{semesterId}` | `HasPermission(Permissions.Reports.Export)` | BE nghiệp vụ | [ExportClassBySemesterId](../plo-clo-backend/Controllers/ExportExcellController.cs#L125); `RecordAccessService.EnsureSeesEveryProgramme`, `ExcelHandler.ExportClassBySemesterId` | `ClassStudent`, `Classes`, `CorrectedResults`, `Programmes`, `Semesters`, `Students` |
| GET | `/api/export/classes/teacher/{teacherId}` | `HasPermission(Permissions.Reports.Export)` | BE nghiệp vụ | [ExportClassByTeacherId](../plo-clo-backend/Controllers/ExportExcellController.cs#L134); `RecordAccessService.EnsureSeesEveryProgramme`, `ExcelHandler.ExportClassByTeacherId` | `ClassStudent`, `Classes`, `CorrectedResults`, `Programmes`, `Students`, `Teachers` |
| GET | `/api/export/classes/extreme-filters` | `HasPermission(Permissions.Reports.Export)` | BE nghiệp vụ | [ExportClass](../plo-clo-backend/Controllers/ExportExcellController.cs#L143); `RecordAccessService.EnsureSeesEveryProgramme`, `ExcelHandler.ExportClass` | `ClassStudent`, `Classes`, `CorrectedResults`, `Courses`, `Curriculums`, `PLOs`, `Programmes`, `Students` |
| GET | `/api/export/score/clo/{classId}` | `HasPermission(Permissions.Scores.Export)` | BE nghiệp vụ | [ExportScoreCLO](../plo-clo-backend/Controllers/ExportExcellController.cs#L157); `RecordAccessService.EnsureCanSeeClassScoresAsync`, `ExcelHandler.ExportScoreCLO` | `CLOPLO`, `CLOQuestion`, `CLOs`, `ClassStudent`, `Classes`, `PLOs`, `Programmes`, `Questions`, `Results`, `Students` |
| GET | `/api/export/score/component` | `HasPermission(Permissions.Scores.Export)` | BE nghiệp vụ | [ExportScoreComponent](../plo-clo-backend/Controllers/ExportExcellController.cs#L170); `RecordAccessService.EnsureCanSeeExamScoresAsync`, `RecordAccessService.EnsureCanSeeClassScoresAsync`, `ExcelHandler.ExportGrade` | `ChildExamSessions`, `ClassStudent`, `Classes`, `Exams`, `ParentExamSessions`, `Programmes`, `Questions`, `Results`, `Students` |
| POST | `/api/export/grades/import` | `HasPermission(Permissions.Scores.Import)` | BE nghiệp vụ | [ImportGradeFromExcel](../plo-clo-backend/Controllers/ExportExcellController.cs#L180); `ExcelHandler.ImportGradeFromExcel` | `Classes`, `Exams`, `Questions`, `Results`, `Students` |
| POST | `/api/export/grades/preview-import` | `HasPermission(Permissions.Scores.Import)` | BE nghiệp vụ | [PreviewGradeImportFromExcel](../plo-clo-backend/Controllers/ExportExcellController.cs#L205); `ExcelHandler.PreviewGradeImportFromExcel` | `Classes`, `Exams`, `Questions`, `Students` |
| GET | `/api/export/grades/all/{classId}` | `HasPermission(Permissions.Scores.Export)` | BE nghiệp vụ | [ExportAllGrade](../plo-clo-backend/Controllers/ExportExcellController.cs#L221); `RecordAccessService.EnsureCanSeeClassScoresAsync`, `ExcelHandler.ExportAllGrade` | `ClassStudent`, `Classes`, `Exams`, `Programmes`, `Questions`, `Results`, `Students` |
| GET | `/api/export/courses/confirmed/{programId}` | `HasPermission(Permissions.Reports.Export)` | BE nghiệp vụ | [ExportConfirmedCourses](../plo-clo-backend/Controllers/ExportExcellController.cs#L237); `RecordAccessService.EnsureCanSeeProgrammeAsync`, `ExcelHandler.ExportConfirmedCourses` | `CLOPLO`, `CLOQuestion`, `CLOs`, `Classes`, `CoursePLO`, `Courses`, `Curriculums`, `PLOs`, `Programmes`, `Questions` |
| GET | `/api/export/status-update-template` | `HasPermission(Permissions.Students.ImportStatus)` | BE nghiệp vụ | [ExportStatusUpdateTemplateAsync](../plo-clo-backend/Controllers/ExportExcellController.cs#L246); `ExcelHandler.ExportStatusUpdateTemplateAsync` | Không truy vấn trực tiếp / xem luồng gọi |
| POST | `/api/export/import-status-updates` | `HasPermission(Permissions.Students.ImportStatus)` | BE nghiệp vụ | [ImportStatusUpdates](../plo-clo-backend/Controllers/ExportExcellController.cs#L255); `ExcelHandler.ImportStatusUpdatesAsync` | `Students` |
| GET | `/api/export/classes/teacher-assignment-template` | `HasPermission(Permissions.TeacherAssignments.Import)` | BE nghiệp vụ | [ExportClassTeacherAssignmentTemplateAsync](../plo-clo-backend/Controllers/ExportExcellController.cs#L289); `SettingService.GetSettingAsync`, `ExcelHandler.ExportClassTeacherAssignmentTemplateAsync` | `ClassStudent`, `Classes`, `CorrectedResults`, `Settings`, `Students` |
| POST | `/api/export/classes/import-teacher-assignments` | `HasPermission(Permissions.TeacherAssignments.Import)` | BE nghiệp vụ | [ImportClassTeacherAssignments](../plo-clo-backend/Controllers/ExportExcellController.cs#L304); `ExcelHandler.ImportClassTeacherAssignmentsAsync` | `Classes`, `Teachers` |
| GET | `/api/export/parent-exam-sessions/teacher-assignment-template` | `HasPermission(Permissions.TeacherAssignments.Import)` | BE nghiệp vụ | [ExportParentExamSessionTeacherAssignmentTemplateAsync](../plo-clo-backend/Controllers/ExportExcellController.cs#L338); `SettingService.GetSettingAsync`, `ExcelHandler.ExportParentExamSessionTeacherAssignmentTemplateAsync` | `ChildExamSessions`, `CorrectedResults`, `ParentExamSessions`, `Settings`, `Teachers` |
| POST | `/api/export/parent-exam-sessions/import-teacher-assignments` | `HasPermission(Permissions.TeacherAssignments.Import)` | BE nghiệp vụ | [ImportParentExamSessionTeacherAssignments](../plo-clo-backend/Controllers/ExportExcellController.cs#L353); `ExcelHandler.ImportParentExamSessionTeacherAssignmentsAsync` | `ParentExamSessions`, `Teachers` |
| GET | `/api/export/classes/core-list` | `HasPermission(Permissions.Reports.Export)` | BE nghiệp vụ | [ExportClassCoreList](../plo-clo-backend/Controllers/ExportExcellController.cs#L387); `RecordAccessService.EnsureCanSeeProgrammeAsync`, `ExcelHandler.ExportClassCoreList` | `ClassStudent`, `Classes`, `CorrectedResults`, `CoursePLO`, `Courses`, `PLOs`, `Programmes`, `Semesters`, `Students` |
| GET | `/api/export/grades/exam-sessions/{childExamSessionId}` | `HasPermission(Permissions.Scores.Export)` | BE nghiệp vụ | [ExportGradeExamSessions](../plo-clo-backend/Controllers/ExportExcellController.cs#L397); `RecordAccessService.EnsureCanSeeChildExamSessionScoresAsync`, `ExcelHandler.ExportGradeExamSessions` | `ChildExamSessions`, `Exams`, `Questions`, `Results`, `StudentChildExamSessions`, `Students` |
| POST | `/api/export/grades/exam-sessions/preview-import` | `HasPermission(Permissions.Scores.Import)` | BE nghiệp vụ | [PreviewGradeExamSessionsImportFromExcel](../plo-clo-backend/Controllers/ExportExcellController.cs#L407); `ExcelHandler.PreviewGradeExamSessionsImportFromExcel` | `ChildExamSessions`, `Exams`, `Questions`, `StudentChildExamSessions`, `Students` |
| GET | `/api/export/grades/student/{studentId}` | `HasPermission(Permissions.Reports.Export)` | BE nghiệp vụ | [ExportStudentGradesWithProgrammeData](../plo-clo-backend/Controllers/ExportExcellController.cs#L429); `RecordAccessService.EnsureCanSeeStudentProgrammeAsync`, `StudentService.GetStudentByIdAsync`, `ExcelHandler.ExportStudentGradesWithProgrammeData` | `CLOPLO`, `CLOQuestion`, `CLOs`, `ClassStudent`, `Classes`, `CorrectedResults`, `CoursePLO`, `Courses`, `Curriculums`, `Exams`, `PLOs`, `Programmes`, `Questions`, `Results`, `StudentPLOs`, `Students` |
| GET | `/api/export/plo-scores/programme/{programmeId}` | `HasPermission(Permissions.Reports.Export)` | BE nghiệp vụ | [ExportStudentPLOScoresInProgramme](../plo-clo-backend/Controllers/ExportExcellController.cs#L439); `RecordAccessService.EnsureCanSeeProgrammeAsync`, `ExcelHandler.ExportStudentPLOScoresInProgramme` | `ClassStudent`, `Classes`, `Courses`, `PLOs`, `Programmes`, `StudentPLOs`, `Students` |
| GET | `/api/export/plo-scores/graduation` | `HasPermission(Permissions.Reports.Export)` | BE nghiệp vụ | [ExportStudentPLOScoresForGraduation](../plo-clo-backend/Controllers/ExportExcellController.cs#L452); `RecordAccessService.NarrowProgrammeIdsAsync`, `ExcelHandler.ExportStudentPLOScoresForGraduation` | `ClassStudent`, `Classes`, `PLOs`, `Programmes`, `StudentPLOs`, `StudentProgrammeCompletions`, `Students` |
| GET | `/api/export/max-pk-score/student/{studentId}` | `HasPermission(Permissions.Reports.ExportAdmin)` | BE nghiệp vụ | [ExportStudentMaxPkScoreTable](../plo-clo-backend/Controllers/ExportExcellController.cs#L468); `StudentService.GetStudentByIdAsync`, `ExcelHandler.ExportStudentMaxPkScoreTable` | `CLOPLO`, `CLOQuestion`, `CLOs`, `ClassStudent`, `Classes`, `CorrectedResults`, `CoursePLO`, `Courses`, `Curriculums`, `Exams`, `PLOs`, `Programmes`, `Questions`, `Results`, `Students` |
| POST | `/api/export/scores/sql` | `Authorize(Roles = "Admin, AcademicAffairs")` | BE nghiệp vụ | [ExportScoresAsSql](../plo-clo-backend/Controllers/ExportExcellController.cs#L482); `ScoreSqlExportService.ExportScoresAsync` | `ClassStudent`, `Classes`, `Exams`, `Semesters`, `StudentExam`, `Students` |

### ExportPdfController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/pdf-export/score-sheet/{classId}` | `HasPermission(Permissions.Scores.Export)` | BE nghiệp vụ | [ExportClassScoreSheet](../plo-clo-backend/Controllers/ExportPdfController.cs#L35); `PdfExportService.ExportClassScoreSheetAsync` | `ClassStudent`, `Classes`, `Exams`, `StudentExam`, `Students` |
| GET | `/api/pdf-export/score-sheet/{classId}/category/{category}` | `HasPermission(Permissions.Scores.Export)` | BE nghiệp vụ | [ExportClassCategoryScoreSheet](../plo-clo-backend/Controllers/ExportPdfController.cs#L50); `PdfExportService.ExportClassCategoryScoreSheetAsync` | `ClassStudent`, `Classes`, `Exams`, `Questions`, `Results`, `StudentExam`, `Students` |
| GET | `/api/pdf-export/score-sheet/child-exam-session/{childExamSessionId}` | `HasPermission(Permissions.Scores.Export)` | BE nghiệp vụ | [ExportChildExamSessionScoreSheet](../plo-clo-backend/Controllers/ExportPdfController.cs#L67); `PdfExportService.ExportChildExamSessionScoreSheetAsync` | `ChildExamSessions`, `Questions`, `Results`, `StudentChildExamSessions`, `StudentExam` |
| GET | `/api/pdf-export/corrected-results/class/{classId}` | `Authorize` | BE nghiệp vụ | [ExportClassCorrectedResultRequest](../plo-clo-backend/Controllers/ExportPdfController.cs#L82); `PdfExportService.ExportClassCorrectedResultRequestAsync` | `ChildExamSessions`, `CorrectedResults`, `Exams`, `Questions`, `Results`, `Students` |
| GET | `/api/pdf-export/corrected-results/child-exam-session/{childExamSessionId}` | `Authorize` | BE nghiệp vụ | [ExportChildExamSessionCorrectedResultRequest](../plo-clo-backend/Controllers/ExportPdfController.cs#L94); `PdfExportService.ExportChildExamSessionCorrectedResultRequestAsync` | `ChildExamSessions`, `CorrectedResults`, `Questions`, `Results`, `Students` |
| POST | `/api/pdf-export/score-sheet/{classId}/draft` | `HasPermission(Permissions.ScoreSheets.SignAsExaminer, Permissions.ScoreSheets.SignAsFacultyHead)` | BE nghiệp vụ + CA DUT | [CreateScoreSheetDraft](../plo-clo-backend/Controllers/ExportPdfController.cs#L108); `SignedScoreSheetService.CreateDraftAsync` | `ClassStudent`, `Classes`, `Exams`, `SignedScoreSheets`, `StudentExam`, `Students` |
| GET | `/api/pdf-export/drafts/{draftId:guid}/file` | `HasPermission(Permissions.ScoreSheets.SignAsExaminer, Permissions.ScoreSheets.SignAsFacultyHead)` | BE nghiệp vụ + CA DUT | [GetScoreSheetDraftFile](../plo-clo-backend/Controllers/ExportPdfController.cs#L117); `SignedScoreSheetService.GetDraftFileAsync` | Không truy vấn trực tiếp / xem luồng gọi |
| POST | `/api/pdf-export/drafts/{draftId:guid}/sign` | `HasPermission(Permissions.ScoreSheets.SignAsExaminer, Permissions.ScoreSheets.SignAsFacultyHead)` | BE nghiệp vụ + CA DUT | [SignScoreSheetDraft](../plo-clo-backend/Controllers/ExportPdfController.cs#L127); `SignedScoreSheetService.SignDraftAsync` | `Accounts`, `Classes`, `SignedScoreSheets` |
| POST | `/api/pdf-export/score-sheet/{classId}/sign` | `HasPermission(Permissions.ScoreSheets.SignAsExaminer, Permissions.ScoreSheets.SignAsFacultyHead)` | BE nghiệp vụ + CA DUT | [SignExistingScoreSheet](../plo-clo-backend/Controllers/ExportPdfController.cs#L139); `SignedScoreSheetService.SignExistingAsync` | `Accounts`, `SignedScoreSheets` |
| GET | `/api/pdf-export/score-sheet/{classId}/signed` | `HasPermission(Permissions.ScoreSheets.View, Permissions.ScoreSheets.ViewAll)` | BE nghiệp vụ + CA DUT | [GetSignedScoreSheet](../plo-clo-backend/Controllers/ExportPdfController.cs#L149); `SignedScoreSheetService.GetStatusAsync` | `Accounts`, `SignedScoreSheets` |
| GET | `/api/pdf-export/score-sheet/{classId}/signed/file` | `HasPermission(Permissions.ScoreSheets.View, Permissions.ScoreSheets.ViewAll)` | BE nghiệp vụ + CA DUT | [GetSignedScoreSheetFile](../plo-clo-backend/Controllers/ExportPdfController.cs#L160); `SignedScoreSheetService.GetSignedFileAsync` | `SignedScoreSheets` |
| GET | `/api/pdf-export/score-sheets/paged` | `HasPermission(Permissions.ScoreSheets.ViewAll)` | BE nghiệp vụ | [GetPagedScoreSheets](../plo-clo-backend/Controllers/ExportPdfController.cs#L178) | Không truy vấn trực tiếp / xem luồng gọi |
| DELETE | `/api/pdf-export/score-sheet/{classId}/signed` | `HasPermission(Permissions.ScoreSheets.Manage)` | BE nghiệp vụ + CA DUT | [DeleteSignedScoreSheet](../plo-clo-backend/Controllers/ExportPdfController.cs#L226); `SignedScoreSheetService.DeleteSignedScoreSheetAsync` | `SignedScoreSheets` |
| GET | `/api/pdf-export/faculty-score-sheets` | `HasPermission(Permissions.ScoreSheets.SignAsFacultyHead)` | BE nghiệp vụ + CA DUT | [GetFacultyScoreSheets](../plo-clo-backend/Controllers/ExportPdfController.cs#L240); `SignedScoreSheetService.GetFacultyScoreSheetsAsync` | `Accounts`, `SignedScoreSheets` |
| GET | `/api/pdf-export/certificate-status` | `HasPermission(Permissions.ScoreSheets.SignAsExaminer, Permissions.ScoreSheets.SignAsFacultyHead)` | BE nghiệp vụ + CA DUT | [GetCertificateStatus](../plo-clo-backend/Controllers/ExportPdfController.cs#L252); `SignedScoreSheetService.GetCertificateStatusAsync` | `Accounts` |
| POST | `/api/pdf-export/certificate-request` | `HasPermission(Permissions.ScoreSheets.SignAsExaminer, Permissions.ScoreSheets.SignAsFacultyHead)` | BE nghiệp vụ + CA DUT | [RequestCertificate](../plo-clo-backend/Controllers/ExportPdfController.cs#L261); `SignedScoreSheetService.RequestCertificateAsync` | `Accounts` |
| GET | `/api/pdf-export/signature-templates` | `HasPermission(Permissions.ScoreSheets.SignAsExaminer, Permissions.ScoreSheets.SignAsFacultyHead)` | BE nghiệp vụ + CA DUT | [GetSignatureTemplates](../plo-clo-backend/Controllers/ExportPdfController.cs#L270); `SignedScoreSheetService.GetSignatureTemplatesAsync` | `Accounts` |

### ExportWordController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/word-export/plo-list/{programmeId}` | `HasPermission(Permissions.Reports.ExportWord)` | BE nghiệp vụ | [ExportPLOList](../plo-clo-backend/Controllers/ExportWordController.cs#L19); `WordExportService.ExportWordPLOList` | `Classes`, `CoursePLO`, `Courses`, `PLOs`, `Programmes` |
| GET | `/api/word-export/clo-score/{classId}` | `HasPermission(Permissions.Reports.ExportWord)` | BE nghiệp vụ | [ExportCLOScore](../plo-clo-backend/Controllers/ExportWordController.cs#L27); `WordExportService.ExportWordCLOScore` | `CLOPLO`, `CLOQuestion`, `CLOs`, `ClassStudent`, `Classes`, `PLOs`, `Programmes`, `Questions`, `Results`, `Students` |

### FacultyController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/faculties` | `Authorize` | BE nghiệp vụ | [GetAll](../plo-clo-backend/Controllers/FacultyController.cs#L31); `FacultyService.GetAllFacultiesAsync` | `Faculties` |
| GET | `/api/faculties/{id}` | `Authorize` | BE nghiệp vụ | [GetById](../plo-clo-backend/Controllers/FacultyController.cs#L43); `FacultyService.GetFacultyByIdAsync` | `Faculties` |
| POST | `/api/faculties` | `HasPermission(Permissions.Faculties.Manage)` | BE nghiệp vụ | [Create](../plo-clo-backend/Controllers/FacultyController.cs#L56); `FacultyService.CreateFacultyAsync` | `Faculties` |
| PUT | `/api/faculties/{id}` | `HasPermission(Permissions.Faculties.Manage)` | BE nghiệp vụ | [Update](../plo-clo-backend/Controllers/FacultyController.cs#L71); `FacultyService.UpdateFacultyAsync` | `Faculties` |
| DELETE | `/api/faculties/{id}` | `HasPermission(Permissions.Faculties.Manage)` | BE nghiệp vụ | [Delete](../plo-clo-backend/Controllers/FacultyController.cs#L81); `FacultyService.DeleteFacultyAsync` | `Faculties` |

### MajorController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/majors` | `Authorize` | BE nghiệp vụ | [GetAll](../plo-clo-backend/Controllers/MajorController.cs#L31); `MajorService.GetFilteredMajorsAsync` | `Majors` |
| GET | `/api/majors/{id}` | `Authorize` | BE nghiệp vụ | [GetById](../plo-clo-backend/Controllers/MajorController.cs#L42); `MajorService.GetMajorByIdAsync` | `Majors` |
| POST | `/api/majors` | `HasPermission(Permissions.Majors.Manage)` | BE nghiệp vụ | [Create](../plo-clo-backend/Controllers/MajorController.cs#L55); `MajorService.CreateMajorAsync` | `Majors` |
| PUT | `/api/majors/{id}` | `HasPermission(Permissions.Majors.Manage)` | BE nghiệp vụ | [Update](../plo-clo-backend/Controllers/MajorController.cs#L75); `MajorService.UpdateMajorAsync` | `Majors` |
| DELETE | `/api/majors/{id}` | `HasPermission(Permissions.Majors.Manage)` | BE nghiệp vụ | [Delete](../plo-clo-backend/Controllers/MajorController.cs#L85); `MajorService.DeleteMajorAsync` | `Majors` |

### ParentExamSessionController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/parent-exam-sessions` | `HasPermission(Permissions.ExamSessions.View, Permissions.ExamSessions.ViewAll)` | BE nghiệp vụ | [GetAll](../plo-clo-backend/Controllers/ParentExamSessionController.cs#L40); `ParentExamSessionService.GetFilteredParentExamSessionAsync` | `ChildExamSessions`, `CorrectedResults`, `ParentExamSessions` |
| GET | `/api/parent-exam-sessions/paged` | `HasPermission(Permissions.ExamSessions.View, Permissions.ExamSessions.ViewAll)` | BE nghiệp vụ | [GetPaged](../plo-clo-backend/Controllers/ParentExamSessionController.cs#L63) | Không truy vấn trực tiếp / xem luồng gọi |
| GET | `/api/parent-exam-sessions/{id}` | `HasPermission(Permissions.ExamSessions.View, Permissions.ExamSessions.ViewAll)` | BE nghiệp vụ | [GetById](../plo-clo-backend/Controllers/ParentExamSessionController.cs#L108); `RecordAccessService.EnsureCanSeeParentExamSessionAsync`, `ParentExamSessionService.GetParentExamSessionByIdAsync` | `ChildExamSessions`, `ParentExamSessions` |
| POST | `/api/parent-exam-sessions` | `HasPermission(Permissions.ExamSessions.Manage)` | BE nghiệp vụ | [Create](../plo-clo-backend/Controllers/ParentExamSessionController.cs#L122); `ParentExamSessionService.CreateParentExamSessionAsync` | `Accounts`, `ChildExamSessions`, `Courses`, `Exams`, `ParentExamSessions`, `Semesters` |
| PUT | `/api/parent-exam-sessions/{id}` | `HasPermission(Permissions.ExamSessions.Manage)` | BE nghiệp vụ | [Update](../plo-clo-backend/Controllers/ParentExamSessionController.cs#L134); `ParentExamSessionService.UpdateParentExamSessionAsync` | `ChildExamSessions`, `ParentExamSessions` |
| DELETE | `/api/parent-exam-sessions/{id}` | `HasPermission(Permissions.ExamSessions.Manage)` | BE nghiệp vụ | [Delete](../plo-clo-backend/Controllers/ParentExamSessionController.cs#L145); `ParentExamSessionService.DeleteParentExamSessionAsync` | `ParentExamSessions` |
| POST | `/api/parent-exam-sessions/{id}/classes` | `HasPermission(Permissions.ExamSessions.Manage)` | BE nghiệp vụ | [AddClasses](../plo-clo-backend/Controllers/ParentExamSessionController.cs#L160); `ParentExamSessionService.AddClassesToParentExamSessionAsync` | `Classes`, `Exams`, `ParentExamSessions` |
| DELETE | `/api/parent-exam-sessions/{id}/classes` | `HasPermission(Permissions.ExamSessions.Manage)` | BE nghiệp vụ | [RemoveClasses](../plo-clo-backend/Controllers/ParentExamSessionController.cs#L172); `ParentExamSessionService.RemoveClassesFromParentExamSessionAsync` | `Classes`, `Exams`, `ParentExamSessions` |

### PermissionController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/permissions` | `HasPermission(Permissions.Roles.Manage)` | BE nghiệp vụ | [GetCatalogue](../plo-clo-backend/Controllers/PermissionController.cs#L19); `RoleService.GetPermissionCatalogueAsync` | `Accounts`, `Permissions`, `RolePermissions`, `Roles` |

### PLOController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/plos` | `Authorize` | BE nghiệp vụ | [GetAll](../plo-clo-backend/Controllers/PLOController.cs#L36); `PLOService.GetFilteredPLOsAsync` | `Classes`, `Courses`, `PLOs` |
| GET | `/api/plos/{id}` | `Authorize` | BE nghiệp vụ | [GetById](../plo-clo-backend/Controllers/PLOController.cs#L46); `PLOService.GetPLOByIdAsync` | `PLOs` |
| GET | `/api/plos/max-count` | `Authorize` | BE nghiệp vụ | [GetMaxPLOCount](../plo-clo-backend/Controllers/PLOController.cs#L58); `PLOService.GetMaxPLOCountAsync` | `PLOs` |
| POST | `/api/plos` | `HasPermission(Permissions.Plos.Manage)` | BE nghiệp vụ | [Create](../plo-clo-backend/Controllers/PLOController.cs#L70); `ProgrammeService.GetProgrammeByIdAsync`, `PLOService.CreatePLOAsync` | `PLOs`, `Programmes` |
| PUT | `/api/plos/{id}` | `HasPermission(Permissions.Plos.Manage)` | BE nghiệp vụ | [Update](../plo-clo-backend/Controllers/PLOController.cs#L99); `PLOService.GetPLOByIdAsync`, `PLOService.UpdatePLOAsync` | `PLOs` |
| DELETE | `/api/plos/{id}` | `HasPermission(Permissions.Plos.Manage)` | BE nghiệp vụ | [Delete](../plo-clo-backend/Controllers/PLOController.cs#L124); `PLOService.GetPLOByIdAsync`, `PLOService.DeletePLOAsync` | `PLOs` |
| GET | `/api/plos/{id}/clos` | `Authorize` | BE nghiệp vụ | [GetCLOs](../plo-clo-backend/Controllers/PLOController.cs#L148); `PLOService.GetPLOByIdAsync`, `CLOService.GetFilteredCLOsAsync` | `CLOPLO`, `CLOQuestion`, `CLOs`, `PLOs`, `Questions` |
| GET | `/api/plos/{id}/courses` | `Authorize` | BE nghiệp vụ | [GetCourses](../plo-clo-backend/Controllers/PLOController.cs#L169); `PLOService.GetCoursesOfPLOAsync` | `CoursePLO`, `PLOs` |

### ProgrammeController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/programmes` | `HasPermission(Permissions.Programmes.View, Permissions.Programmes.ViewAll)` | BE nghiệp vụ | [GetAll](../plo-clo-backend/Controllers/ProgrammeController.cs#L33); `ProgrammeService.GetFilteredProgrammesAsync` | `Courses`, `Curriculums`, `Programmes` |
| GET | `/api/programmes/{id}` | `HasPermission(Permissions.Programmes.View, Permissions.Programmes.ViewAll)` | BE nghiệp vụ | [GetById](../plo-clo-backend/Controllers/ProgrammeController.cs#L55); `RecordAccessService.EnsureCanSeeProgrammeAsync`, `ProgrammeService.GetProgrammeByIdAsync` | `Programmes` |
| POST | `/api/programmes` | `HasPermission(Permissions.Programmes.Manage)` | BE nghiệp vụ | [Create](../plo-clo-backend/Controllers/ProgrammeController.cs#L68); `ProgrammeService.CreateProgrammeAsync` | `Programmes` |
| PUT | `/api/programmes/{id}` | `HasPermission(Permissions.Programmes.Manage)` | BE nghiệp vụ | [Update](../plo-clo-backend/Controllers/ProgrammeController.cs#L79); `ProgrammeService.UpdateProgrammeAsync` | `Programmes` |
| POST | `/api/programmes/{id}/confirm` | `HasPermission(Permissions.Programmes.Confirm)` | BE nghiệp vụ | [ConfirmProgramme](../plo-clo-backend/Controllers/ProgrammeController.cs#L90); `ProgrammeService.ConfirmProgrammeAsync` | `Programmes` |
| DELETE | `/api/programmes/{id}` | `HasPermission(Permissions.Programmes.Manage)` | BE nghiệp vụ | [Delete](../plo-clo-backend/Controllers/ProgrammeController.cs#L101); `ProgrammeService.DeleteProgrammeAsync` | `Programmes` |
| GET | `/api/programmes/{id}/courses` | `HasPermission(Permissions.Programmes.View, Permissions.Programmes.ViewAll)` | BE nghiệp vụ | [GetCourses](../plo-clo-backend/Controllers/ProgrammeController.cs#L112); `RecordAccessService.EnsureCanSeeProgrammeAsync`, `ProgrammeService.GetCoursesInProgrammeAsync` | `Courses`, `Curriculums`, `Programmes` |
| POST | `/api/programmes/{id}/courses` | `HasPermission(Permissions.Programmes.ManageCourses)` | BE nghiệp vụ | [AddCourses](../plo-clo-backend/Controllers/ProgrammeController.cs#L127); `ProgrammeService.GetProgrammeByIdAsync`, `ProgrammeService.AddCoursesToProgrammeAsync` | `Courses`, `Curriculums`, `Programmes` |
| DELETE | `/api/programmes/{id}/courses` | `HasPermission(Permissions.Programmes.ManageCourses)` | BE nghiệp vụ | [RemoveCourses](../plo-clo-backend/Controllers/ProgrammeController.cs#L177); `ProgrammeService.GetProgrammeByIdAsync`, `ProgrammeService.RemoveCoursesFromProgrammeAsync` | `ClassStudent`, `Classes`, `CoursePLO`, `Courses`, `PLOs`, `Programmes`, `Students` |
| PATCH | `/api/programmes/{id}/courses/is-core` | `HasPermission(Permissions.Programmes.ManageCourses)` | BE nghiệp vụ | [UpdateCoursesIsCoreStatus](../plo-clo-backend/Controllers/ProgrammeController.cs#L204); `ProgrammeService.GetProgrammeByIdAsync`, `ProgrammeService.UpdateCourseIsCoreStatus` | `CoursePLO`, `Courses`, `Curriculums`, `PLOs`, `Programmes` |
| POST | `/api/programmes/{id}/copy-structure` | `HasPermission(Permissions.Programmes.ManageCourses) + HasPermission(Permissions.Plos.Manage) + HasPermission(Permissions.CoursePlos.Map) + HasPermission(Permissions.PloClos.Map)` | BE nghiệp vụ | [CopyProgrammeStructure](../plo-clo-backend/Controllers/ProgrammeController.cs#L231); `ProgrammeService.GetProgrammeByIdAsync`, `ProgrammeService.CopyProgrammeStructureAsync` | `CLOPLO`, `CLOs`, `Courses`, `Curriculums`, `PLOs`, `Programmes` |

### QuestionController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/questions` | `Authorize` | BE nghiệp vụ | [GetAll](../plo-clo-backend/Controllers/QuestionController.cs#L33); `QuestionService.GetQuestionsByExamIdAsync`, `QuestionService.GetAllQuestionsAsync` | `Questions` |
| GET | `/api/questions/{id}` | `Authorize` | BE nghiệp vụ | [GetById](../plo-clo-backend/Controllers/QuestionController.cs#L51); `QuestionService.GetQuestionByIdAsync` | `Questions` |
| POST | `/api/questions` | `HasPermission(Permissions.Exams.Manage)` | BE nghiệp vụ | [Create](../plo-clo-backend/Controllers/QuestionController.cs#L62); `QuestionService.CreateQuestionAsync` | `Questions` |
| PUT | `/api/questions/{id}` | `HasPermission(Permissions.Exams.Manage)` | BE nghiệp vụ | [Update](../plo-clo-backend/Controllers/QuestionController.cs#L72); `QuestionService.UpdateQuestionAsync` | `Questions` |
| DELETE | `/api/questions/{id}` | `HasPermission(Permissions.Exams.Manage)` | BE nghiệp vụ | [Delete](../plo-clo-backend/Controllers/QuestionController.cs#L84); `QuestionService.DeleteQuestionAsync` | `Questions` |
| GET | `/api/questions/{id}/clo` | `Authorize` | BE nghiệp vụ | [GetCLOs](../plo-clo-backend/Controllers/QuestionController.cs#L96); `QuestionService.GetQuestionByIdAsync`, `CLOService.GetFilteredCLOsAsync` | `CLOPLO`, `CLOQuestion`, `CLOs`, `PLOs`, `Questions` |
| PUT | `/api/questions/{id}/clo` | `HasPermission(Permissions.QuestionClos.Map)` | BE nghiệp vụ | [UpdateCLOs](../plo-clo-backend/Controllers/QuestionController.cs#L111); `QuestionService.GetQuestionByIdAsync`, `QuestionService.UpdateCLOsOfQuestionAsync` | `CLOQuestion`, `CLOs`, `Classes`, `Exams`, `ParentExamSessions`, `Questions` |

### ResultController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/results` | `Authorize` | BE nghiệp vụ | [GetAll](../plo-clo-backend/Controllers/ResultController.cs#L26); `RecordAccessService.EnsureCanSeeScoresAsync`, `ResultService.GetFilteredResultsAsync` | `ChildExamSessions`, `Classes`, `Exams`, `ParentExamSessions`, `Results` |
| GET | `/api/results/{id}` | `Authorize` | BE nghiệp vụ | [GetById](../plo-clo-backend/Controllers/ResultController.cs#L38); `ResultService.GetResultByIdAsync`, `RecordAccessService.EnsureCanSeeQuestionScoresAsync` | `ChildExamSessions`, `Classes`, `Exams`, `ParentExamSessions`, `Questions`, `Results` |
| POST | `/api/results` | `HasPermission(Permissions.Scores.Enter)` | BE nghiệp vụ | [Create](../plo-clo-backend/Controllers/ResultController.cs#L51); `ResultService.CreateResultAsync` | `Questions`, `Results` |
| PUT | `/api/results/{id}` | `HasPermission(Permissions.Scores.Enter)` | BE nghiệp vụ | [Update](../plo-clo-backend/Controllers/ResultController.cs#L62); `ResultService.UpdateResultAsync` | `Questions`, `Results` |
| PUT | `/api/results/upsert` | `HasPermission(Permissions.Scores.Enter)` | BE nghiệp vụ | [Upsert](../plo-clo-backend/Controllers/ResultController.cs#L76); `ResultService.UpsertResultAsync` | `Questions`, `Results` |
| PUT | `/api/results/bulk` | `HasPermission(Permissions.Scores.Enter)` | BE nghiệp vụ | [UpsertBulk](../plo-clo-backend/Controllers/ResultController.cs#L91); `ResultService.UpsertResultsBulkAsync` | `Questions`, `Results` |
| DELETE | `/api/results/{id}` | `HasPermission(Permissions.Scores.Enter)` | BE nghiệp vụ | [Delete](../plo-clo-backend/Controllers/ResultController.cs#L103); `ResultService.DeleteResultAsync` | `Questions`, `Results` |
| POST | `/api/results/confirm` | `HasPermission(Permissions.Scores.Confirm)` | BE nghiệp vụ | [Confirm](../plo-clo-backend/Controllers/ResultController.cs#L118); `ResultService.ConfirmResultAsync` | `ChildExamSessions`, `ClassStudent`, `Classes`, `Courses`, `Exams`, `ParentExamSessions`, `Questions`, `Results`, `StudentExam`, `Students` |
| GET | `/api/results/calculate-clo-score` | `Authorize` | BE nghiệp vụ | [CalculateCLOScore](../plo-clo-backend/Controllers/ResultController.cs#L152); `RecordAccessService.EnsureCanSeeClassScoresAsync`, `ResultService.CalculateCLOScore` | `CLOQuestion`, `CLOs`, `ClassStudent`, `Classes`, `Questions`, `Results`, `Students` |
| GET | `/api/results/student-clo-scores-for-class` | `Authorize` | BE nghiệp vụ | [GetAllStudentCLOScoresForClass](../plo-clo-backend/Controllers/ResultController.cs#L171); `RecordAccessService.EnsureCanSeeClassScoresAsync`, `ResultService.GetAllStudentCLOScoresForClassAsync` | `CLOQuestion`, `CLOs`, `ClassStudent`, `Classes`, `Questions`, `Results`, `Students` |
| GET | `/api/results/calculate-clo-score-max` | `Authorize` | BE nghiệp vụ | [CalculateCLOScoreMax](../plo-clo-backend/Controllers/ResultController.cs#L184); `RecordAccessService.EnsureCanSeeClassScoresAsync`, `ResultService.CalculateCLOScoreMax` | `CLOQuestion`, `CLOs`, `Classes`, `Questions` |
| GET | `/api/results/calculate-pk-score` | `Authorize` | BE nghiệp vụ | [CalculatePkScore](../plo-clo-backend/Controllers/ResultController.cs#L203); `RecordAccessService.EnsureCanSeeClassScoresAsync`, `ResultService.CalculatePkScore` | `CLOPLO`, `CLOQuestion`, `CLOs`, `ClassStudent`, `Classes`, `PLOs`, `Questions`, `Results`, `Students` |
| GET | `/api/results/student-pk-scores-for-class` | `Authorize` | BE nghiệp vụ | [GetAllStudentPkScoresForClass](../plo-clo-backend/Controllers/ResultController.cs#L215); `RecordAccessService.EnsureCanSeeClassScoresAsync`, `ResultService.GetAllStudentPkScoresForClass` | `CLOPLO`, `CLOQuestion`, `CLOs`, `ClassStudent`, `Classes`, `PLOs`, `Questions`, `Results`, `Students` |
| GET | `/api/results/calculate-max-pk-score-for-course` | `HasPermission(Permissions.Graduation.View)` | BE nghiệp vụ | [CalculateMaxPkScoreForCourse](../plo-clo-backend/Controllers/ResultController.cs#L227); `RecordAccessService.EnsureCanSeeStudentProgrammeAsync`, `ResultService.CalculateMaxPkScoreForCourse` | `CLOPLO`, `CLOQuestion`, `CLOs`, `ClassStudent`, `Classes`, `Exams`, `PLOs`, `Programmes`, `Questions`, `Results`, `Students` |
| GET | `/api/results/calculate-plo-score` | `HasPermission(Permissions.Graduation.View)` | BE nghiệp vụ | [CalculatePLOScore](../plo-clo-backend/Controllers/ResultController.cs#L239); `RecordAccessService.EnsureCanSeeStudentProgrammeAsync`, `ResultService.CalculatePLOScore` | `CLOPLO`, `CLOQuestion`, `CLOs`, `ClassStudent`, `Classes`, `CoursePLO`, `PLOs`, `Programmes`, `Questions`, `Results`, `Students` |
| GET | `/api/results/student-plo-scores-for-programme` | `HasPermission(Permissions.Graduation.View)` | BE nghiệp vụ | [GetAllStudentPLOScoresForProgramme](../plo-clo-backend/Controllers/ResultController.cs#L251); `RecordAccessService.EnsureCanSeeProgrammeAsync`, `ResultService.GetAllStudentPLOScoresForProgramme` | `Programmes`, `StudentPLOs` |
| GET | `/api/results/clo-passed-percentages` | `Authorize` | BE nghiệp vụ | [GetCLOPassedPercentages](../plo-clo-backend/Controllers/ResultController.cs#L263); `RecordAccessService.EnsureCanSeeClassScoresAsync`, `ResultService.GetCLOPassedPercentagesAsync` | `CLOQuestion`, `CLOs`, `ClassStudent`, `Classes`, `Questions`, `Results`, `Students` |
| GET | `/api/results/plo-passed-percentages` | `HasPermission(Permissions.Graduation.View)` | BE nghiệp vụ | [GetPLOPassedPercentages](../plo-clo-backend/Controllers/ResultController.cs#L275); `RecordAccessService.EnsureCanSeeProgrammeAsync`, `ResultService.GetPLOPassedPercentagesAsync` | `PLOs`, `Programmes`, `StudentPLOs` |
| GET | `/api/results/student-programme-completion-status` | `HasPermission(Permissions.Graduation.View)` | BE nghiệp vụ | [GetStudentProgrammeCompletionStatus](../plo-clo-backend/Controllers/ResultController.cs#L290); `RecordAccessService.NarrowProgrammeIdsAsync`, `ResultService.GetStudentProgrammeCompletionStatus` | `Programmes`, `StudentProgrammeCompletions`, `Students` |
| GET | `/api/results/plo-scores` | `HasPermission(Permissions.Graduation.View)` | BE nghiệp vụ | [GetStudentPLOScores](../plo-clo-backend/Controllers/ResultController.cs#L302); `RecordAccessService.NarrowProgrammeIdsAsync`, `ResultService.GetAllStudentPLOScores` | `Programmes`, `StudentPLOs` |
| POST | `/api/results/recalculate` | `HasPermission(Permissions.Graduation.Recalculate)` | BE nghiệp vụ | [Recalculate](../plo-clo-backend/Controllers/ResultController.cs#L321); `ResultService.RecalculateAsync` | `CLOPLO`, `CLOQuestion`, `CLOs`, `ClassStudent`, `Classes`, `CoursePLO`, `Courses`, `Curriculums`, `Exams`, `PLOs`, `Programmes`, `Questions`, `Results`, `StudentPLOs`, `StudentProgrammeCompletions`, `Students` |
| GET | `/api/results/graduation-review` | `HasPermission(Permissions.Graduation.View)` | BE nghiệp vụ | [GetGraduationReview](../plo-clo-backend/Controllers/ResultController.cs#L337); `RecordAccessService.NarrowProgrammeIdsAsync`, `ResultService.GetGraduationReviewAsync` | `PLOs`, `Programmes`, `StudentPLOs`, `StudentProgrammeCompletions`, `Students` |
| GET | `/api/results/student-plo-scores-by-code` | `Authorize(Policy = "DDUT_JWT")` | BE nghiệp vụ | [GetStudentPLOScoresByCode](../plo-clo-backend/Controllers/ResultController.cs#L353); `AccountService.GetStudentCodeByMicrosoftEmail`, `ResultService.GetStudentPLOScoresByCodeAsync` | `Accounts`, `StudentPLOs`, `Students` |
| GET | `/api/results/my-plo-scores` | `Authorize` | BE nghiệp vụ | [GetMyPLOScores](../plo-clo-backend/Controllers/ResultController.cs#L369); `ResultService.GetStudentPLOScoresByIdAsync` | `StudentPLOs`, `Students` |
| GET | `/api/results/my-programme-completion` | `Authorize` | BE nghiệp vụ | [GetMyProgrammeCompletion](../plo-clo-backend/Controllers/ResultController.cs#L386); `ResultService.GetStudentProgrammeCompletionByIdAsync` | `StudentProgrammeCompletions`, `Students` |

### RoleController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/roles` | `Authorize` | BE nghiệp vụ | [GetAll](../plo-clo-backend/Controllers/RoleController.cs#L20); `RoleService.GetRolesAsync` | `Roles` |
| GET | `/api/roles/{id}` | `HasPermission(Permissions.Roles.Manage)` | BE nghiệp vụ | [GetById](../plo-clo-backend/Controllers/RoleController.cs#L29); `RoleService.GetRoleAsync` | `Accounts`, `RolePermissions`, `Roles` |
| POST | `/api/roles` | `HasPermission(Permissions.Roles.Manage)` | BE nghiệp vụ | [Create](../plo-clo-backend/Controllers/RoleController.cs#L39); `RoleService.CreateRoleAsync` | `Accounts`, `Permissions`, `RolePermissions`, `Roles` |
| PUT | `/api/roles/{id}` | `HasPermission(Permissions.Roles.Manage)` | BE nghiệp vụ | [Update](../plo-clo-backend/Controllers/RoleController.cs#L51); `RoleService.UpdateRoleAsync` | `Accounts`, `Permissions`, `RolePermissions`, `Roles` |
| DELETE | `/api/roles/{id}` | `HasPermission(Permissions.Roles.Manage)` | BE nghiệp vụ | [Delete](../plo-clo-backend/Controllers/RoleController.cs#L62); `RoleService.DeleteRoleAsync` | `Accounts`, `Permissions`, `RolePermissions`, `Roles` |

### ScoreAppealController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/score-appeals` | `HasPermission(Permissions.ScoreAppeals.View, Permissions.ScoreAppeals.ViewAll)` | BE nghiệp vụ | [GetAll](../plo-clo-backend/Controllers/ScoreAppealController.cs#L37); `ScoreAppealService.GetScoreAppealsAsync` | `AppealedResults`, `ScoreAppeals` |
| GET | `/api/score-appeals/{id}` | `HasPermission(Permissions.ScoreAppeals.View, Permissions.ScoreAppeals.ViewAll)` | BE nghiệp vụ | [GetById](../plo-clo-backend/Controllers/ScoreAppealController.cs#L52); `ScoreAppealService.GetScoreAppealByIdAsync` | `AppealedResults`, `ScoreAppeals` |
| POST | `/api/score-appeals` | `HasPermission(Permissions.ScoreAppeals.Create)` | BE nghiệp vụ | [Create](../plo-clo-backend/Controllers/ScoreAppealController.cs#L68); `ScoreAppealService.CreateScoreAppealAsync` | `AppealedResults`, `ChildExamSessions`, `ClassStudent`, `Classes`, `Exams`, `ScoreAppeals`, `Students` |
| PUT | `/api/score-appeals/{id}/assign` | `HasPermission(Permissions.ScoreAppeals.Manage)` | BE nghiệp vụ | [AssignMarker](../plo-clo-backend/Controllers/ScoreAppealController.cs#L90); `ScoreAppealService.AssignMarkerAsync` | `AppealedResults`, `Classes`, `ScoreAppeals`, `Teachers` |
| PUT | `/api/score-appeals/{id}/results` | `HasPermission(Permissions.ScoreAppeals.Mark)` | BE nghiệp vụ | [SubmitResults](../plo-clo-backend/Controllers/ScoreAppealController.cs#L104); `ScoreAppealService.SubmitAppealedResultsAsync` | `AppealedResults`, `Questions`, `Results`, `ScoreAppeals` |
| POST | `/api/score-appeals/{id}/apply` | `HasPermission(Permissions.ScoreAppeals.Manage)` | BE nghiệp vụ | [Apply](../plo-clo-backend/Controllers/ScoreAppealController.cs#L116); `ScoreAppealService.ApplyScoreAppealAsync` | `Accounts`, `AppealedResults`, `ChildExamSessions`, `ClassStudent`, `Classes`, `Courses`, `Exams`, `Questions`, `Results`, `ScoreAppeals`, `StudentExam`, `Students` |
| POST | `/api/score-appeals/{id}/revert-apply` | `HasPermission(Permissions.ScoreAppeals.Manage)` | BE nghiệp vụ | [RevertApply](../plo-clo-backend/Controllers/ScoreAppealController.cs#L128); `ScoreAppealService.RevertApplyScoreAppealAsync` | `AppealedResults`, `ChildExamSessions`, `ClassStudent`, `Classes`, `Courses`, `Exams`, `Questions`, `Results`, `ScoreAppeals`, `StudentExam`, `Students` |
| POST | `/api/score-appeals/{id}/reject` | `HasPermission(Permissions.ScoreAppeals.Manage)` | BE nghiệp vụ | [Reject](../plo-clo-backend/Controllers/ScoreAppealController.cs#L140); `ScoreAppealService.RejectScoreAppealAsync` | `Accounts`, `AppealedResults`, `ScoreAppeals` |
| DELETE | `/api/score-appeals/{id}` | `HasPermission(Permissions.ScoreAppeals.Delete)` | BE nghiệp vụ | [Delete](../plo-clo-backend/Controllers/ScoreAppealController.cs#L151); `ScoreAppealService.DeleteScoreAppealAsync` | `AppealedResults`, `ScoreAppeals` |

### SemesterController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/semesters` | `Authorize` | BE nghiệp vụ | [GetAll](../plo-clo-backend/Controllers/SemesterController.cs#L32); `SemesterService.GetFilteredSemestersAsync` | `Semesters` |
| GET | `/api/semesters/{id}` | `Authorize` | BE nghiệp vụ | [GetById](../plo-clo-backend/Controllers/SemesterController.cs#L46); `SemesterService.GetSemesterByIdAsync` | `Semesters` |
| POST | `/api/semesters` | `HasPermission(Permissions.Semesters.Manage)` | BE nghiệp vụ | [Create](../plo-clo-backend/Controllers/SemesterController.cs#L59); `SemesterService.CreateSemesterAsync` | `Semesters` |
| PUT | `/api/semesters/{id}` | `HasPermission(Permissions.Semesters.Manage)` | BE nghiệp vụ | [Update](../plo-clo-backend/Controllers/SemesterController.cs#L74); `SemesterService.UpdateSemesterAsync` | `Semesters` |
| DELETE | `/api/semesters/{id}` | `HasPermission(Permissions.Semesters.Manage)` | BE nghiệp vụ | [Delete](../plo-clo-backend/Controllers/SemesterController.cs#L84); `SemesterService.DeleteSemesterAsync` | `Semesters` |
| PUT | `/api/semesters/{id}/status` | `HasPermission(Permissions.Semesters.Manage)` | BE nghiệp vụ | [SetActiveStatus](../plo-clo-backend/Controllers/SemesterController.cs#L94); `SemesterService.SetSemesterActiveStatusAsync` | `Semesters` |

### SettingController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/settings` | `Authorize + Authorize` | BE nghiệp vụ | [GetSetting](../plo-clo-backend/Controllers/SettingController.cs#L23); `SettingService.GetSettingAsync` | `Settings` |
| PUT | `/api/settings` | `Authorize + HasPermission(Permissions.Settings.Manage)` | BE nghiệp vụ | [Upsert](../plo-clo-backend/Controllers/SettingController.cs#L32); `SettingService.UpdateSettingAsync` | `Settings` |

### StudentController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/students` | `Authorize` | BE nghiệp vụ | [GetAll](../plo-clo-backend/Controllers/StudentController.cs#L51); `StudentService.GetFilteredStudentsAsync` | `ClassStudent`, `Classes`, `Programmes`, `Students` |
| GET | `/api/students/paged` | `Authorize` | BE nghiệp vụ | [GetPaged](../plo-clo-backend/Controllers/StudentController.cs#L66) | `Classes` |
| GET | `/api/students/{id}` | `Authorize` | BE nghiệp vụ | [GetById](../plo-clo-backend/Controllers/StudentController.cs#L85); `RecordAccessService.EnsureCanSeeStudent`, `StudentService.GetStudentByIdAsync` | `Students` |
| GET | `/api/students/me/result-summary` | `Authorize` | BE nghiệp vụ | [GetMyResultSummary](../plo-clo-backend/Controllers/StudentController.cs#L103); `StudentService.GetStudentResultSummaryAsync` | `ClassStudent`, `Classes`, `Curriculums`, `Exams`, `Questions`, `Results`, `Students` |
| GET | `/api/students/external/{studentCode}/scores` | `HasPermission(Permissions.Integration.ReadScores, AuthenticationSchemes = "CustomJWT,ApiKey")` | BE API tích hợp | [GetStudentScoresExternal](../plo-clo-backend/Controllers/StudentController.cs#L119); `StudentService.GetStudentScoresByCodeAsync` | `ClassStudent`, `Classes`, `Exams`, `StudentExam`, `Students` |
| POST | `/api/students` | `HasPermission(Permissions.Students.Manage, Permissions.Integration.SyncStudents, AuthenticationSchemes = "CustomJWT,ApiKey")` | BE nghiệp vụ | [Create](../plo-clo-backend/Controllers/StudentController.cs#L129); `StudentService.CreateStudentAsync` | `Accounts`, `RolePermissions`, `Roles`, `Students` |
| PUT | `/api/students/{id}` | `HasPermission(Permissions.Students.Manage)` | BE nghiệp vụ | [Update](../plo-clo-backend/Controllers/StudentController.cs#L144); `StudentService.UpdateStudentAsync` | `Students` |
| PUT | `/api/students/programme` | `HasPermission(Permissions.Students.Manage)` | BE nghiệp vụ | [MoveProgramme](../plo-clo-backend/Controllers/StudentController.cs#L158); `StudentService.MoveStudentsToProgrammeAsync` | `Programmes`, `Students` |
| DELETE | `/api/students/{id}` | `HasPermission(Permissions.Students.Manage)` | BE nghiệp vụ | [Delete](../plo-clo-backend/Controllers/StudentController.cs#L168); `StudentService.DeleteStudentAsync` | `Accounts`, `Students` |

### StudentExamController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/student-exams` | `Authorize + Authorize` | BE nghiệp vụ | [GetAll](../plo-clo-backend/Controllers/StudentExamController.cs#L24); `RecordAccessService.EnsureCanSeeScoresAsync`, `StudentExamService.GetFilteredStudentExamsAsync` | `ChildExamSessions`, `Classes`, `Exams`, `ParentExamSessions`, `StudentExam`, `Students` |
| PUT | `/api/student-exams` | `Authorize + HasPermission(Permissions.StudentExamNotes.Edit)` | BE nghiệp vụ | [Upsert](../plo-clo-backend/Controllers/StudentExamController.cs#L34); `StudentExamService.UpsertStudentExamAsync` | `StudentExam` |

### StudentPLOController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| DELETE | `/api/student-plos` | `Authorize + HasPermission(Permissions.StudentPlos.Delete)` | BE nghiệp vụ | [BulkDelete](../plo-clo-backend/Controllers/StudentPLOController.cs#L26); `StudentPLOService.DeleteStudentPLOsAsync` | `StudentPLOs` |

### TeacherController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/teachers` | `Authorize` | BE nghiệp vụ | [GetAll](../plo-clo-backend/Controllers/TeacherController.cs#L29); `TeacherService.GetFilteredTeachersAsync` | `Classes`, `Teachers` |
| GET | `/api/teachers/{id}` | `Authorize` | BE nghiệp vụ | [GetById](../plo-clo-backend/Controllers/TeacherController.cs#L39); `TeacherService.GetTeacherByIdAsync` | `Teachers` |
| POST | `/api/teachers` | `HasPermission(Permissions.Teachers.Manage)` | BE nghiệp vụ | [Create](../plo-clo-backend/Controllers/TeacherController.cs#L52); `TeacherService.CreateTeacherAsync` | `Accounts`, `RolePermissions`, `Roles`, `Teachers` |
| POST | `/api/teachers/external` | `HasPermission(Permissions.Integration.SyncTeachers, AuthenticationSchemes = "CustomJWT,ApiKey")` | BE API tích hợp | [CreateExternal](../plo-clo-backend/Controllers/TeacherController.cs#L67); `TeacherService.IsTeacherAccountWithThisMicrosoftEmailExist`, `TeacherService.CreateTeacherAsync` | `Accounts`, `RolePermissions`, `Roles`, `Teachers` |
| PUT | `/api/teachers/{id}` | `HasPermission(Permissions.Teachers.Manage)` | BE nghiệp vụ | [Update](../plo-clo-backend/Controllers/TeacherController.cs#L88); `TeacherService.UpdateTeacherAsync` | `Teachers` |
| DELETE | `/api/teachers/{id}` | `HasPermission(Permissions.Teachers.Manage)` | BE nghiệp vụ | [Delete](../plo-clo-backend/Controllers/TeacherController.cs#L99); `TeacherService.DeleteTeacherAsync` | `Accounts`, `Teachers` |

### UserActivityLogController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/user-activity-logs` | `HasPermission(Permissions.AuditLogs.View)` | BE nghiệp vụ | [GetAll](../plo-clo-backend/Controllers/UserActivityLogController.cs#L27); `UserActivityLogService.GetAllUserActivityLogsAsync` | `UserActivityLogs` |
| GET | `/api/user-activity-logs/paged` | `Authorize(Roles = "Admin")` | BE nghiệp vụ | [GetPaged](../plo-clo-backend/Controllers/UserActivityLogController.cs#L42) | Không truy vấn trực tiếp / xem luồng gọi |
| GET | `/api/user-activity-logs/test-ip` | `HasPermission(Permissions.AuditLogs.View)` | BE nghiệp vụ | [TestIP](../plo-clo-backend/Controllers/UserActivityLogController.cs#L66) | Không truy vấn trực tiếp / xem luồng gọi |

### WorkUnitController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/work-units` | `Authorize` | BE nghiệp vụ | [GetAll](../plo-clo-backend/Controllers/WorkUnitController.cs#L26); `WorkUnitService.GetAllWorkUnitsAsync` | `WorkUnits` |

## tkb-be

60 action HTTP.

### AccountController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/Account` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [GetAccounts](../tkb-be/Controllers/AccountController.cs#L20); `AccountService.GetAccountsAsync` | `Account`, `Account_Role`, `Lecturer`, `Role` |
| GET | `/api/Account/roles` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [GetRoles](../tkb-be/Controllers/AccountController.cs#L32); `AccountService.GetRolesAsync` | `Role` |
| POST | `/api/Account` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [CreateAccount](../tkb-be/Controllers/AccountController.cs#L39); `AccountService.CreateAccountAsync` | `Account`, `Account_Role`, `Lecturer`, `Role` |
| PUT | `/api/Account/{accountId:int}` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [UpdateAccount](../tkb-be/Controllers/AccountController.cs#L54); `AccountService.UpdateAccountAsync` | `Account`, `Account_Role`, `Lecturer`, `Role` |
| DELETE | `/api/Account/{accountId:int}` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [DeleteAccount](../tkb-be/Controllers/AccountController.cs#L74); `AccountService.DeleteAccountAsync` | `Account`, `Account_Role`, `Lecturer` |

### AuthController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| POST | `/api/Auth/login` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [Login](../tkb-be/Controllers/AuthController.cs#L30) | `Account`, `Account_Role`, `Lecturer`, `Role` |
| POST | `/api/Auth/login-sso` | `Public: không có thuộc tính auth` | BE nhận/đổi token SSO | [LoginSso](../tkb-be/Controllers/AuthController.cs#L54) | `Account`, `Account_Role`, `Lecturer`, `Role` |
| GET | `/api/Auth/profile` | `Authorize` | BE nghiệp vụ | [GetProfile](../tkb-be/Controllers/AuthController.cs#L162) | `Account`, `Account_Role`, `Lecturer`, `Role` |
| PUT | `/api/Auth/change-password` | `Authorize` | BE nghiệp vụ | [ChangePassword](../tkb-be/Controllers/AuthController.cs#L211) | `Account` |
| POST | `/api/Auth/select-role` | `Authorize` | BE nghiệp vụ | [SelectRole](../tkb-be/Controllers/AuthController.cs#L253) | `Account`, `Account_Role`, `Lecturer`, `Role` |

### ClassroomController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/Classroom` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [GetClassrooms](../tkb-be/Controllers/ClassroomController.cs#L19); `ClassroomService.GetClassroomDtosAsync` | `Classroom` |
| GET | `/api/Classroom/building` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [GetClassroomsByBuilding](../tkb-be/Controllers/ClassroomController.cs#L31); `ClassroomService.GetClassroomsByBuildingAsync` | `Classroom` |
| GET | `/api/Classroom/suggest` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [SuggestClassrooms](../tkb-be/Controllers/ClassroomController.cs#L38); `ClassroomService.SuggestClassroomsAsync` | `Classroom` |
| POST | `/api/Classroom` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [CreateClassroom](../tkb-be/Controllers/ClassroomController.cs#L45); `ClassroomService.CreateClassroomAsync` | `Classroom` |
| PUT | `/api/Classroom/{classroomId}` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [UpdateClassroom](../tkb-be/Controllers/ClassroomController.cs#L60); `ClassroomService.UpdateClassroomAsync` | `Classroom` |
| DELETE | `/api/Classroom/{classroomId}` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [DeleteClassroom](../tkb-be/Controllers/ClassroomController.cs#L76); `ClassroomService.DeleteClassroomAsync` | `Classroom`, `Timetable` |

### CourseSectionController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/CourseSection` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [GetCourseSections](../tkb-be/Controllers/CourseSectionController.cs#L20); `CourseSectionService.GetCourseSectionsPagedAsync`, `CourseSectionService.GetCourseSectionsAsync` | `CourseSection`, `Faculty`, `Lecturer` |
| GET | `/api/CourseSection/{courseId}` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [GetCourseSectionById](../tkb-be/Controllers/CourseSectionController.cs#L45); `CourseSectionService.GetCourseSectionByIdAsync` | `CourseSection`, `Faculty`, `Lecturer` |
| POST | `/api/CourseSection` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [CreateCourseSection](../tkb-be/Controllers/CourseSectionController.cs#L56); `CourseSectionService.CreateCourseSectionAsync` | `CourseSection`, `Faculty`, `Lecturer` |
| PUT | `/api/CourseSection/{courseId}` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [UpdateCourseSection](../tkb-be/Controllers/CourseSectionController.cs#L71); `CourseSectionService.UpdateCourseSectionAsync` | `CourseSection`, `Faculty`, `Lecturer` |
| DELETE | `/api/CourseSection/{courseId}` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [DeleteCourseSection](../tkb-be/Controllers/CourseSectionController.cs#L89); `CourseSectionService.DeleteCourseSectionAsync` | `CourseSection`, `Timetable` |

### DashboardController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/Dashboard/stats` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [GetDashboardStats](../tkb-be/Controllers/DashboardController.cs#L19); `DashboardService.GetDashboardStatsAsync` | `Classroom`, `CourseSection`, `Lecturer`, `SystemConfigs`, `Timetable` |
| GET | `/api/Dashboard/rooms-by-building` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [GetRoomStatsByBuilding](../tkb-be/Controllers/DashboardController.cs#L27); `DashboardService.GetRoomStatsByBuildingAsync` | `Classroom` |
| GET | `/api/Dashboard/course-sections-by-building` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [GetCourseSectionsByBuilding](../tkb-be/Controllers/DashboardController.cs#L35); `DashboardService.GetCourseSectionsByBuildingAsync` | `Classroom`, `Timetable` |
| GET | `/api/Dashboard/room-usage-by-day` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [GetRoomUsageByDay](../tkb-be/Controllers/DashboardController.cs#L43); `DashboardService.GetRoomUsageByDayAsync` | `SystemConfigs`, `Timetable` |
| GET | `/api/Dashboard/schedule-conflicts` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [GetScheduleConflicts](../tkb-be/Controllers/DashboardController.cs#L53); `DashboardService.GetScheduleConflictsAsync` | `Classroom`, `ClassroomPeriodLock`, `Lecturer`, `SystemConfigs`, `Timetable` |

### FacultyController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/Faculty` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [GetFaculties](../tkb-be/Controllers/FacultyController.cs#L20); `FacultyService.GetFacultiesPagedAsync`, `FacultyService.GetAllFacultiesAsync` | `CourseSection`, `Faculty`, `Lecturer` |
| GET | `/api/Faculty/{facultyId:int}` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [GetFaculty](../tkb-be/Controllers/FacultyController.cs#L37); `FacultyService.GetFacultyByIdAsync` | `CourseSection`, `Faculty`, `Lecturer` |
| POST | `/api/Faculty` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [CreateFaculty](../tkb-be/Controllers/FacultyController.cs#L47); `FacultyService.CreateFacultyAsync` | `CourseSection`, `Faculty`, `Lecturer` |
| PUT | `/api/Faculty/{facultyId:int}` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [UpdateFaculty](../tkb-be/Controllers/FacultyController.cs#L62); `FacultyService.UpdateFacultyAsync` | `CourseSection`, `Faculty`, `Lecturer` |
| DELETE | `/api/Faculty/{facultyId:int}` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [DeleteFaculty](../tkb-be/Controllers/FacultyController.cs#L82); `FacultyService.DeleteFacultyAsync` | `CourseSection`, `Faculty`, `Lecturer` |

### LecturerController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/Lecturer` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [GetLecturers](../tkb-be/Controllers/LecturerController.cs#L20); `LecturerService.GetLecturersAsync` | `Faculty`, `Lecturer` |
| POST | `/api/Lecturer` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [CreateLecturer](../tkb-be/Controllers/LecturerController.cs#L42); `LecturerService.CreateLecturerAsync` | `Faculty`, `Lecturer` |
| PUT | `/api/Lecturer/{lecturerId:int}` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [UpdateLecturer](../tkb-be/Controllers/LecturerController.cs#L57); `LecturerService.UpdateLecturerAsync` | `Faculty`, `Lecturer` |
| DELETE | `/api/Lecturer/{lecturerId:int}` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [DeleteLecturer](../tkb-be/Controllers/LecturerController.cs#L73); `LecturerService.DeleteLecturerAsync` | `CourseSection`, `Lecturer`, `Timetable` |

### LookupController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/Lookup/course-section-form` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [GetCourseSectionFormOptions](../tkb-be/Controllers/LookupController.cs#L19); `LookupService.GetCourseSectionFormOptionsAsync` | `Faculty`, `Lecturer` |

### ScheduleController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| POST | `/api/Schedule/generate` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [Generate](../tkb-be/Controllers/ScheduleController.cs#L24); `ScheduleService.GenerateScheduleAsync` | `Classroom`, `ClassroomPeriodLock`, `CourseSection`, `Lecturer`, `SystemConfigs`, `Timetable` |
| POST | `/api/Schedule/save` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [Save](../tkb-be/Controllers/ScheduleController.cs#L34); `ScheduleService.SaveScheduleAsync` | `Timetable` |
| GET | `/api/Schedule/{id:int}` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [GetByTimetableId](../tkb-be/Controllers/ScheduleController.cs#L44); `ScheduleService.GetScheduleAsync` | `Classroom`, `CourseSection`, `Lecturer`, `Timetable` |
| GET | `/api/Schedule/lecturer/{lecturerId:int}` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [GetLecturerSchedule](../tkb-be/Controllers/ScheduleController.cs#L54); `ScheduleService.GetLecturerScheduleAsync` | `Classroom`, `CourseSection`, `Lecturer`, `Timetable` |
| GET | `/api/Schedule` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [GetSchedule](../tkb-be/Controllers/ScheduleController.cs#L78); `ScheduleService.GetScheduleAsync` | `Classroom`, `CourseSection`, `Lecturer`, `Timetable` |
| GET | `/api/Schedule/semester-stats` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [GetSemesterStats](../tkb-be/Controllers/ScheduleController.cs#L97); `ScheduleService.GetSemesterScheduleStatsAsync` | `Timetable` |
| POST | `/api/Schedule/lock-semester` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [LockSemester](../tkb-be/Controllers/ScheduleController.cs#L105); `ScheduleService.LockSemesterScheduleDetailedAsync` | `Timetable` |
| POST | `/api/Schedule/reset-semester` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [ResetSemester](../tkb-be/Controllers/ScheduleController.cs#L126); `ScheduleService.ResetSemesterScheduleAsync`, `ScheduleService.GetSemesterScheduleStatsAsync` | `Timetable` |
| POST | `/api/Schedule/dedupe-semester` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [DedupeSemester](../tkb-be/Controllers/ScheduleController.cs#L138); `ScheduleService.DedupeSemesterTimetableAsync`, `ScheduleService.GetSemesterScheduleStatsAsync` | `Timetable` |
| POST | `/api/Schedule/generate-semester` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [GenerateSemester](../tkb-be/Controllers/ScheduleController.cs#L158); `ScheduleService.GenerateScheduleForSemesterAsync` | `Classroom`, `ClassroomPeriodLock`, `Lecturer`, `SystemConfigs`, `Timetable` |
| POST | `/api/Schedule/generate-semester/start` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [StartSemesterJob](../tkb-be/Controllers/ScheduleController.cs#L168); `SemesterScheduleJobService.StartJob` | Không truy vấn trực tiếp / xem luồng gọi |
| POST | `/api/Schedule/jobs/{jobId:guid}/cancel` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [CancelJob](../tkb-be/Controllers/ScheduleController.cs#L175); `SemesterScheduleJobService.CancelJob` | Không truy vấn trực tiếp / xem luồng gọi |
| GET | `/api/Schedule/jobs` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [ListJobs](../tkb-be/Controllers/ScheduleController.cs#L184); `SemesterScheduleJobService.ListJobs` | Không truy vấn trực tiếp / xem luồng gọi |
| GET | `/api/Schedule/jobs/{jobId:guid}` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [GetJob](../tkb-be/Controllers/ScheduleController.cs#L191); `SemesterScheduleJobService.GetJob` | Không truy vấn trực tiếp / xem luồng gọi |
| GET | `/api/Schedule/pending-room-assignments` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [GetPendingRoomAssignments](../tkb-be/Controllers/ScheduleController.cs#L201); `ScheduleService.GetPendingRoomAssignmentsAsync` | `CourseSection`, `Lecturer`, `Timetable` |
| GET | `/api/Schedule/{timetableId:int}/room-candidates` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [GetRoomCandidates](../tkb-be/Controllers/ScheduleController.cs#L213); `ScheduleService.GetManualRoomCandidatesAsync` | `Classroom`, `ClassroomPeriodLock`, `CourseSection`, `SystemConfigs`, `Timetable` |
| POST | `/api/Schedule/assign-room` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [AssignRoom](../tkb-be/Controllers/ScheduleController.cs#L226); `ScheduleService.AssignRoomManuallyAsync` | `Classroom`, `ClassroomPeriodLock`, `CourseSection`, `Lecturer`, `SystemConfigs`, `Timetable` |
| GET | `/api/Schedule/batch/{batchId:guid}` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [GetByBatch](../tkb-be/Controllers/ScheduleController.cs#L245); `ScheduleService.GetScheduleByBatchAsync` | `Classroom`, `CourseSection`, `Lecturer`, `Timetable` |
| GET | `/api/Schedule/history` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [GetHistory](../tkb-be/Controllers/ScheduleController.cs#L255); `ScheduleService.GetScheduleHistoryAsync` | `Timetable` |
| POST | `/api/Schedule/lock/{batchId:guid}` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [Lock](../tkb-be/Controllers/ScheduleController.cs#L266); `ScheduleService.SetBatchLockAsync` | `Timetable` |
| POST | `/api/Schedule/unlock/{batchId:guid}` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [Unlock](../tkb-be/Controllers/ScheduleController.cs#L276); `ScheduleService.SetBatchLockAsync` | `Timetable` |
| DELETE | `/api/Schedule/batch/{batchId:guid}` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [DeleteBatch](../tkb-be/Controllers/ScheduleController.cs#L286); `ScheduleService.DeleteBatchAsync` | `Timetable` |

### SystemConfigController

| Method | Route | Xác thực/quyền | Loại | Action và service trực tiếp | Bảng lần theo được |
|---|---|---|---|---|---|
| GET | `/api/SystemConfig` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [GetAll](../tkb-be/Controllers/SystemConfigController.cs#L20); `SystemConfigService.GetAllAsync` | `SystemConfigs` |
| PUT | `/api/SystemConfig` | `Public: không có thuộc tính auth` | BE nghiệp vụ | [UpdateBulk](../tkb-be/Controllers/SystemConfigController.cs#L28); `SystemConfigService.UpdateBulkAsync`, `SystemConfigService.GetAllAsync` | `SystemConfigs` |

## SignalR (ngoài số action HTTP ở trên)

| Dự án | Đường dẫn hub | Nguồn |
|---|---|---|
| course AdminAPI | `/api/admin/hubs/registration` | [Program.cs:235](../course-registration/CourseRegistration.AdminAPI/Program.cs#L235) |
| course RegistrationConsumer | `/hubs/registration` | [Program.cs:168](../course-registration/CourseRegistration.RegistrationConsumer/Program.cs#L168) |
