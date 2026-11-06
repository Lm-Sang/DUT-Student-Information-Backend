# Bảng và cột database trong ba dự án

Đọc tĩnh ngày 08/10/2026. Đây là các cột lưu trong model/schema; không phải danh sách cột JSON trả về và không có nghĩa từng endpoint đều dùng mọi cột.

Course Registration: model hiện tại + EF configuration. PLO/CLO: snapshot PostgreSQL + DbContext/model hiện tại, bao gồm bảng join và shadow columns. TKB: model + SmartScheduleContext, loại bỏ property bị Ignore. Database đang triển khai có thể lệch source; chưa kết nối DB để kiểm tra.

Đối chiếu API → bảng ở [API_ENDPOINT_CATALOG.md](API_ENDPOINT_CATALOG.md), các cột dùng theo nghiệp vụ ở [API_DATA_SOURCE_AUDIT.md](API_DATA_SOURCE_AUDIT.md).

## course-registration — PostgreSQL

| Bảng vật lý | Entity | Cột lưu trữ | Nguồn |
|---|---|---|---|
| `AcademicAffairs` | `AcademicAffairs` | `MicrosoftId`, `Name`, `PasswordHash` | [AcademicAffairs.cs:1](../course-registration/CourseRegistration.Data/Entities/AcademicAffairs.cs#L1) |
| `AdminActionLogs` | `AdminActionLog` | `Id`, `AdminId`, `TargetStudentId`, `CourseSectionId`, `Action`, `Message`, `TimeStamp` | [AdminActionLog.cs:1](../course-registration/CourseRegistration.Data/Entities/AdminActionLog.cs#L1) |
| `Admins` | `Admin` | `MicrosoftId`, `Name`, `PhoneNumber`, `PasswordHash` | [Admin.cs:1](../course-registration/CourseRegistration.Data/Entities/Admin.cs#L1) |
| `AlternativeCourses` | `AlternativeCourse` | `Id`, `CourseInProgramId`, `AlternativeCourseId`, `IsDeleted` | [AlternativeCourse.cs:1](../course-registration/CourseRegistration.Data/Entities/AlternativeCourse.cs#L1) |
| `ClassRooms` | `ClassRoom` | `Id`, `RoomCode`, `Capacity`, `Building`, `RoomType`, `HasProjector`, `IsLaboratory`, `Notes`, `IsDisabled` | [ClassRoom.cs:1](../course-registration/CourseRegistration.Data/Entities/ClassRoom.cs#L1) |
| `Classes` | `Class` | `Id`, `Name`, `ProgramId`, `ScheduleGroup`, `EnrollmentYear`, `IsDeleted` | [Class.cs:1](../course-registration/CourseRegistration.Data/Entities/Class.cs#L1) |
| `CourseExemptions` | `CourseExemption` | `Id`, `SemesterCode`, `StudentId`, `CourseId`, `Score10Scale`, `LetterGrade`, `Score4Scale`, `GradeType`, `TransferredDate`, `Notes`, `IsDeleted` | [CourseExemption.cs:1](../course-registration/CourseRegistration.Data/Entities/CourseExemption.cs#L1) |
| `CourseInPrograms` | `CourseInProgram` | `Id`, `CourseId`, `AcademicProgramId`, `Order`, `IsPreProjectRequired`, `IsProjectPrerequisite`, `IsElectiveCourse`, `Semester`, `Notes`, `IsDeleted` | [CourseInProgram.cs:1](../course-registration/CourseRegistration.Data/Entities/CourseInProgram.cs#L1) |
| `CourseRegistrationDemands` | `CourseRegistrationDemand` | `Id`, `StudentId`, `CourseId`, `Schedule`, `SemesterCode`, `SubmittedAt`, `IsConfirmed`, `IsDeleted` | [CourseRegistrationDemand.cs:1](../course-registration/CourseRegistration.Data/Entities/CourseRegistrationDemand.cs#L1) |
| `CourseRegistrationLogs` | `CourseRegistrationLog` | `Id`, `StudentId`, `CourseSectionId`, `Level`, `Action`, `Message`, `AcademicYearCode`, `TimeStamp` | [CourseRegistrationLog.cs:1](../course-registration/CourseRegistration.Data/Entities/CourseRegistrationLog.cs#L1) |
| `CourseRegistrationSettings` | `CourseRegistrationSetting` | `Key`, `Value` | [CourseRegistrationSetting.cs:1](../course-registration/CourseRegistration.Data/Entities/CourseRegistrationSetting.cs#L1) |
| `CourseRequirementTypes` | `CourseRequirementType` | `Id`, `Name`, `Description`, `IsDeleted` | [CourseRequirementType.cs:1](../course-registration/CourseRegistration.Data/Entities/CourseRequirementType.cs#L1) |
| `CourseRequirements` | `CourseRequirement` | `Id`, `ProgramId`, `MainCourseId`, `RequiredCourseId`, `RequirementTypeId`, `IsDeleted` | [CourseRequirement.cs:1](../course-registration/CourseRegistration.Data/Entities/CourseRequirement.cs#L1) |
| `CourseSections` | `CourseSection` | `Id`, `CourseName`, `Capacity`, `RegisteredCount`, `LecturerId`, `ScheduleGroup`, `Schedule`, `StudyWeeks`, `FacultyId`, `CourseSymbol`, `CourseCodeExtracted`, `AcademicYearCode`, `EnrollmentYear`, `SectionCode`, `ReservedCapacity`, `ReservedCount`, `IsHighQuality`, `AllowAnotherProgram`, `IsRegistrationClosed`, `IsRegistrationDisabled`, `IsDropDisabled`, `AllowReserve`, `Notes`, `IsDeleted` | [CourseSection.cs:1](../course-registration/CourseRegistration.Data/Entities/CourseSection.cs#L1) |
| `Courses` | `Course` | `Id`, `CourseName`, `CourseShortName`, `Credits`, `TheoryCredits`, `PracticeCredits`, `ProjectCredits`, `AssignmentCredits`, `InternshipCredits`, `IsOpenToOtherMajors`, `FacultyId`, `IsDeleted` | [Course.cs:1](../course-registration/CourseRegistration.Data/Entities/Course.cs#L1) |
| `Faculties` | `Faculty` | `Id`, `FacultyName`, `FacultyNameEn`, `IsDUT`, `IsDeleted` | [Faculty.cs:1](../course-registration/CourseRegistration.Data/Entities/Faculty.cs#L1) |
| `Lecturers` | `Lecturer` | `Id`, `MicrosoftId`, `FullName`, `FacultyId`, `PasswordHash`, `IsDeleted` | [Lecturer.cs:1](../course-registration/CourseRegistration.Data/Entities/Lecturer.cs#L1) |
| `Majors` | `Major` | `Id`, `MajorName`, `MajorNameEn`, `IsDeleted` | [Major.cs:1](../course-registration/CourseRegistration.Data/Entities/Major.cs#L1) |
| `Programs` | `Program` | `Id`, `AcademicProgramName`, `AcademicProgramNameEn`, `FacultyId`, `MajorId`, `Credits`, `ElectiveCredits`, `Semesters`, `StartDate`, `EndDate`, `EducationLevel`, `IsDeleted` | [Program.cs:1](../course-registration/CourseRegistration.Data/Entities/Program.cs#L1) |
| `RegistrationPhaseTimes` | `RegistrationPhaseTime` | `Id`, `RegistrationPhaseId`, `AllowedFacultyId`, `AllowedCohort`, `StartTime`, `EndTime` | [RegistrationPhaseTime.cs:1](../course-registration/CourseRegistration.Data/Entities/RegistrationPhaseTime.cs#L1) |
| `RegistrationPhases` | `RegistrationPhase` | `Id`, `SemesterCode`, `PhaseName`, `TargetAudience`, `StartTime`, `EndTime`, `Notes`, `IsNoteRed`, `IsDeleted`, `Type`, `AllowedMajorId`, `AllowedGroupId`, `AllowedFacultyId`, `AllowedCohorts`, `AllowBackupRegistration` | [RegistrationPhase.cs:1](../course-registration/CourseRegistration.Data/Entities/RegistrationPhase.cs#L1) |
| `Semesters` | `Semester` | `Id`, `Name`, `Year`, `IsDeleted` | [Semester.cs:1](../course-registration/CourseRegistration.Data/Entities/Semester.cs#L1) |
| `StudentCreditLimits` | `StudentCreditLimit` | `Id`, `StudentId`, `AcademicYearCode`, `IsCreditLoadRestricted`, `MaxCredits`, `Note`, `IsDeleted` | [StudentCreditLimit.cs:1](../course-registration/CourseRegistration.Data/Entities/StudentCreditLimit.cs#L1) |
| `StudentGrades` | `StudentGrade` | `Id`, `SemesterCode`, `StudentId`, `CourseId`, `CourseSectionCode`, `Score10Scale`, `LetterGrade`, `Score4Scale`, `Retake`, `IsDeleted` | [StudentGrade.cs:1](../course-registration/CourseRegistration.Data/Entities/StudentGrade.cs#L1) |
| `StudentInCourseSections` | `StudentInCourseSection` | `StudentId`, `CourseSectionId`, `AcademicYearCode`, `RegisteredAt`, `IsReserved`, `IsConfirmed`, `Notes`, `IsDeleted` | [StudentInCourseSection.cs:1](../course-registration/CourseRegistration.Data/Entities/StudentInCourseSection.cs#L1) |
| `Students` | `Student` | `Id`, `StudentCardNumber`, `ClassId`, `FullName`, `ProgramId`, `Gender`, `EnrollmentDate`, `AcademicProgramId`, `MaxCreditsAllowed`, `IsHighQuality`, `IsWebsiteLocked`, `IsSuspended`, `IsOverdue`, `IsProfileComplete`, `IsDeleted` | [Student.cs:1](../course-registration/CourseRegistration.Data/Entities/Student.cs#L1) |
| `Users` | `User` | `UserId`, `MicrosoftId`, `PasswordHash`, `IsDeleted` | [User.cs:1](../course-registration/CourseRegistration.Data/Entities/User.cs#L1) |
| `Viewers` | `Viewer` | `Id`, `FullName`, `PasswordHash`, `MicrosoftId`, `IsDeleted` | [Viewer.cs:1](../course-registration/CourseRegistration.Data/Entities/Viewer.cs#L1) |

## plo-clo-backend — database ứng dụng

| Bảng vật lý | Entity | Cột lưu trữ | Nguồn |
|---|---|---|---|
| `Accounts` | `Account` | `Id`, `FacultyId`, `IsActive`, `MicrosoftEmail`, `Name`, `Password`, `RoleId`, `Username` | [ApplicationDBContextModelSnapshot.cs:77](../plo-clo-backend/src/srms.Migrations.PostgreSql/Migrations/ApplicationDBContextModelSnapshot.cs#L77) |
| `AppealedResults` | `AppealedResult` | `Id`, `NewScore`, `OldScore`, `QuestionId`, `ScoreAppealId` | [ApplicationDBContextModelSnapshot.cs:133](../plo-clo-backend/src/srms.Migrations.PostgreSql/Migrations/ApplicationDBContextModelSnapshot.cs#L133) |
| `CLOPLO` | `CLOPLO` | `CLOsId`, `PLOsId` | [ApplicationDBContextModelSnapshot.cs:27](../plo-clo-backend/src/srms.Migrations.PostgreSql/Migrations/ApplicationDBContextModelSnapshot.cs#L27) |
| `CLOQuestion` | `CLOQuestion` | `CLOsId`, `QuestionsId`, `QuestionId` | [ApplicationDBContextModelSnapshot.cs:42](../plo-clo-backend/src/srms.Migrations.PostgreSql/Migrations/ApplicationDBContextModelSnapshot.cs#L42) |
| `CLOs` | `CLO` | `Id`, `CourseId`, `Description`, `Name`, `SemesterId` | [ApplicationDBContextModelSnapshot.cs:165](../plo-clo-backend/src/srms.Migrations.PostgreSql/Migrations/ApplicationDBContextModelSnapshot.cs#L165) |
| `ChildExamSessions` | `ChildExamSession` | `Id`, `AnonymizedBagNumber`, `Code`, `ConfirmedAt`, `CorrectedResultsConfirmedAt`, `IsAnonymousMarking`, `Name`, `ParentExamSessionId`, `ScoreEntryUserAccountId` | [ApplicationDBContextModelSnapshot.cs:200](../plo-clo-backend/src/srms.Migrations.PostgreSql/Migrations/ApplicationDBContextModelSnapshot.cs#L200) |
| `ClassStudent` | `ClassStudent` | `ClassesId`, `StudentsId` | [ApplicationDBContextModelSnapshot.cs:62](../plo-clo-backend/src/srms.Migrations.PostgreSql/Migrations/ApplicationDBContextModelSnapshot.cs#L62) |
| `Classes` | `Class` | `Id`, `Code`, `CourseId`, `IsCore`, `IsDoctoral`, `Name`, `ParentExamSessionId`, `SemesterId`, `Teacher2Id`, `TeacherId` | [ApplicationDBContextModelSnapshot.cs:245](../plo-clo-backend/src/srms.Migrations.PostgreSql/Migrations/ApplicationDBContextModelSnapshot.cs#L245) |
| `Cohorts` | `Cohort` | `Id`, `Code`, `Name`, `ProgrammeId`, `TeacherId` | [ApplicationDBContextModelSnapshot.cs:299](../plo-clo-backend/src/srms.Migrations.PostgreSql/Migrations/ApplicationDBContextModelSnapshot.cs#L299) |
| `CorrectedResults` | `CorrectedResult` | `Id`, `ApproveAt`, `ApproveByUserId`, `ApproveByUserName`, `ApproveByUserRole`, `NewScore`, `OldScore`, `OpenAt`, `QuestionId`, `StudentId` | [ApplicationDBContextModelSnapshot.cs:332](../plo-clo-backend/src/srms.Migrations.PostgreSql/Migrations/ApplicationDBContextModelSnapshot.cs#L332) |
| `CoursePLO` | `CoursePLO` | `CourseId`, `PLOId`, `Weight` | [ApplicationDBContextModelSnapshot.cs:423](../plo-clo-backend/src/srms.Migrations.PostgreSql/Migrations/ApplicationDBContextModelSnapshot.cs#L423) |
| `Courses` | `Course` | `Id`, `Code`, `Credits`, `DependentCourseId`, `FacultyId`, `IsConfirmed`, `IsDoctoral`, `Name` | [ApplicationDBContextModelSnapshot.cs:380](../plo-clo-backend/src/srms.Migrations.PostgreSql/Migrations/ApplicationDBContextModelSnapshot.cs#L380) |
| `Curriculums` | `Curriculum` | `CourseId`, `ProgrammeId`, `AcademicSemester`, `IsCore` | [ApplicationDBContextModelSnapshot.cs:442](../plo-clo-backend/src/srms.Migrations.PostgreSql/Migrations/ApplicationDBContextModelSnapshot.cs#L442) |
| `Exams` | `Exam` | `Id`, `CanStudentsViewUnconfirmedResults`, `Category`, `ClassId`, `ConfirmedAt`, `CorrectedResultsConfirmedAt`, `ExtendedScoreCorrectionDeadline`, `ExtendedScoreEntryDeadline`, `IsQuestionLocked`, `IsScoreLocked`, `ParentExamSessionId`, `ScoreCorrectionDeadline`, `ScoreEntryDeadline`, `ScoreEntryStartDate`, `Type`, `Weight` | [ApplicationDBContextModelSnapshot.cs:463](../plo-clo-backend/src/srms.Migrations.PostgreSql/Migrations/ApplicationDBContextModelSnapshot.cs#L463) |
| `Faculties` | `Faculty` | `Id`, `Code`, `Name` | [ApplicationDBContextModelSnapshot.cs:532](../plo-clo-backend/src/srms.Migrations.PostgreSql/Migrations/ApplicationDBContextModelSnapshot.cs#L532) |
| `Majors` | `Major` | `Id`, `Code`, `FacultyId`, `Name`, `OfficialCode` | [ApplicationDBContextModelSnapshot.cs:555](../plo-clo-backend/src/srms.Migrations.PostgreSql/Migrations/ApplicationDBContextModelSnapshot.cs#L555) |
| `PLOs` | `PLO` | `Id`, `Description`, `Name`, `ProgrammeId` | [ApplicationDBContextModelSnapshot.cs:588](../plo-clo-backend/src/srms.Migrations.PostgreSql/Migrations/ApplicationDBContextModelSnapshot.cs#L588) |
| `ParentExamSessions` | `ParentExamSession` | `Id`, `Code`, `CourseId`, `Name`, `QuestionSetterAccountId`, `SemesterId` | [ApplicationDBContextModelSnapshot.cs:616](../plo-clo-backend/src/srms.Migrations.PostgreSql/Migrations/ApplicationDBContextModelSnapshot.cs#L616) |
| `Permissions` | `Permission` | `Key`, `Group`, `Label` | [ApplicationDBContextModelSnapshot.cs:654](../plo-clo-backend/src/srms.Migrations.PostgreSql/Migrations/ApplicationDBContextModelSnapshot.cs#L654) |
| `Programmes` | `Programme` | `Id`, `AccountId`, `Code`, `IsConfirmed`, `MajorId`, `Name` | [ApplicationDBContextModelSnapshot.cs:1175](../plo-clo-backend/src/srms.Migrations.PostgreSql/Migrations/ApplicationDBContextModelSnapshot.cs#L1175) |
| `Questions` | `Question` | `Id`, `ExamId`, `Name`, `Scale`, `Weight` | [ApplicationDBContextModelSnapshot.cs:1211](../plo-clo-backend/src/srms.Migrations.PostgreSql/Migrations/ApplicationDBContextModelSnapshot.cs#L1211) |
| `RefreshTokens` | `RefreshToken` | `Id`, `AccountId`, `CreatedAt`, `ExpiresAt`, `ReplacedByTokenHash`, `RevokedAt`, `SlotIndex`, `TokenHash` | [ApplicationDBContextModelSnapshot.cs:1242](../plo-clo-backend/src/srms.Migrations.PostgreSql/Migrations/ApplicationDBContextModelSnapshot.cs#L1242) |
| `Results` | `Result` | `Id`, `QuestionId`, `Score`, `StudentId` | [ApplicationDBContextModelSnapshot.cs:1283](../plo-clo-backend/src/srms.Migrations.PostgreSql/Migrations/ApplicationDBContextModelSnapshot.cs#L1283) |
| `RolePermissions` | `RolePermission` | `RoleId`, `Permission` | [ApplicationDBContextModelSnapshot.cs:1398](../plo-clo-backend/src/srms.Migrations.PostgreSql/Migrations/ApplicationDBContextModelSnapshot.cs#L1398) |
| `Roles` | `Role` | `Id`, `DisplayName`, `IsSystem`, `Name` | [ApplicationDBContextModelSnapshot.cs:1311](../plo-clo-backend/src/srms.Migrations.PostgreSql/Migrations/ApplicationDBContextModelSnapshot.cs#L1311) |
| `ScoreAppeals` | `ScoreAppeal` | `Id`, `AssignedAt`, `AssignedMarkerTeacherId`, `DecidedAt`, `DecidedByAccountId`, `DecidedByUserName`, `DecidedByUserRole`, `DecisionNote`, `ExamId`, `Fee`, `Reason`, `ReceiptNumber`, `RequestedAt`, `Status`, `StudentId` | [ApplicationDBContextModelSnapshot.cs:2076](../plo-clo-backend/src/srms.Migrations.PostgreSql/Migrations/ApplicationDBContextModelSnapshot.cs#L2076) |
| `Semesters` | `Semester` | `Id`, `IsActive`, `Name`, `Year` | [ApplicationDBContextModelSnapshot.cs:2146](../plo-clo-backend/src/srms.Migrations.PostgreSql/Migrations/ApplicationDBContextModelSnapshot.cs#L2146) |
| `Settings` | `Setting` | `Id`, `CLOScoreThreshold`, `CurrentSemesterId`, `CurrentYear`, `PLOScoreThreshold` | [ApplicationDBContextModelSnapshot.cs:2172](../plo-clo-backend/src/srms.Migrations.PostgreSql/Migrations/ApplicationDBContextModelSnapshot.cs#L2172) |
| `SignedScoreSheets` | `SignedScoreSheet` | `Id`, `CaDocumentId`, `ClassId`, `CreatedAt`, `CreatedByAccountId`, `ExaminerAccountId`, `ExaminerSignedAt`, `FacultyHeadAccountId`, `FacultyHeadSignedAt` | [ApplicationDBContextModelSnapshot.cs:2207](../plo-clo-backend/src/srms.Migrations.PostgreSql/Migrations/ApplicationDBContextModelSnapshot.cs#L2207) |
| `StudentChildExamSessions` | `StudentChildExamSession` | `StudentId`, `ChildExamSessionId`, `AnonymousMarkingCode` | [ApplicationDBContextModelSnapshot.cs:2310](../plo-clo-backend/src/srms.Migrations.PostgreSql/Migrations/ApplicationDBContextModelSnapshot.cs#L2310) |
| `StudentCourse` | `StudentCourse` | `StudentId`, `SubstituteCourseId`, `CoursesId`, `OriginalCourseId` | [ApplicationDBContextModelSnapshot.cs:2329](../plo-clo-backend/src/srms.Migrations.PostgreSql/Migrations/ApplicationDBContextModelSnapshot.cs#L2329) |
| `StudentExam` | `StudentExam` | `StudentId`, `ExamId`, `Note`, `Score` | [ApplicationDBContextModelSnapshot.cs:2354](../plo-clo-backend/src/srms.Migrations.PostgreSql/Migrations/ApplicationDBContextModelSnapshot.cs#L2354) |
| `StudentPLOs` | `StudentPLO` | `Id`, `CalculatedAt`, `IsActive`, `PLOId`, `Score`, `StudentId` | [ApplicationDBContextModelSnapshot.cs:2378](../plo-clo-backend/src/srms.Migrations.PostgreSql/Migrations/ApplicationDBContextModelSnapshot.cs#L2378) |
| `StudentProgrammeCompletions` | `StudentProgrammeCompletion` | `Id`, `CalculatedAt`, `FailureReasons`, `IsActive`, `IsCompleted`, `PloScoreThreshold`, `ProgrammeId`, `StudentId` | [ApplicationDBContextModelSnapshot.cs:2413](../plo-clo-backend/src/srms.Migrations.PostgreSql/Migrations/ApplicationDBContextModelSnapshot.cs#L2413) |
| `Students` | `Student` | `Id`, `AccountId`, `Code`, `CohortId`, `DecisionDate`, `DecisionNumber`, `DecisionReason`, `EnrollmentYear`, `IsDoctoral`, `Name`, `ProgrammeId`, `Status` | [ApplicationDBContextModelSnapshot.cs:2249](../plo-clo-backend/src/srms.Migrations.PostgreSql/Migrations/ApplicationDBContextModelSnapshot.cs#L2249) |
| `Teachers` | `Teacher` | `Id`, `AccountId`, `Code`, `Name`, `WorkUnitId` | [ApplicationDBContextModelSnapshot.cs:2453](../plo-clo-backend/src/srms.Migrations.PostgreSql/Migrations/ApplicationDBContextModelSnapshot.cs#L2453) |
| `UserActivityLogs` | `UserActivityLog` | `Id`, `Action`, `EntityAfter`, `EntityBefore`, `IpAddress`, `Timestamp`, `UserId`, `UserName`, `UserRole` | [ApplicationDBContextModelSnapshot.cs:2487](../plo-clo-backend/src/srms.Migrations.PostgreSql/Migrations/ApplicationDBContextModelSnapshot.cs#L2487) |
| `WorkUnits` | `WorkUnit` | `Id`, `Code`, `Name` | [ApplicationDBContextModelSnapshot.cs:2528](../plo-clo-backend/src/srms.Migrations.PostgreSql/Migrations/ApplicationDBContextModelSnapshot.cs#L2528) |

## tkb-be — SQL Server

| Bảng vật lý | Entity | Cột lưu trữ | Nguồn |
|---|---|---|---|
| `Account` | `Account` | `AccountID`, `Username`, `MicrosoftEmail`, `Password`, `IsActive` | [Account.cs:1](../tkb-be/Models/Account.cs#L1) |
| `Account_Role` | `AccountRole` | `AccountID`, `RoleID` | [AccountRole.cs:1](../tkb-be/Models/AccountRole.cs#L1) |
| `Classroom` | `Classroom` | `ClassroomID`, `Capacity`, `RoomType`, `IsSpecialized`, `IsAvailable`, `Building` | [Classroom.cs:1](../tkb-be/Models/Classroom.cs#L1) |
| `ClassroomPeriodLock` | `ClassroomPeriodLock` | `ClassroomID`, `Period` | [ClassroomPeriodLock.cs:1](../tkb-be/Models/ClassroomPeriodLock.cs#L1) |
| `CourseSection` | `CourseSection` | `CourseID`, `LecturerID`, `FacultyID`, `CourseCode`, `CourseName`, `Credits`, `NumberStudents`, `IsSpecial`, `IsLanguage`, `IsPFIEV` | [CourseSection.cs:1](../tkb-be/Models/CourseSection.cs#L1) |
| `Faculty` | `Faculty` | `FacultyID`, `FacultyName` | [Faculty.cs:1](../tkb-be/Models/Faculty.cs#L1) |
| `Lecturer` | `Lecturer` | `LecturerID`, `AccountID`, `FacultyID`, `LecturerName`, `MicrosoftEmail`, `Position`, `HasMeeting` | [Lecturer.cs:1](../tkb-be/Models/Lecturer.cs#L1) |
| `Role` | `Role` | `RoleID`, `RoleName`, `Description` | [Role.cs:1](../tkb-be/Models/Role.cs#L1) |
| `SystemConfigs` | `SystemConfig` | `ConfigKey`, `ConfigValue` | [SystemConfig.cs:1](../tkb-be/Models/SystemConfig.cs#L1) |
| `Timetable` | `Timetable` | `TimetableID`, `ScheduleBatchId`, `CourseID`, `LecturerID`, `ClassroomID`, `CourseName`, `AcademicYear`, `Semester`, `Week`, `DayOfWeek`, `Session`, `StartLesson`, `TotalWeek`, `IsLocked`, `SolverStatus`, `ObjectiveValue`, `CreatedAt`, `UpdatedAt` | [Timetable.cs:1](../tkb-be/Models/Timetable.cs#L1) |

## PLO/CLO — SQL Server nguồn của trường

SourceDbContext ánh xạ 13 bảng. Danh sách dưới đối chiếu các projection/WHERE/JOIN trong DataTransferService và phần lập kế hoạch hạn nhập điểm; cột vật lý được giải từ HasColumnName. Không liệt kê các cột chỉ tồn tại trong model nhưng chưa được các luồng này sử dụng.

| Bảng nguồn | Cột tham chiếu trong service nhập dữ liệu | Property C# → cột SQL khác tên | Nguồn model |
|---|---|---|---|
| `tmConfig` | `VarName`, `VarString3`, `VarType` | — | [TmConfig.cs](../plo-clo-backend/Models/SourceDatabase/TmConfig.cs) |
| `tmDiemkyhoc` | `MaHS`, `MalopHP`, `MaCaThi`, `SoPhach` | `MaHs → MaHS`, `MalopHp → MalopHP` | [TmDiemkyhoc.cs](../plo-clo-backend/Models/SourceDatabase/TmDiemkyhoc.cs) |
| `tmHoSoSV` | `MaHS`, `MaLop`, `Hoten`, `MaNganh` | `MaHs → MaHS` | [TmHoSoSv.cs](../plo-clo-backend/Models/SourceDatabase/TmHoSoSv.cs) |
| `tmHocPhan` | `MaHP`, `TenHP`, `SoTC` | `MaHp → MaHP`, `TenHp → TenHP`, `SoTc → SoTC` | [TmHocPhan.cs](../plo-clo-backend/Models/SourceDatabase/TmHocPhan.cs) |
| `tmHocPhan_PT` | `MaHP`, `MaHPPT` | `MaHp → MaHP`, `MaHppt → MaHPPT` | [TmHocPhanPt.cs](../plo-clo-backend/Models/SourceDatabase/TmHocPhanPt.cs) |
| `tmHosoGV` | `MaHS`, `Hoten`, `Email`, `KhoaPC` | `MaHs → MaHS`, `KhoaPc → KhoaPC` | [TmHosoGv.cs](../plo-clo-backend/Models/SourceDatabase/TmHosoGv.cs) |
| `tmKehoach` | `IDCode` | `Idcode → IDCode` | [TmKehoach.cs](../plo-clo-backend/Models/SourceDatabase/TmKehoach.cs) |
| `tmKhungCT` | `MaKhung`, `MaHP`, `Hocky` | `MaHp → MaHP` | [TmKhungCt.cs](../plo-clo-backend/Models/SourceDatabase/TmKhungCt.cs) |
| `tmLop` | `MaLop`, `TenLop`, `MaKhung` | — | [TmLop.cs](../plo-clo-backend/Models/SourceDatabase/TmLop.cs) |
| `tmLopHP` | `MalopHP`, `TenLopHP`, `MaGV`, `CongThucDiem`, `LopCotLoi`, `GK_HanNhap`, `GK_HanDChinh`, `GK_GiaHanN`, `QT_HanNhap`, `QT_HanDChinh`, `QT_GiaHanN`, `CK_HanNhap`, `CK_HanDChinh`, `CK_GiaHanN` | `MalopHp → MalopHP`, `TenLopHp → TenLopHP`, `MaGv → MaGV`, `GkHanNhap → GK_HanNhap`, `GkHanDchinh → GK_HanDChinh`, `GkGiaHanN → GK_GiaHanN`, `QtHanNhap → QT_HanNhap`, `QtHanDchinh → QT_HanDChinh`, `QtGiaHanN → QT_GiaHanN`, `CkHanNhap → CK_HanNhap`, `CkHanDchinh → CK_HanDChinh`, `CkGiaHanN → CK_GiaHanN` | [TmLopHp.cs](../plo-clo-backend/Models/SourceDatabase/TmLopHp.cs) |
| `tmNganh` | `MaNganh`, `TenNganh`, `Kyhieu` | — | [TmNganh.cs](../plo-clo-backend/Models/SourceDatabase/TmNganh.cs) |
| `tmThiCaCT` | `MaCa`, `TenCa`, `CaTong`, `Phach`, `Tui`, `NguoiNhap1` | — | [TmThiCaCt.cs](../plo-clo-backend/Models/SourceDatabase/TmThiCaCt.cs) |
| `tmThiCaHP` | `MaCaTong`, `LopHP` | `LopHp → LopHP` | [TmThiCaHp.cs](../plo-clo-backend/Models/SourceDatabase/TmThiCaHp.cs) |

SourceDbContext vẫn dùng SQL Server ngay cả khi database ứng dụng PLO/CLO dùng PostgreSQL.

## Course Registration — SQL Server nguồn của trường

DataResource truy vấn trực tiếp database `[DATA_SV2202605111528].[dbo]` qua cấu hình `DUT_CDS_DB`. Đây là SQL, không phải REST API hoặc SSO.

| Hàm | Bảng | Cột SELECT / WHERE | Ánh xạ đầu ra |
|---|---|---|---|
| GetStudentByIdAsync | tmDiemkyhoc | IDCode, MaHS, MaHP, MalopHP, Diem, DiemC, Diem4; WHERE MaHS | SemesterCode, StudentId, CourseId, CourseSectionCode, Score10Scale, LetterGrade, Score4Scale; Retake được gán hằng 0 |
| GetProgramCoursesAsync | tmKhungCT | MaHP, MaKhung, STT, HTDA, TQDA, Tuchon, Hocky, Kyhoc; WHERE MaKhung | CourseId, ProgramId, Order, IsPreProjectRequired, IsProjectPrerequisite, IsElectiveCourse, Semester |
| GetProgramRequirementsAsync | tmHocphanDK | MaKhung, MaHP, MaHPdk, LoaiDK; WHERE MaKhung | ProgramId, MainCourseId, RequiredCourseId, RequirementTypeId = LoaiDK + 1 |

Hai hàm chương trình được gọi bởi POST /api/admin/programs/{id}/sync-courses. GetStudentByIdAsync có implementation nhưng chưa thấy call site trong ba dự án. [DataResource.cs:22](../course-registration/CourseRegistration.Application/DataResource/DataResource.cs#L22)

## Bảng chỉ được nhắc trong file xuất SQL

`tmDiemSRMS`: `IDCode`, `MaHS`, `MaHP`, `MalopHP`, `Diem`, `DiemC`, `Diem4`, và `CUS` + một trong `BT, CC, DA, GK, BV, DG, CK, LT, TH, TT, KT, HD, B1, B2, B3, G1, G2, T1, T2, T3, T4, TN, VI, VD, DO, QT, BC, H1, H2`.

ScoreSqlExportService tạo nội dung INSERT để tải file .sql; code không trực tiếp thực thi INSERT này vào SQL Server. [ScoreSqlExportService.cs:207](../plo-clo-backend/Services/ScoreSqlExportService.cs#L207)
