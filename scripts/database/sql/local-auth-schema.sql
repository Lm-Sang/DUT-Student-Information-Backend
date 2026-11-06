SET XACT_ABORT ON;
BEGIN TRY
BEGIN TRANSACTION;
IF SCHEMA_ID(N'auth') IS NULL EXEC(N'CREATE SCHEMA auth');
IF OBJECT_ID(N'auth.LocalAccounts',N'U') IS NULL
 CREATE TABLE auth.LocalAccounts (
  Id uniqueidentifier NOT NULL CONSTRAINT PK_AuthLocalAccounts PRIMARY KEY,
  Username nvarchar(128) COLLATE Latin1_General_100_CI_AS NOT NULL CONSTRAINT UQ_AuthUsername UNIQUE,
  DisplayName nvarchar(150) NOT NULL,PasswordHash nvarchar(512) NOT NULL,
  Channel varchar(16) NOT NULL CONSTRAINT CK_AuthChannel CHECK(Channel IN('student','admin')),
  IsActive bit NOT NULL CONSTRAINT DF_AuthActive DEFAULT 1,
  CreatedAt datetime2 NOT NULL CONSTRAINT DF_AuthCreated DEFAULT SYSUTCDATETIME(),Version rowversion NOT NULL);
IF OBJECT_ID(N'auth.Roles',N'U') IS NULL CREATE TABLE auth.Roles(RoleName nvarchar(100) NOT NULL PRIMARY KEY);
IF OBJECT_ID(N'auth.Permissions',N'U') IS NULL CREATE TABLE auth.Permissions(PermissionName nvarchar(100) NOT NULL PRIMARY KEY);
IF OBJECT_ID(N'auth.AccountRoles',N'U') IS NULL CREATE TABLE auth.AccountRoles(
 AccountId uniqueidentifier NOT NULL REFERENCES auth.LocalAccounts(Id) ON DELETE CASCADE,
 RoleName nvarchar(100) NOT NULL REFERENCES auth.Roles(RoleName),PRIMARY KEY(AccountId,RoleName));
IF OBJECT_ID(N'auth.AccountPermissions',N'U') IS NULL CREATE TABLE auth.AccountPermissions(
 AccountId uniqueidentifier NOT NULL REFERENCES auth.LocalAccounts(Id) ON DELETE CASCADE,
 PermissionName nvarchar(100) NOT NULL REFERENCES auth.Permissions(PermissionName),PRIMARY KEY(AccountId,PermissionName));
IF OBJECT_ID(N'auth.RolePermissions',N'U') IS NULL CREATE TABLE auth.RolePermissions(
 RoleName nvarchar(100) NOT NULL REFERENCES auth.Roles(RoleName),
 PermissionName nvarchar(100) NOT NULL REFERENCES auth.Permissions(PermissionName),PRIMARY KEY(RoleName,PermissionName));
-- Normalize the restored auth branch's existing arrays once, preserving accounts.
IF COL_LENGTH('auth.LocalAccounts','RolesJson') IS NOT NULL
 EXEC(N'
 IF EXISTS(SELECT 1 FROM auth.LocalAccounts WHERE ISJSON(RolesJson)<>1 OR ISJSON(PermissionsJson)<>1) THROW 51150,''Invalid account permission arrays; migration stopped'',1;
 IF EXISTS(SELECT 1 FROM auth.LocalAccounts a CROSS APPLY OPENJSON(a.RolesJson) j WHERE j.type<>1 OR LEN(j.value)=0 OR LEN(j.value)>100)
  OR EXISTS(SELECT 1 FROM auth.LocalAccounts a CROSS APPLY OPENJSON(a.PermissionsJson) j WHERE j.type<>1 OR LEN(j.value)=0 OR LEN(j.value)>100) THROW 51150,''Invalid role or permission name; migration stopped'',1;
 INSERT auth.Roles(RoleName) SELECT DISTINCT j.value FROM auth.LocalAccounts a CROSS APPLY OPENJSON(a.RolesJson) j WHERE NOT EXISTS(SELECT 1 FROM auth.Roles r WHERE r.RoleName=j.value);
 INSERT auth.Permissions(PermissionName) SELECT DISTINCT j.value FROM auth.LocalAccounts a CROSS APPLY OPENJSON(a.PermissionsJson) j WHERE NOT EXISTS(SELECT 1 FROM auth.Permissions p WHERE p.PermissionName=j.value);
 INSERT auth.AccountRoles(AccountId,RoleName) SELECT DISTINCT a.Id,j.value FROM auth.LocalAccounts a CROSS APPLY OPENJSON(a.RolesJson) j WHERE NOT EXISTS(SELECT 1 FROM auth.AccountRoles r WHERE r.AccountId=a.Id AND r.RoleName=j.value);
 INSERT auth.AccountPermissions(AccountId,PermissionName) SELECT DISTINCT a.Id,j.value FROM auth.LocalAccounts a CROSS APPLY OPENJSON(a.PermissionsJson) j WHERE NOT EXISTS(SELECT 1 FROM auth.AccountPermissions p WHERE p.AccountId=a.Id AND p.PermissionName=j.value);
 DECLARE @drop nvarchar(max)=N'''';
 SELECT @drop=@drop+N''ALTER TABLE auth.LocalAccounts DROP CONSTRAINT ''+QUOTENAME(name)+N'';'' FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID(''auth.LocalAccounts'') AND (definition LIKE ''%RolesJson%'' OR definition LIKE ''%PermissionsJson%'');
 SELECT @drop=@drop+N''ALTER TABLE auth.LocalAccounts DROP CONSTRAINT ''+QUOTENAME(name)+N'';'' FROM sys.default_constraints WHERE parent_object_id=OBJECT_ID(''auth.LocalAccounts'') AND COL_NAME(parent_object_id,parent_column_id) IN(''RolesJson'',''PermissionsJson'');
 EXEC sys.sp_executesql @drop;
 ALTER TABLE auth.LocalAccounts DROP COLUMN RolesJson,PermissionsJson;
 ');
COMMIT TRANSACTION;
END TRY BEGIN CATCH IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;THROW;END CATCH;
