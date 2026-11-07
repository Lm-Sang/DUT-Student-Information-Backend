SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET XACT_ABORT ON;
IF DB_NAME() NOT IN(N'sv_dut',N'Studentpage_Integration_20261103') THROW 51000,'Local database required',1;
IF OBJECT_ID(N'auth.PermissionDefinitions',N'U') IS NULL
 CREATE TABLE auth.PermissionDefinitions(
  PermissionName nvarchar(100) NOT NULL PRIMARY KEY REFERENCES auth.Permissions(PermissionName),
  DisplayName nvarchar(250) NOT NULL,GroupName nvarchar(100) NOT NULL,
  FieldCode varchar(10) NOT NULL REFERENCES auth.Fields(FieldCode),
  TaskId int NOT NULL REFERENCES auth.Tasks(TaskId),ModuleCode varchar(40) NOT NULL,
  IsActive bit NOT NULL DEFAULT 1);
IF OBJECT_ID(N'auth.RoleDefinitions',N'U') IS NULL
 CREATE TABLE auth.RoleDefinitions(
  RoleName nvarchar(100) NOT NULL PRIMARY KEY REFERENCES auth.Roles(RoleName),
  DisplayName nvarchar(150) NOT NULL,Description nvarchar(1000) NOT NULL DEFAULT N'',
  FieldCode varchar(10) NOT NULL REFERENCES auth.Fields(FieldCode),
  IsActive bit NOT NULL DEFAULT 1,Revision int NOT NULL DEFAULT 1);
EXEC(N'CREATE OR ALTER PROCEDURE auth.RefreshPermissionCatalog AS BEGIN SET NOCOUNT ON;DECLARE @catalog TABLE(PermissionName nvarchar(100),DisplayName nvarchar(250),GroupName nvarchar(100),FieldCode varchar(10),TaskId int,ModuleCode varchar(40));
INSERT @catalog
 SELECT CONCAT(N''work:'',MaLoaiDon),CONCAT(N''Xử lý: '',TenLoaiDon),N''Đơn đề nghị'',''DT'',4,''student-requests''
 FROM svc_demo.LoaiDon WHERE MaLoaiDon NOT IN(''CONFIRMATION'',''LMS_SUPPORT'');
INSERT @catalog
 SELECT CONCAT(N''work:CONFIRMATION:'',MaVanBan),CONCAT(N''Xử lý: '',TenVanBan),N''Đơn xác nhận'',''DT'',4,''student-requests'' FROM svc_demo.Sys_VanBan;
INSERT @catalog VALUES(''work:LMS_SUPPORT'',N''Xử lý yêu cầu cấp lại mật khẩu LMS'',N''Hỗ trợ LMS'',''DT'',4,''student-requests'');
INSERT @catalog
 SELECT CONCAT(N''work:certifications:'',Id),CONCAT(N''Xử lý: '',COALESCE(NULLIF(DisplayName,N''''),Code)),N''Chứng chỉ ngoại ngữ'',''DT'',1,''certifications'' FROM certification.CertificateTypes;
INSERT @catalog
 SELECT CONCAT(N''work:it-certifications:'',MaCC),CONCAT(N''Xử lý: '',TenCC),N''Chứng chỉ tin học'',''DT'',2,''it-certifications'' FROM certification.tmCNTTChungChi;
INSERT @catalog VALUES
 (''work:academic-leave:leave'',N''Xử lý ngừng học và gia hạn ngừng học'',N''Học vụ'',''DT'',3,''academic-leave''),
 (''work:academic-leave:return'',N''Xử lý trở lại học'',N''Học vụ'',''DT'',3,''academic-leave''),
 (''certifications:catalog:manage'',N''Quản lý danh mục chứng chỉ'',N''Danh mục'',''DT'',1,''certifications''),
 (''workbook.export'',N''Xuất Excel đơn đề nghị / xác nhận'',N''Excel'',''DT'',4,''student-requests''),
 (''workbook.import'',N''Nhập Excel xử lý đơn đề nghị / xác nhận'',N''Excel'',''DT'',4,''student-requests'');
INSERT @catalog
 SELECT CONCAT(m.code,'':workbook:'',a.code),CONCAT(a.name,N'' Excel '',m.name),N''Excel'',''DT'',m.taskId,m.code
 FROM (VALUES(''certifications'',N''chứng chỉ ngoại ngữ'',1),(''it-certifications'',N''chứng chỉ tin học'',2),(''academic-leave'',N''học vụ'',3))m(code,name,taskId)
 CROSS JOIN(VALUES(''export'',N''Xuất''),(''import'',N''Nhập''))a(code,name);
INSERT auth.Permissions(PermissionName) SELECT DISTINCT c.PermissionName FROM @catalog c WHERE NOT EXISTS(SELECT 1 FROM auth.Permissions p WHERE p.PermissionName=c.PermissionName);
INSERT auth.PermissionDefinitions(PermissionName,DisplayName,GroupName,FieldCode,TaskId,ModuleCode)
 SELECT c.* FROM @catalog c WHERE NOT EXISTS(SELECT 1 FROM auth.PermissionDefinitions p WHERE p.PermissionName=c.PermissionName);
UPDATE p SET DisplayName=c.DisplayName,GroupName=c.GroupName FROM auth.PermissionDefinitions p JOIN @catalog c ON c.PermissionName=p.PermissionName;
 END');
EXEC auth.RefreshPermissionCatalog;
-- Convert only canonical auth task grants once. Legacy demo roles never grant rights.
IF NOT EXISTS(SELECT 1 FROM sys.extended_properties WHERE class=1 AND major_id=OBJECT_ID(N'auth.PermissionDefinitions') AND name=N'GranularRbacVersion') BEGIN
 INSERT auth.AccountPermissions(AccountId,PermissionName)
  SELECT a.AccountId,p.PermissionName FROM auth.AccountTasks a
  JOIN auth.AccountProfiles profile ON profile.AccountId=a.AccountId AND profile.AccessLevel='specialist'
  JOIN auth.PermissionDefinitions p ON p.TaskId=a.TaskId AND p.FieldCode=profile.FieldCode
  WHERE NOT EXISTS(SELECT 1 FROM auth.AccountPermissions currentGrant WHERE currentGrant.AccountId=a.AccountId AND currentGrant.PermissionName=p.PermissionName);
 UPDATE auth.AccountProfiles SET Revision=Revision+1;
 EXEC sys.sp_addextendedproperty @name=N'GranularRbacVersion',@value=1,@level0type=N'SCHEMA',@level0name=N'auth',@level1type=N'TABLE',@level1name=N'PermissionDefinitions';
END;
