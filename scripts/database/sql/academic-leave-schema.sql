-- Run against the local application database before starting this version.
-- Re-runnable; preserves applications, request codes and confirmed snapshots.
-- This base schema must be followed by review-workflow.sql; academic-leave:db:init runs both.
SET NOCOUNT ON;
SET XACT_ABORT ON;
BEGIN TRY
BEGIN TRANSACTION;
IF SCHEMA_ID(N'academic_leave') IS NULL EXEC(N'CREATE SCHEMA academic_leave');
IF OBJECT_ID(N'academic_leave.Applications',N'U') IS NULL
BEGIN
  CREATE TABLE academic_leave.Applications (
    Id int IDENTITY(1,1) NOT NULL CONSTRAINT PK_AcademicLeave PRIMARY KEY,
    StudentCode varchar(9) NOT NULL,
    StudentSequence int NOT NULL,
    RequestCode AS (CONVERT(varchar(2),'NH')+StudentCode+CONVERT(varchar(10),StudentSequence)) PERSISTED,
    ActorSource varchar(40) NOT NULL,
    ActorReference nvarchar(200) NOT NULL,
    Kind varchar(20) NOT NULL,
    ParentApplicationId int NULL,
    ReasonCode varchar(20) NOT NULL,
    StartSemesterCode char(4) NOT NULL,
    SemesterCount tinyint NOT NULL,
    Content nvarchar(2000) NOT NULL CONSTRAINT DF_AcademicLeave_Content DEFAULT N'',
    Status varchar(20) NOT NULL CONSTRAINT DF_AcademicLeave_Status DEFAULT 'draft',
    SnapshotJson nvarchar(max) NULL,
    StudentConfirmedAt datetime2(3) NULL,
    ReviewerReference nvarchar(200) NULL,
    ReviewerName nvarchar(150) NULL,
    ReviewNote nvarchar(1000) NULL,
    ReviewedAt datetime2(3) NULL,
    PaperDeadlineAt datetime2(3) NULL,
    PaperReceivedAt datetime2(3) NULL,
    PaperReceivedBy nvarchar(200) NULL,
    CreatedAt datetime2(3) NOT NULL CONSTRAINT DF_AcademicLeave_Created DEFAULT SYSUTCDATETIME(),
    UpdatedAt datetime2(3) NOT NULL CONSTRAINT DF_AcademicLeave_Updated DEFAULT SYSUTCDATETIME(),
    RowVersion rowversion NOT NULL,
    CONSTRAINT UQ_AcademicLeave_Code UNIQUE(RequestCode),
    CONSTRAINT UQ_AcademicLeave_Owner UNIQUE(Id,StudentCode),
    CONSTRAINT FK_AcademicLeave_Parent FOREIGN KEY(ParentApplicationId,StudentCode)
      REFERENCES academic_leave.Applications(Id,StudentCode),
    CONSTRAINT CK_AcademicLeave_Student CHECK(LEN(StudentCode)=9 AND StudentCode NOT LIKE '%[^0-9]%'),
    CONSTRAINT CK_AcademicLeave_Sequence CHECK(StudentSequence>0),
    CONSTRAINT CK_AcademicLeave_Semester CHECK(StartSemesterCode LIKE '[0-9][0-9][12]0'),
    CONSTRAINT CK_AcademicLeave_Reason CHECK(ReasonCode IN('medical','accident','military','maternity')),
    CONSTRAINT CK_AcademicLeave_Status CHECK(Status IN('draft','submitted','needs_changes','approved','rejected','paper_received','cancelled')),
    CONSTRAINT CK_AcademicLeave_Snapshot CHECK(SnapshotJson IS NULL OR ISJSON(SnapshotJson)=1),
    CONSTRAINT CK_AcademicLeave_Confirmed CHECK(Status IN('draft','cancelled') OR (StudentConfirmedAt IS NOT NULL AND SnapshotJson IS NOT NULL)),
    CONSTRAINT CK_AcademicLeave_Approval CHECK(Status NOT IN('approved','paper_received') OR
      (ReviewedAt IS NOT NULL AND PaperDeadlineAt IS NOT NULL AND PaperDeadlineAt=DATEADD(day,3,ReviewedAt))),
    CONSTRAINT CK_AcademicLeave_Paper CHECK((Status='paper_received' AND PaperReceivedAt IS NOT NULL AND PaperReceivedBy IS NOT NULL
      AND PaperReceivedAt>=ReviewedAt AND PaperReceivedAt<=PaperDeadlineAt)
      OR (Status<>'paper_received' AND PaperReceivedAt IS NULL AND PaperReceivedBy IS NULL))
  );
END;

