SET XACT_ABORT ON;
BEGIN TRANSACTION;
IF SCHEMA_ID(N'auth') IS NULL EXEC(N'CREATE SCHEMA auth');
IF OBJECT_ID(N'auth.LocalAccounts', N'U') IS NULL
BEGIN
  CREATE TABLE auth.LocalAccounts (
    Id uniqueidentifier NOT NULL CONSTRAINT PK_AuthLocalAccounts PRIMARY KEY,
    Username nvarchar(128) COLLATE Latin1_General_100_CI_AS NOT NULL,
    DisplayName nvarchar(150) NOT NULL,
    PasswordHash nvarchar(512) NOT NULL,
    Channel varchar(16) NOT NULL,
    RolesJson nvarchar(2048) NOT NULL CONSTRAINT DF_AuthRoles DEFAULT N'[]',
    PermissionsJson nvarchar(4000) NOT NULL CONSTRAINT DF_AuthPermissions DEFAULT N'[]',
    IsActive bit NOT NULL CONSTRAINT DF_AuthActive DEFAULT 1,
    CreatedAt datetime2 NOT NULL CONSTRAINT DF_AuthCreated DEFAULT SYSUTCDATETIME(),
    Version rowversion NOT NULL,
    CONSTRAINT UQ_AuthUsername UNIQUE (Username),
    CONSTRAINT CK_AuthChannel CHECK (Channel IN ('student', 'admin')),
    CONSTRAINT CK_AuthRoles CHECK (ISJSON(RolesJson) = 1),
    CONSTRAINT CK_AuthPermissions CHECK (ISJSON(PermissionsJson) = 1)
  );
END;
COMMIT TRANSACTION;
