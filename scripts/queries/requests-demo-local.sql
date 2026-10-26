SET NOCOUNT ON;
SET XACT_ABORT ON;
IF DB_NAME() <> N'sv_dut' THROW 51000, 'Local sv_dut required', 1;
BEGIN TRY
BEGIN TRANSACTION;
IF SCHEMA_ID('svc_demo') IS NULL EXEC('CREATE SCHEMA svc_demo');
IF OBJECT_ID('svc_demo.Actor') IS NULL
CREATE TABLE svc_demo.Actor (
 Id nvarchar(40) NOT NULL PRIMARY KEY, DisplayName nvarchar(150) NOT NULL,
 Role varchar(20) NOT NULL CHECK(Role IN ('STUDENT','STAFF')),
 Department varchar(20) NULL, StudentNumber nvarchar(30) NULL, IsActive bit NOT NULL DEFAULT 1,
 CONSTRAINT CK_DemoActorScope CHECK((Role='STAFF' AND Department IS NOT NULL) OR (Role='STUDENT' AND StudentNumber IS NOT NULL))
);
IF OBJECT_ID('svc_demo.AcademicTerm') IS NULL
CREATE TABLE svc_demo.AcademicTerm (
 Code nvarchar(12) NOT NULL PRIMARY KEY, Name nvarchar(150) NOT NULL,
 SortOrder int NOT NULL, IsSelectable bit NOT NULL DEFAULT 0, ObservedAt datetime2(3) NOT NULL DEFAULT SYSUTCDATETIME()
);
IF OBJECT_ID('svc_demo.ProgramFamily') IS NULL
CREATE TABLE svc_demo.ProgramFamily (
 Code nvarchar(60) NOT NULL PRIMARY KEY, Name nvarchar(500) NOT NULL,
 IsActive bit NOT NULL DEFAULT 0, ObservedAt datetime2(3) NOT NULL DEFAULT SYSUTCDATETIME()
);
IF OBJECT_ID('svc_demo.Setting') IS NULL
CREATE TABLE svc_demo.Setting (
 SettingKey varchar(60) NOT NULL PRIMARY KEY, SettingValue nvarchar(1000) NOT NULL,
 ObservedAt datetime2(3) NOT NULL DEFAULT SYSUTCDATETIME()
);
IF OBJECT_ID('svc_demo.Request') IS NULL
CREATE TABLE svc_demo.Request (
 Id uniqueidentifier NOT NULL PRIMARY KEY, Number bigint IDENTITY NOT NULL UNIQUE,
 StudentId nvarchar(40) NOT NULL REFERENCES svc_demo.Actor(Id),
 TypeCode varchar(20) NOT NULL,
 Department varchar(20) NOT NULL,
 Status varchar(30) NOT NULL CHECK(Status IN ('SUBMITTED','RECEIVED','PROCESSING','NEEDS_INFO','EXTERNAL_PROCESSING','READY','COMPLETED','CANCELLED')),
 PayloadJson nvarchar(max) NOT NULL CHECK(ISJSON(PayloadJson)=1),
 RequiredFieldsJson nvarchar(max) NOT NULL DEFAULT N'[]' CHECK(ISJSON(RequiredFieldsJson)=1),
 SubmittedTerm nvarchar(12) NOT NULL REFERENCES svc_demo.AcademicTerm(Code),
 AssignedStaffId nvarchar(40) NULL REFERENCES svc_demo.Actor(Id),
 CreatedAt datetime2(3) NOT NULL DEFAULT SYSUTCDATETIME(), UpdatedAt datetime2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
 ReceivedAt datetime2(3) NULL, CompletedAt datetime2(3) NULL,
 LastFeedback nvarchar(2000) NULL, ResultSummary nvarchar(2000) NULL,
 CancelledByRole varchar(20) NULL CHECK(CancelledByRole IN ('STUDENT','STAFF')),
 CancelledBy nvarchar(40) NULL REFERENCES svc_demo.Actor(Id), CancelReason nvarchar(2000) NULL, CancelledAt datetime2(3) NULL,
 Version int NOT NULL DEFAULT 1 CHECK(Version>0),
 CONSTRAINT CK_DemoCancellation CHECK(Status<>'CANCELLED' OR (CancelledByRole IS NOT NULL AND CancelledBy IS NOT NULL AND LEN(CancelReason)>0 AND CancelledAt IS NOT NULL))
);
-- Additive, repeatable upgrade of the existing local prototype; keep all requests.
DECLARE @constraint sysname, @ddl nvarchar(max);
SELECT @constraint=name FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID('svc_demo.Request') AND definition LIKE '%TypeCode%';
IF @constraint IS NOT NULL BEGIN SET @ddl=N'ALTER TABLE svc_demo.Request DROP CONSTRAINT '+QUOTENAME(@constraint); EXEC(@ddl); END;
ALTER TABLE svc_demo.Request ADD CONSTRAINT CK_DemoRequestType CHECK(TypeCode IN ('DonSV01','DonSV03','DonSV04','DonSV05','DonSV07','DonSV06','CONFIRMATION','LMS_SUPPORT'));
SET @constraint=NULL;
SELECT @constraint=name FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID('svc_demo.Request') AND definition LIKE '%Department%';
IF @constraint IS NOT NULL BEGIN SET @ddl=N'ALTER TABLE svc_demo.Request DROP CONSTRAINT '+QUOTENAME(@constraint); EXEC(@ddl); END;
ALTER TABLE svc_demo.Request ADD CONSTRAINT CK_DemoRequestDepartment CHECK(Department IN ('DT','CTSV','IT'));
IF COL_LENGTH('svc_demo.Request','CatalogSnapshotJson') IS NULL
 ALTER TABLE svc_demo.Request ADD CatalogSnapshotJson nvarchar(max) NULL CHECK(ISJSON(CatalogSnapshotJson)=1);
