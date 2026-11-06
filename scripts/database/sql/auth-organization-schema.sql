-- Canonical auth organization schema. Existing accounts, passwords and workflow history are preserved.
SET XACT_ABORT ON;
BEGIN TRY
BEGIN TRANSACTION;
IF OBJECT_ID(N'auth.Fields',N'U') IS NULL
 CREATE TABLE auth.Fields(
  FieldCode varchar(10) NOT NULL PRIMARY KEY,
  FieldName nvarchar(150) NOT NULL,
  IsActive bit NOT NULL DEFAULT 1);
IF OBJECT_ID(N'auth.Tasks',N'U') IS NULL
 CREATE TABLE auth.Tasks(
  TaskId int NOT NULL PRIMARY KEY,
  TaskCode varchar(64) NOT NULL UNIQUE,
  TaskName nvarchar(150) NOT NULL,
  FieldCode varchar(10) NOT NULL REFERENCES auth.Fields(FieldCode),
  IsActive bit NOT NULL DEFAULT 1,
  CONSTRAINT UQ_AuthTaskField UNIQUE(TaskId,FieldCode));
IF OBJECT_ID(N'auth.AccountProfiles',N'U') IS NULL
 CREATE TABLE auth.AccountProfiles(
  AccountId uniqueidentifier NOT NULL PRIMARY KEY REFERENCES auth.LocalAccounts(Id),
  StaffAccountId nvarchar(40) NULL REFERENCES svc_demo.TaiKhoan(MaHS),
  AccessLevel varchar(20) NOT NULL,
  FieldCode varchar(10) NULL REFERENCES auth.Fields(FieldCode),
  Revision int NOT NULL DEFAULT 1,
  CONSTRAINT CK_AuthAccessLevel CHECK(
   (AccessLevel='super_admin' AND FieldCode IS NULL) OR
   (AccessLevel IN('department_admin','specialist') AND FieldCode IS NOT NULL)),
  CONSTRAINT UQ_AuthProfileField UNIQUE(AccountId,FieldCode));
-- SQL Server UNIQUE permits only one NULL; use a filtered index for optional links.
IF NOT EXISTS(SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID(N'auth.AccountProfiles') AND name=N'UX_AuthStaffProfile')
 CREATE UNIQUE INDEX UX_AuthStaffProfile ON auth.AccountProfiles(StaffAccountId) WHERE StaffAccountId IS NOT NULL;
IF OBJECT_ID(N'auth.AccountTasks',N'U') IS NULL
 CREATE TABLE auth.AccountTasks(
  AccountId uniqueidentifier NOT NULL,
  TaskId int NOT NULL,
  FieldCode varchar(10) NOT NULL,
  PRIMARY KEY(AccountId,TaskId),
  FOREIGN KEY(AccountId,FieldCode) REFERENCES auth.AccountProfiles(AccountId,FieldCode),
  FOREIGN KEY(TaskId,FieldCode) REFERENCES auth.Tasks(TaskId,FieldCode));
IF OBJECT_ID(N'auth.TaskPermissions',N'U') IS NULL
 CREATE TABLE auth.TaskPermissions(
  TaskId int NOT NULL REFERENCES auth.Tasks(TaskId),
  PermissionName nvarchar(100) NOT NULL,
  PRIMARY KEY(TaskId,PermissionName));
IF OBJECT_ID(N'auth.AccountSecurityEvents',N'U') IS NULL
 CREATE TABLE auth.AccountSecurityEvents(
  Id bigint IDENTITY(1,1) NOT NULL PRIMARY KEY,
  ActorId uniqueidentifier NOT NULL REFERENCES auth.LocalAccounts(Id),
  TargetId uniqueidentifier NOT NULL REFERENCES auth.LocalAccounts(Id),
  Action varchar(32) NOT NULL,
  CreatedAt datetime2 NOT NULL DEFAULT SYSUTCDATETIME());

INSERT auth.Fields(FieldCode,FieldName)
 SELECT x.code,x.name FROM (VALUES
 ('KT',N'Khảo thí'),('QC',N'Quy chế - Quy định'),('SV',N'Công tác sinh viên'),
 ('TTHL',N'Trung tâm học liệu'),('TTTH',N'Trung Tâm Tin học'),
 ('SSERC',N'TTHTSV & QHDN'),('DT',N'Đào tạo'),('TC',N'Kế hoạch - Tài chính'),('PC',N'Pháp chế')
 ) x(code,name) WHERE NOT EXISTS(SELECT 1 FROM auth.Fields f WHERE f.FieldCode=x.code);
INSERT auth.Tasks(TaskId,TaskCode,TaskName,FieldCode)
 SELECT x.id,x.code,x.name,'DT' FROM (VALUES
 (1,'certifications',N'Chứng chỉ ngoại ngữ'),(2,'it-certifications',N'Chứng chỉ tin học'),
 (3,'academic-leave',N'Ngừng học / tiếp tục học'),(4,'student-requests',N'Lập và xử lý đơn')
 ) x(id,code,name) WHERE NOT EXISTS(SELECT 1 FROM auth.Tasks t WHERE t.TaskId=x.id);
INSERT auth.TaskPermissions(TaskId,PermissionName)
 SELECT x.id,x.permission FROM (VALUES
 (1,N'certifications:review'),(1,N'certifications:catalog:manage'),
 (2,N'certifications:review'),(2,N'certifications:catalog:manage'),
 (3,N'academic-leave:review'),
 (4,N'requests.view'),(4,N'requests.receive'),(4,N'requests.print'),
 (4,N'requests.complete'),(4,N'requests.cancel'),(4,N'workbook.export'),(4,N'workbook.import')
 ) x(id,permission) WHERE NOT EXISTS(SELECT 1 FROM auth.TaskPermissions p WHERE p.TaskId=x.id AND p.PermissionName=x.permission);
-- Work keys remain compatible with the current request workflow and SQL guards.
INSERT auth.TaskPermissions(TaskId,PermissionName)
 SELECT 4,x.permission FROM (
  SELECT CONVERT(nvarchar(100),'work:'+MaLoaiDon) AS permission FROM svc_demo.LoaiDon WHERE MaLoaiDon<>'CONFIRMATION' AND MaDV='115'
  UNION SELECT CONVERT(nvarchar(100),'work:CONFIRMATION:'+MaVanBan) FROM svc_demo.Sys_VanBan WHERE MaDVcap='115'
 ) x WHERE NOT EXISTS(SELECT 1 FROM auth.TaskPermissions p WHERE p.TaskId=4 AND p.PermissionName=x.permission);
COMMIT TRANSACTION;
END TRY BEGIN CATCH IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;THROW;END CATCH;