-- Upgrade the older global-ID request-code scheme without renumbering issued codes.
IF COL_LENGTH(N'academic_leave.Applications',N'StudentSequence') IS NULL
BEGIN
  EXEC(N'ALTER TABLE academic_leave.Applications ADD StudentSequence int NULL');
  EXEC(N'UPDATE academic_leave.Applications SET StudentSequence=CONVERT(int,SUBSTRING(RequestCode,12,10))');
  ALTER TABLE academic_leave.Applications DROP CONSTRAINT UQ_AcademicLeave_Code;
  ALTER TABLE academic_leave.Applications DROP COLUMN RequestCode;
  EXEC(N'ALTER TABLE academic_leave.Applications ALTER COLUMN StudentSequence int NOT NULL');
  EXEC(N'ALTER TABLE academic_leave.Applications ADD RequestCode AS
    (CONVERT(varchar(2),''NH'')+StudentCode+CONVERT(varchar(10),StudentSequence)) PERSISTED');
  EXEC(N'ALTER TABLE academic_leave.Applications ADD CONSTRAINT UQ_AcademicLeave_Code UNIQUE(RequestCode)');
  EXEC(N'ALTER TABLE academic_leave.Applications ADD CONSTRAINT CK_AcademicLeave_Sequence CHECK(StudentSequence>0)');
END;
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'academic_leave.Applications') AND name=N'UX_AcademicLeave_StudentSequence')
  EXEC(N'CREATE UNIQUE INDEX UX_AcademicLeave_StudentSequence ON academic_leave.Applications(StudentCode,StudentSequence)');

-- Replace old kind/parent/duration checks. WITH NOCHECK retains historical
-- approvals made under the old 1-4 term policy; new writes obey the new policy.
IF NOT EXISTS(SELECT 1 FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID(N'academic_leave.Applications') AND name=N'CK_AcademicLeave_WorkflowV2')
BEGIN
  DECLARE @drop nvarchar(max)=N'';
  SELECT @drop=@drop+N'ALTER TABLE academic_leave.Applications DROP CONSTRAINT '+QUOTENAME(name)+N';'
    FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID(N'academic_leave.Applications')
    AND (definition LIKE '%Kind%' OR definition LIKE '%ParentApplicationId%' OR definition LIKE '%SemesterCount%');
  IF @drop<>N'' EXEC(@drop);
  ALTER TABLE academic_leave.Applications WITH NOCHECK ADD CONSTRAINT CK_AcademicLeave_WorkflowV2 CHECK(
    (Kind='leave' AND ParentApplicationId IS NULL AND SemesterCount BETWEEN 1 AND 4 AND (ReasonCode='military' OR SemesterCount=1))
    OR (Kind='extension' AND ParentApplicationId IS NOT NULL AND ParentApplicationId<>Id
      AND SemesterCount BETWEEN 1 AND 4 AND (ReasonCode='military' OR SemesterCount=1))
    OR (Kind='return' AND ParentApplicationId IS NOT NULL AND ParentApplicationId<>Id AND SemesterCount=0));
END;
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'academic_leave.Applications') AND name=N'UX_AcademicLeave_OpenStudent')
  CREATE UNIQUE INDEX UX_AcademicLeave_OpenStudent ON academic_leave.Applications(StudentCode)
    WHERE Status IN('draft','submitted','needs_changes');
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'academic_leave.Applications') AND name=N'UX_AcademicLeave_Parent')
  CREATE UNIQUE INDEX UX_AcademicLeave_Parent ON academic_leave.Applications(ParentApplicationId)
    WHERE ParentApplicationId IS NOT NULL AND Status<>'cancelled' AND Status<>'rejected';

IF OBJECT_ID(N'academic_leave.ApplicationHistory',N'U') IS NULL
BEGIN
  CREATE TABLE academic_leave.ApplicationHistory (
    Id bigint IDENTITY(1,1) NOT NULL CONSTRAINT PK_AcademicLeave_History PRIMARY KEY,
    ApplicationId int NOT NULL CONSTRAINT FK_AcademicLeave_History FOREIGN KEY REFERENCES academic_leave.Applications(Id),
    Action varchar(30) NOT NULL,
    ActorSource varchar(40) NOT NULL,
    ActorReference nvarchar(200) NOT NULL,
    ActorName nvarchar(150) NULL,
    Status varchar(20) NOT NULL,
    DataJson nvarchar(max) NOT NULL CONSTRAINT CK_AcademicLeave_HistoryJson CHECK(ISJSON(DataJson)=1),
    CreatedAt datetime2(3) NOT NULL CONSTRAINT DF_AcademicLeave_HistoryCreated DEFAULT SYSUTCDATETIME()
  );
  CREATE INDEX IX_AcademicLeave_History ON academic_leave.ApplicationHistory(ApplicationId,Id DESC);
  -- Existing records have a baseline, not fabricated past transitions.
  INSERT academic_leave.ApplicationHistory(ApplicationId,Action,ActorSource,ActorReference,Status,DataJson)
    SELECT c.Id,'migrated',c.ActorSource,c.ActorReference,c.Status,
      (SELECT c.Id AS id,c.RequestCode AS requestCode,c.Kind AS kind,c.ParentApplicationId AS parentApplicationId,
        c.ReasonCode AS reasonCode,c.StartSemesterCode AS startSemesterCode,c.SemesterCount AS semesterCount,
        c.Content AS content,c.Status AS status,JSON_QUERY(c.SnapshotJson) AS snapshot
        FOR JSON PATH,INCLUDE_NULL_VALUES,WITHOUT_ARRAY_WRAPPER)
    FROM academic_leave.Applications c;
END;
COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF XACT_STATE()<>0 ROLLBACK TRANSACTION;
  THROW;
END CATCH;