IF COL_LENGTH('svc_demo.Request','PrintedAt') IS NULL ALTER TABLE svc_demo.Request ADD PrintedAt datetime2(3) NULL;
IF COL_LENGTH('svc_demo.Request','PickupAt') IS NULL ALTER TABLE svc_demo.Request ADD PickupAt datetime2(3) NULL;
IF COL_LENGTH('svc_demo.Request','PickupLocation') IS NULL ALTER TABLE svc_demo.Request ADD PickupLocation nvarchar(500) NULL;
IF COL_LENGTH('svc_demo.Request','DeliveredAt') IS NULL ALTER TABLE svc_demo.Request ADD DeliveredAt datetime2(3) NULL;
IF COL_LENGTH('svc_demo.Request','ProcessedAt') IS NULL ALTER TABLE svc_demo.Request ADD ProcessedAt datetime2(3) NULL;

IF OBJECT_ID('svc_demo.DocumentType') IS NULL
CREATE TABLE svc_demo.DocumentType (
 TermCode nvarchar(12) NOT NULL REFERENCES svc_demo.AcademicTerm(Code), Code nvarchar(2) NOT NULL,
 SourceId int NULL, Name nvarchar(500) NOT NULL, Department varchar(20) NOT NULL CHECK(Department IN ('DT','CTSV')),
 Guidance nvarchar(2000) NOT NULL, NormalFee decimal(18,2) NULL, RushFee decimal(18,2) NULL,
 FreeAllowed bit NOT NULL, DailyFreeQuota int NULL, RegistrationRequired bit NOT NULL,
 IsActive bit NOT NULL DEFAULT 1, ObservedAt datetime2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
 CONSTRAINT PK_DemoDocumentType PRIMARY KEY(TermCode,Code)
);
IF OBJECT_ID('svc_demo.SupportType') IS NULL
CREATE TABLE svc_demo.SupportType (
 Code nvarchar(10) PRIMARY KEY, Name nvarchar(255) NOT NULL, IsActive bit NOT NULL,
 ObservedAt datetime2(3) NOT NULL DEFAULT SYSUTCDATETIME()
);
IF OBJECT_ID('svc_demo.DocumentRequest') IS NULL
CREATE TABLE svc_demo.DocumentRequest (
 RequestId uniqueidentifier PRIMARY KEY REFERENCES svc_demo.Request(Id), CatalogTerm nvarchar(12) NOT NULL,
 DocumentCode nvarchar(2) NOT NULL, Quantity int NOT NULL CHECK(Quantity BETWEEN 1 AND 20),
 FeeMode varchar(10) NOT NULL CHECK(FeeMode IN ('FREE','PAID')), ServiceSpeed varchar(10) NOT NULL CHECK(ServiceSpeed IN ('NORMAL','RUSH')),
 AdditionalInfo nvarchar(2000) NOT NULL, PeriodTerm nvarchar(12) NULL, AcademicYear nvarchar(9) NULL,
 UnitFee decimal(18,2) NOT NULL CHECK(UnitFee>=0), TotalFee AS CONVERT(decimal(18,2),Quantity*UnitFee),
 CONSTRAINT FK_DemoDocumentCatalog FOREIGN KEY(CatalogTerm,DocumentCode) REFERENCES svc_demo.DocumentType(TermCode,Code)
);
IF OBJECT_ID('svc_demo.AccountSupportRequest') IS NULL
CREATE TABLE svc_demo.AccountSupportRequest (
 RequestId uniqueidentifier PRIMARY KEY REFERENCES svc_demo.Request(Id), SupportCode nvarchar(10) NOT NULL REFERENCES svc_demo.SupportType(Code),
 IssueCode varchar(30) NOT NULL CHECK(IssueCode IN ('RESET_PASSWORD','LOGIN_ERROR')),
 Description nvarchar(2000) NOT NULL, ContactEmail nvarchar(254) NULL, OwnershipConfirmed bit NOT NULL CHECK(OwnershipConfirmed=1)
);
IF OBJECT_ID('svc_demo.RequestRevision') IS NULL
CREATE TABLE svc_demo.RequestRevision (
 Id bigint IDENTITY PRIMARY KEY, RequestId uniqueidentifier NOT NULL REFERENCES svc_demo.Request(Id),
 RevisionNo int NOT NULL, PayloadJson nvarchar(max) NOT NULL CHECK(ISJSON(PayloadJson)=1),
 CreatedBy nvarchar(40) NOT NULL REFERENCES svc_demo.Actor(Id), CreatedAt datetime2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
 CONSTRAINT UQ_DemoRevision UNIQUE(RequestId,RevisionNo)
);
IF OBJECT_ID('svc_demo.RequestEvent') IS NULL
CREATE TABLE svc_demo.RequestEvent (
 Id bigint IDENTITY PRIMARY KEY, RequestId uniqueidentifier NOT NULL REFERENCES svc_demo.Request(Id),
 ActorId nvarchar(40) NOT NULL REFERENCES svc_demo.Actor(Id), ActorRole varchar(20) NOT NULL,
 EventType varchar(40) NOT NULL, FromStatus varchar(30) NULL, ToStatus varchar(30) NOT NULL,
 Message nvarchar(2000) NOT NULL, DetailsJson nvarchar(max) NULL CHECK(ISJSON(DetailsJson)=1),
 CreatedAt datetime2(3) NOT NULL DEFAULT SYSUTCDATETIME()
);
IF OBJECT_ID('svc_demo.CommandReceipt') IS NULL
CREATE TABLE svc_demo.CommandReceipt (
 Id bigint IDENTITY PRIMARY KEY, ActorId nvarchar(40) NOT NULL REFERENCES svc_demo.Actor(Id),
 CommandKey nvarchar(100) NOT NULL, PayloadHash varchar(64) NOT NULL,
 RequestId uniqueidentifier NOT NULL REFERENCES svc_demo.Request(Id), CreatedAt datetime2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
 CONSTRAINT UQ_DemoReceipt UNIQUE(ActorId,CommandKey)
);
IF OBJECT_ID('svc_demo.StudentProfile') IS NULL
CREATE TABLE svc_demo.StudentProfile (
 ActorId nvarchar(40) PRIMARY KEY REFERENCES svc_demo.Actor(Id),
 ProfileJson nvarchar(max) NOT NULL CHECK(ISJSON(ProfileJson)=1),
 UpdatedAt datetime2(3) NOT NULL DEFAULT SYSUTCDATETIME()
);
IF OBJECT_ID('svc_demo.RequestFile') IS NULL
CREATE TABLE svc_demo.RequestFile (
 RequestId uniqueidentifier PRIMARY KEY REFERENCES svc_demo.Request(Id),
 FileName nvarchar(200) NOT NULL, MimeType varchar(50) NOT NULL DEFAULT 'application/pdf',
 PdfBytes varbinary(max) NOT NULL, Sha256 varchar(64) NOT NULL,
 TemplateCode varchar(20) NOT NULL, TemplateVersion varchar(40) NOT NULL,
 PageCount int NOT NULL CHECK(PageCount>0), SnapshotJson nvarchar(max) NOT NULL CHECK(ISJSON(SnapshotJson)=1),
 CreatedAt datetime2(3) NOT NULL, CONSTRAINT CK_DemoFileBytes CHECK(DATALENGTH(PdfBytes)>0)
);
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE name='IX_DemoRequestStudent' AND object_id=OBJECT_ID('svc_demo.Request'))
 CREATE INDEX IX_DemoRequestStudent ON svc_demo.Request(StudentId,UpdatedAt DESC);
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE name='IX_DemoRequestInbox' AND object_id=OBJECT_ID('svc_demo.Request'))
 CREATE INDEX IX_DemoRequestInbox ON svc_demo.Request(Department,Status,UpdatedAt DESC);
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE name='IX_DemoEventTimeline' AND object_id=OBJECT_ID('svc_demo.RequestEvent'))
 CREATE INDEX IX_DemoEventTimeline ON svc_demo.RequestEvent(RequestId,Id);

INSERT svc_demo.Actor(Id,DisplayName,Role,Department,StudentNumber)
SELECT s.Id,s.DisplayName,s.Role,s.Department,s.StudentNumber FROM (VALUES
 (N'student-a',N'Nguyễn Minh Anh (SV thử A)','STUDENT',NULL,N'DEMO0001'),
 (N'student-b',N'Trần Hoàng Nam (SV thử B)','STUDENT',NULL,N'DEMO0002'),
 (N'staff-ctsv',N'Chuyên viên CTSV A','STAFF','CTSV',NULL),
 (N'staff-ctsv-b',N'Chuyên viên CTSV B','STAFF','CTSV',NULL),
 (N'staff-dt',N'Chuyên viên Đào tạo','STAFF','DT',NULL)
 ,(N'staff-lms',N'Chuyên viên hỗ trợ LMS','STAFF','IT',NULL)
) s(Id,DisplayName,Role,Department,StudentNumber)
WHERE NOT EXISTS(SELECT 1 FROM svc_demo.Actor a WHERE a.Id=s.Id);
-- Fictional student details only; never seed source-document identities or photos.
INSERT svc_demo.StudentProfile(ActorId,ProfileJson)
SELECT a.Id,(SELECT CASE WHEN a.Id='student-a' THEN N'Nguyễn Minh Anh' ELSE N'Trần Hoàng Nam' END AS name,
 a.StudentNumber AS studentNumber,N'23DEMO1' AS className,N'15/02/2004' AS dateOfBirth,
 N'000000000001' AS identityNumber,N'0000000000' AS phone,N'Đà Nẵng' AS birthPlace,
 CASE WHEN a.Id='student-a' THEN N'Nữ' ELSE N'Nam' END AS gender,N'Kinh' AS ethnicity,
 N'Công nghệ thông tin (thử nghiệm)' AS programName,'DEMO' AS photoKind,
 'LOCAL_DEMO' AS source, CAST(1 AS bit) AS isSimulation,
 JSON_QUERY(N'{"requiredCredits":130,"earnedCredits":114,"cumulativeGpa":3.5,"conductAverage":85}') AS academic,
 JSON_QUERY(N'[{"termCode":"2610","termName":"HK1 / 2026-2027","credits":18,"repeatedCredits":0,"scholarshipAverage":8.4,"gpa":3.5,"cumulativeGpa":3.5,"hasLowGrade":"Không","conductScore":85}]') AS semesterResults
 FOR JSON PATH,WITHOUT_ARRAY_WRAPPER)
FROM svc_demo.Actor a WHERE a.Role='STUDENT' AND NOT EXISTS(SELECT 1 FROM svc_demo.StudentProfile p WHERE p.ActorId=a.Id);
COMMIT TRANSACTION;
END TRY
BEGIN CATCH IF @@TRANCOUNT>0 ROLLBACK TRANSACTION; THROW; END CATCH;
