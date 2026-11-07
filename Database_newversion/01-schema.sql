CREATE SCHEMA [academic_leave] AUTHORIZATION [dbo];
GO
CREATE SCHEMA [auth] AUTHORIZATION [dbo];
GO
CREATE SCHEMA [certification] AUTHORIZATION [dbo];
GO
CREATE SCHEMA [svc_demo] AUTHORIZATION [dbo];
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [auth].[PermissionDefinitions](
	[PermissionName] [nvarchar](100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[DisplayName] [nvarchar](250) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[GroupName] [nvarchar](100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[FieldCode] [varchar](10) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[TaskId] [int] NOT NULL,
	[ModuleCode] [varchar](40) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[IsActive] [bit] NOT NULL,
PRIMARY KEY CLUSTERED
(
	[PermissionName] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [auth].[RoleDefinitions](
	[RoleName] [nvarchar](100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[DisplayName] [nvarchar](150) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[Description] [nvarchar](1000) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[FieldCode] [varchar](10) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[IsActive] [bit] NOT NULL,
	[Revision] [int] NOT NULL,
PRIMARY KEY CLUSTERED
(
	[RoleName] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [auth].[AccountRoles](
	[AccountId] [uniqueidentifier] NOT NULL,
	[RoleName] [nvarchar](100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
PRIMARY KEY CLUSTERED
(
	[AccountId] ASC,
	[RoleName] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [auth].[AccountPermissions](
	[AccountId] [uniqueidentifier] NOT NULL,
	[PermissionName] [nvarchar](100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
PRIMARY KEY CLUSTERED
(
	[AccountId] ASC,
	[PermissionName] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [auth].[RolePermissions](
	[RoleName] [nvarchar](100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[PermissionName] [nvarchar](100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
PRIMARY KEY CLUSTERED
(
	[RoleName] ASC,
	[PermissionName] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [auth].[Fields](
	[FieldCode] [varchar](10) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[FieldName] [nvarchar](150) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[IsActive] [bit] NOT NULL,
PRIMARY KEY CLUSTERED
(
	[FieldCode] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [auth].[AccountProfiles](
	[AccountId] [uniqueidentifier] NOT NULL,
	[StaffAccountId] [nvarchar](40) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[AccessLevel] [varchar](20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[FieldCode] [varchar](10) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[Revision] [int] NOT NULL,
PRIMARY KEY CLUSTERED
(
	[AccountId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY],
 CONSTRAINT [UQ_AuthProfileField] UNIQUE NONCLUSTERED
(
	[AccountId] ASC,
	[FieldCode] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [auth].[LocalAccounts](
	[Id] [uniqueidentifier] NOT NULL,
	[Username] [nvarchar](128) COLLATE Latin1_General_100_CI_AS NOT NULL,
	[DisplayName] [nvarchar](150) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[PasswordHash] [nvarchar](512) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[Channel] [varchar](16) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[IsActive] [bit] NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[Version] [timestamp] NOT NULL,
 CONSTRAINT [PK_AuthLocalAccounts] PRIMARY KEY CLUSTERED
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY],
 CONSTRAINT [UQ_AuthUsername] UNIQUE NONCLUSTERED
(
	[Username] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE   VIEW auth.vAssignedPermissions AS
 SELECT p.AccountId,d.PermissionName,d.TaskId,d.ModuleCode FROM auth.AccountProfiles p
 JOIN auth.LocalAccounts a ON a.Id=p.AccountId AND a.IsActive=1
 JOIN auth.Fields f ON f.FieldCode=p.FieldCode AND f.IsActive=1
 JOIN auth.AccountPermissions ap ON ap.AccountId=p.AccountId
 JOIN auth.PermissionDefinitions d ON d.PermissionName=ap.PermissionName AND d.FieldCode=p.FieldCode AND d.IsActive=1
 WHERE p.AccessLevel='specialist'
 UNION
 SELECT p.AccountId,d.PermissionName,d.TaskId,d.ModuleCode FROM auth.AccountProfiles p
 JOIN auth.LocalAccounts a ON a.Id=p.AccountId AND a.IsActive=1
 JOIN auth.Fields f ON f.FieldCode=p.FieldCode AND f.IsActive=1
 JOIN auth.AccountRoles ar ON ar.AccountId=p.AccountId
 JOIN auth.RoleDefinitions r ON r.RoleName=ar.RoleName AND r.FieldCode=p.FieldCode AND r.IsActive=1
 JOIN auth.RolePermissions rp ON rp.RoleName=r.RoleName
 JOIN auth.PermissionDefinitions d ON d.PermissionName=rp.PermissionName AND d.FieldCode=p.FieldCode AND d.IsActive=1
 WHERE p.AccessLevel='specialist'
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE   VIEW auth.vEffectivePermissions AS
 SELECT AccountId,PermissionName FROM auth.vAssignedPermissions
 UNION SELECT a.AccountId,v.permission FROM auth.vAssignedPermissions a
 CROSS JOIN(VALUES(N'requests.view'),(N'requests.receive'),(N'requests.print'),(N'requests.complete'),(N'requests.cancel'))v(permission)
 WHERE a.ModuleCode='student-requests' AND a.PermissionName LIKE N'work:%'
 UNION SELECT AccountId,N'certifications:review' FROM auth.vAssignedPermissions
 WHERE ModuleCode IN('certifications','it-certifications') AND PermissionName LIKE N'work:%'
 UNION SELECT AccountId,N'academic-leave:review' FROM auth.vAssignedPermissions
 WHERE ModuleCode='academic-leave' AND PermissionName LIKE N'work:%'
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [svc_demo].[TaiKhoan](
	[MaHS] [nvarchar](40) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[Hoten] [nvarchar](150) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[VaiTro] [varchar](20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[MaDV] [varchar](20) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[SoThe] [nvarchar](30) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[HieuLuc] [bit] NOT NULL,
	[PhienBanQuyen] [int] NOT NULL,
	[NguonDanhTinh] [varchar](20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[MaHSTruong] [nvarchar](40) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
 CONSTRAINT [PK__Actor__3214EC077EB22276] PRIMARY KEY CLUSTERED
(
	[MaHS] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE   VIEW svc_demo.vQuyenHieuLuc AS
 SELECT t.MaHS,CONVERT(varchar(100),e.PermissionName) MaQuyen FROM auth.vEffectivePermissions e
 JOIN auth.AccountProfiles p ON p.AccountId=e.AccountId
 JOIN svc_demo.TaiKhoan t ON t.MaHS=p.StaffAccountId AND t.HieuLuc=1 AND t.NguonDanhTinh='LOCAL' AND t.VaiTro='STAFF'
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE   VIEW svc_demo.vQuyenXuLy AS SELECT MaHS,SUBSTRING(MaQuyen,6,60) AS MaCongViec,CONVERT(bit,1) AS QuyenNhanDon,CONVERT(bit,1) AS QuyenXuLy FROM svc_demo.vQuyenHieuLuc WHERE MaQuyen LIKE 'work:%'
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [academic_leave].[ApplicationHistory](
	[Id] [bigint] IDENTITY(1,1) NOT NULL,
	[ApplicationId] [int] NOT NULL,
	[Action] [varchar](30) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[ActorSource] [varchar](40) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[ActorReference] [nvarchar](200) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[ActorName] [nvarchar](150) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[Status] [varchar](20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[DataJson] [nvarchar](max) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[CreatedAt] [datetime2](3) NOT NULL,
 CONSTRAINT [PK_AcademicLeave_History] PRIMARY KEY CLUSTERED
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
SET ARITHABORT ON
GO
CREATE TABLE [academic_leave].[Applications](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[StudentCode] [varchar](9) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[ActorSource] [varchar](20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[ActorReference] [nvarchar](128) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[Kind] [varchar](10) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[ParentApplicationId] [int] NULL,
	[ReasonCode] [varchar](20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[StartSemesterCode] [char](4) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[SemesterCount] [tinyint] NOT NULL,
	[Content] [nvarchar](2000) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[Status] [varchar](20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[SnapshotJson] [nvarchar](max) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[StudentConfirmedAt] [datetime2](3) NULL,
	[ReviewerReference] [nvarchar](128) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[ReviewerName] [nvarchar](150) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[ReviewNote] [nvarchar](1000) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[ReviewedAt] [datetime2](3) NULL,
	[PaperDeadlineAt] [datetime2](3) NULL,
	[PaperReceivedAt] [datetime2](3) NULL,
	[PaperReceivedBy] [nvarchar](128) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[CreatedAt] [datetime2](3) NOT NULL,
	[UpdatedAt] [datetime2](3) NOT NULL,
	[RowVersion] [timestamp] NOT NULL,
	[StudentSequence] [int] NOT NULL,
	[RequestCode]  AS ((CONVERT([varchar](2),'NH')+[StudentCode])+CONVERT([varchar](10),[StudentSequence])) PERSISTED,
	[ReceivedAt] [datetime2](3) NULL,
	[CompletedAt] [datetime2](3) NULL,
 CONSTRAINT [PK_AcademicLeave] PRIMARY KEY CLUSTERED
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY],
 CONSTRAINT [UQ_AcademicLeave_Code] UNIQUE NONCLUSTERED
(
	[RequestCode] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY],
 CONSTRAINT [UQ_AcademicLeave_Owner] UNIQUE NONCLUSTERED
(
	[Id] ASC,
	[StudentCode] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [auth].[AccountSecurityEvents](
	[Id] [bigint] IDENTITY(1,1) NOT NULL,
	[ActorId] [uniqueidentifier] NOT NULL,
	[TargetId] [uniqueidentifier] NOT NULL,
	[Action] [varchar](32) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [auth].[AccountTasks](
	[AccountId] [uniqueidentifier] NOT NULL,
	[TaskId] [int] NOT NULL,
	[FieldCode] [varchar](10) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
PRIMARY KEY CLUSTERED
(
	[AccountId] ASC,
	[TaskId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [auth].[Permissions](
	[PermissionName] [nvarchar](100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
PRIMARY KEY CLUSTERED
(
	[PermissionName] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [auth].[Roles](
	[RoleName] [nvarchar](100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
PRIMARY KEY CLUSTERED
(
	[RoleName] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [auth].[TaskPermissions](
	[TaskId] [int] NOT NULL,
	[PermissionName] [nvarchar](100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
PRIMARY KEY CLUSTERED
(
	[TaskId] ASC,
	[PermissionName] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [auth].[Tasks](
	[TaskId] [int] NOT NULL,
	[TaskCode] [varchar](64) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[TaskName] [nvarchar](150) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[FieldCode] [varchar](10) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[IsActive] [bit] NOT NULL,
PRIMARY KEY CLUSTERED
(
	[TaskId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY],
UNIQUE NONCLUSTERED
(
	[TaskCode] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY],
 CONSTRAINT [UQ_AuthTaskField] UNIQUE NONCLUSTERED
(
	[TaskId] ASC,
	[FieldCode] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [certification].[CertificateLevels](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[CertificateTypeId] [int] NOT NULL,
	[Code] [nvarchar](100) COLLATE Latin1_General_100_BIN2 NULL,
	[DisplayName] [nvarchar](200) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[Weight] [float] NULL,
	[Notes] [nvarchar](250) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[SchoolId] [int] NULL,
	[IsSchoolProvided] [bit] NOT NULL,
	[SortOrder] [int] NOT NULL,
	[ImportedAt] [datetimeoffset](3) NULL,
PRIMARY KEY CLUSTERED
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [certification].[CertificateTypeIssuers](
	[CertificateTypeId] [int] NOT NULL,
	[IssuingOrganizationId] [int] NOT NULL,
	[IsActive] [bit] NOT NULL,
PRIMARY KEY CLUSTERED
(
	[CertificateTypeId] ASC,
	[IssuingOrganizationId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [certification].[CertificateTypes](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[LanguageId] [int] NULL,
	[Code] [nvarchar](50) COLLATE Latin1_General_100_BIN2 NOT NULL,
	[DisplayName] [nvarchar](200) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[FormSchemaJson] [nvarchar](max) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[IsPublished] [bit] NOT NULL,
	[IsSchoolProvided] [bit] NOT NULL,
	[SchoolId] [int] NULL,
	[ConversionFlag] [tinyint] NULL,
	[Notes] [nvarchar](250) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[ImportedAt] [datetimeoffset](3) NULL,
	[BaseCertificateTypeId] [int] NULL,
	[Revision] [int] NOT NULL,
	[CreatedAt] [datetime2](3) NOT NULL,
	[UpdatedAt] [datetime2](3) NOT NULL,
	[RowVersion] [timestamp] NOT NULL,
PRIMARY KEY CLUSTERED
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY],
UNIQUE NONCLUSTERED
(
	[Code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [certification].[EvidenceFiles](
	[Id] [uniqueidentifier] NOT NULL,
	[CertificateId] [uniqueidentifier] NOT NULL,
	[Purpose] [varchar](32) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[OriginalFileName] [nvarchar](255) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[DeclaredContentType] [varchar](100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[DeclaredSizeBytes] [bigint] NOT NULL,
	[Bucket] [varchar](63) COLLATE Latin1_General_100_BIN2 NOT NULL,
	[ObjectKey] [varchar](512) COLLATE Latin1_General_100_BIN2 NOT NULL,
	[Status] [varchar](20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[InspectionJson] [nvarchar](max) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[CreatedAt] [datetime2](3) NOT NULL,
	[CompletedAt] [datetime2](3) NULL,
PRIMARY KEY CLUSTERED
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY],
UNIQUE NONCLUSTERED
(
	[Bucket] ASC,
	[ObjectKey] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [certification].[IssuingOrganizations](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[Code] [varchar](50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[DisplayName] [nvarchar](250) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[IsActive] [bit] NOT NULL,
	[SourceUrl] [nvarchar](1000) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[VerifiedOn] [date] NOT NULL,
	[Revision] [int] NOT NULL,
	[CreatedAt] [datetime2](3) NOT NULL,
	[UpdatedAt] [datetime2](3) NOT NULL,
	[RowVersion] [timestamp] NOT NULL,
PRIMARY KEY CLUSTERED
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY],
UNIQUE NONCLUSTERED
(
	[Code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [certification].[Languages](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[Code] [nvarchar](10) COLLATE Latin1_General_100_BIN2 NOT NULL,
	[DisplayName] [nvarchar](100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[IsPublished] [bit] NOT NULL,
	[IsSchoolProvided] [bit] NOT NULL,
	[Revision] [int] NOT NULL,
	[CreatedAt] [datetime2](3) NOT NULL,
	[UpdatedAt] [datetime2](3) NOT NULL,
	[RowVersion] [timestamp] NOT NULL,
PRIMARY KEY CLUSTERED
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY],
UNIQUE NONCLUSTERED
(
	[Code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [certification].[RecognitionPolicies](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[LanguageId] [int] NULL,
	[CertificateTypeId] [int] NULL,
	[CohortFrom] [smallint] NOT NULL,
	[CohortTo] [smallint] NULL,
	[IsRecognized] [bit] NOT NULL,
	[Reason] [nvarchar](2000) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[DocumentReference] [nvarchar](255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[Revision] [int] NOT NULL,
	[CreatedAt] [datetime2](3) NOT NULL,
	[UpdatedAt] [datetime2](3) NOT NULL,
	[RowVersion] [timestamp] NOT NULL,
PRIMARY KEY CLUSTERED
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [certification].[StudentCertificates](
	[Id] [uniqueidentifier] NOT NULL,
	[ActorReference] [nvarchar](128) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[ActorSource] [varchar](20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[StudentCode] [varchar](9) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[CohortYear] [smallint] NOT NULL,
	[CertificateTypeId] [int] NOT NULL,
	[FullName] [nvarchar](150) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[ClassName] [nvarchar](50) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[ResultJson] [nvarchar](max) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[CatalogSnapshotJson] [nvarchar](max) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[IssuedOn] [date] NOT NULL,
	[Notes] [nvarchar](2000) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[Status] [varchar](20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[ExpiresAt] [datetime2](3) NOT NULL,
	[ClaimToken] [uniqueidentifier] NULL,
	[SubmittedAt] [datetime2](3) NULL,
	[ReviewerReference] [nvarchar](128) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[ReviewerName] [nvarchar](150) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[ReviewerSource] [varchar](20) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[ReviewReason] [nvarchar](2000) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[VerificationMethod] [varchar](32) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[ReviewedAt] [datetime2](3) NULL,
	[CreatedAt] [datetime2](3) NOT NULL,
	[UpdatedAt] [datetime2](3) NOT NULL,
	[RowVersion] [timestamp] NOT NULL,
	[Cccd] [varchar](12) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[IssuingOrganizationId] [int] NULL,
	[WorkflowHistoryJson] [nvarchar](max) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
PRIMARY KEY CLUSTERED
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [certification].[tmCNTTChungChi](
	[ID] [int] IDENTITY(1,1) NOT NULL,
	[MaCC] [nvarchar](10) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[TenCC] [nvarchar](50) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
 CONSTRAINT [PK_CNTTCatalog] PRIMARY KEY CLUSTERED
(
	[ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY],
 CONSTRAINT [UQ_CNTTCatalog_MaCC] UNIQUE NONCLUSTERED
(
	[MaCC] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [certification].[tmCNTTChungChi_File](
	[Id] [uniqueidentifier] NOT NULL,
	[ApplicationId] [uniqueidentifier] NOT NULL,
	[SubmissionId] [uniqueidentifier] NOT NULL,
	[CertificateId] [int] NOT NULL,
	[Sequence] [int] NOT NULL,
	[ActorReference] [nvarchar](128) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[ActorSource] [varchar](20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[OriginalFileName] [nvarchar](255) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[DeclaredContentType] [varchar](100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[DeclaredSizeBytes] [bigint] NOT NULL,
	[Bucket] [varchar](63) COLLATE Latin1_General_100_BIN2 NOT NULL,
	[ObjectKey] [varchar](512) COLLATE Latin1_General_100_BIN2 NOT NULL,
	[Status] [varchar](20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[ExpiresAt] [datetime2](3) NOT NULL,
	[ClaimToken] [uniqueidentifier] NULL,
	[InspectionJson] [nvarchar](max) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[ReviewJson] [nvarchar](max) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[CreatedAt] [datetime2](3) NOT NULL,
	[UpdatedAt] [datetime2](3) NOT NULL,
	[CompletedAt] [datetime2](3) NULL,
	[RowVersion] [timestamp] NOT NULL,
	[StudentSnapshotJson] [nvarchar](max) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
PRIMARY KEY CLUSTERED
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY],
 CONSTRAINT [UQ_CNTTFile_Object] UNIQUE NONCLUSTERED
(
	[Bucket] ASC,
	[ObjectKey] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [certification].[tmCNTTChungChi_SV](
	[ID] [int] NOT NULL,
	[MaHS] [nvarchar](9) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[MaCC] [nvarchar](10) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[SoHieu] [nvarchar](20) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[SoVaoSo] [nvarchar](30) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[SoNgayQD] [nvarchar](250) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[GhiChu] [nvarchar](250) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[CoSoCapCC] [nvarchar](250) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[NgayCC] [date] NULL,
	[MaHS_SoVaoSo] [nvarchar](100) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
 CONSTRAINT [PK_CNTTStudent] PRIMARY KEY CLUSTERED
(
	[ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [svc_demo].[CauHinh](
	[MaCauHinh] [varchar](60) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[GiaTri] [nvarchar](1000) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[NgayDongBo] [datetime2](3) NOT NULL,
 CONSTRAINT [PK__Setting__01E719ACD03E1CDB] PRIMARY KEY CLUSTERED
(
	[MaCauHinh] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [svc_demo].[ChongGuiTrung](
	[ID] [bigint] IDENTITY(1,1) NOT NULL,
	[MaHS] [nvarchar](40) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[MaThaoTac] [nvarchar](100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[MaBamNoiDung] [varchar](64) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[IDDon] [uniqueidentifier] NOT NULL,
	[NgayLap] [datetime2](3) NOT NULL,
 CONSTRAINT [PK__CommandR__3214EC0721EE02F1] PRIMARY KEY CLUSTERED
(
	[ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY],
 CONSTRAINT [UQ_DemoReceipt] UNIQUE NONCLUSTERED
(
	[MaHS] ASC,
	[MaThaoTac] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [svc_demo].[DangNhapChuyenVien](
	[MaHS] [nvarchar](40) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[TenDangNhap] [varchar](64) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[MatKhauBam] [varchar](200) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[NgayTao] [datetime2](3) NOT NULL,
 CONSTRAINT [PK__DangNhap__2725A6EFB17F1429] PRIMARY KEY CLUSTERED
(
	[MaHS] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY],
 CONSTRAINT [UQ__DangNhap__55F68FC0D1C24B44] UNIQUE NONCLUSTERED
(
	[TenDangNhap] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [svc_demo].[DeNghiEmail](
	[ID] [uniqueidentifier] NOT NULL,
	[MaEmail] [nvarchar](10) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[LoaiHoTro] [varchar](30) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[NoiDungDeNghi] [nvarchar](2000) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[EmailLienHe] [nvarchar](254) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[XacNhanChuTaiKhoan] [bit] NOT NULL,
 CONSTRAINT [PK__AccountS__33A8517A4D34385F] PRIMARY KEY CLUSTERED
(
	[ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [svc_demo].[DeNghiVanBan](
	[ID] [uniqueidentifier] NOT NULL,
	[IDCode] [nvarchar](12) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[MaVanban] [nvarchar](2) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[SoLuong] [int] NOT NULL,
	[TTbosung] [nvarchar](2000) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[HocKy] [nvarchar](12) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[NamHoc] [nvarchar](9) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[LePhi] [decimal](18, 2) NOT NULL,
	[MienPhi] [bit] NOT NULL,
	[Khan] [bit] NOT NULL,
	[ThanhTien]  AS (CONVERT([decimal](18,2),[SoLuong]*[LePhi])),
 CONSTRAINT [PK__Document__33A8517AC879172A] PRIMARY KEY CLUSTERED
(
	[ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [svc_demo].[DonDeNghi](
	[ID] [uniqueidentifier] NOT NULL,
	[STT] [bigint] IDENTITY(1,1) NOT NULL,
	[MaHS] [nvarchar](40) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[LoaiDon] [varchar](20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[MaDV] [varchar](20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[TrangThai] [varchar](30) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[IDCode] [nvarchar](12) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[MaCBND] [nvarchar](40) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[NgayDeNghi] [datetime2](3) NOT NULL,
	[NgayCapNhat] [datetime2](3) NOT NULL,
	[NgayNhanDon] [datetime2](3) NULL,
	[NgayHoanTat] [datetime2](3) NULL,
	[TruongPhanHoi] [nvarchar](2000) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[KetQuaXuLy] [nvarchar](2000) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[VaiTroNguoiHuy] [varchar](20) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[NguoiHuy] [nvarchar](40) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[LyDoHuy] [nvarchar](2000) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[NgayHuy] [datetime2](3) NULL,
	[PhienBan] [int] NOT NULL,
	[NgayIn] [datetime2](3) NULL,
	[NgayHenTra] [datetime2](3) NULL,
	[NoiTraHS] [nvarchar](500) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[ngaytraHS] [datetime2](3) NULL,
	[NgayXuLy] [datetime2](3) NULL,
	[NgayInGanNhat] [datetime2](3) NULL,
	[QuyTacHenTra] [varchar](40) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
 CONSTRAINT [PK__Request__3214EC07ABBB7D63] PRIMARY KEY CLUSTERED
(
	[ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY],
 CONSTRAINT [UQ__Request__78A1A19DE8765522] UNIQUE NONCLUSTERED
(
	[STT] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [svc_demo].[His_InDon](
	[ID] [uniqueidentifier] NOT NULL,
	[LyDoDeNghi] [nvarchar](60) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[ThongTinThayDoiThe] [nvarchar](2000) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[HocKyDuKienTotNghiep] [nvarchar](60) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[HocKyHoanTotNghiep] [nvarchar](60) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[HocKyXetHocBong] [nvarchar](60) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[LyDo] [nvarchar](2000) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[MaNganhTQ] [nvarchar](60) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[HocKyBatDau] [nvarchar](60) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[NoiDungTrinhBay] [nvarchar](2000) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
 CONSTRAINT [PK__His_InDo__3214EC2740883696] PRIMARY KEY CLUSTERED
(
	[ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [svc_demo].[KetQuaHocTapHocKy](
	[MaHS] [nvarchar](40) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[IDCode] [nvarchar](12) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[ThuTu] [int] NOT NULL,
	[TenKH] [nvarchar](150) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[SoTinChi] [decimal](10, 2) NULL,
	[SoTinChiHocLai] [decimal](10, 2) NULL,
	[DiemTBCHB] [decimal](10, 2) NULL,
	[DiemTBC] [decimal](10, 2) NULL,
	[DiemTBCTL] [decimal](10, 2) NULL,
	[CoDiemDuoi5] [nvarchar](20) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[DiemRL] [decimal](10, 2) NULL,
 CONSTRAINT [PK__KetQuaHo__A461C6EED552F62D] PRIMARY KEY CLUSTERED
(
	[MaHS] ASC,
	[IDCode] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [svc_demo].[LichSuNoiDungDon](
	[ID] [bigint] IDENTITY(1,1) NOT NULL,
	[IDDon] [uniqueidentifier] NOT NULL,
	[LanBoSung] [int] NOT NULL,
	[NguoiLap] [nvarchar](40) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[NgayLap] [datetime2](3) NOT NULL,
	[LoaiDon] [varchar](20) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[LyDoDeNghi] [nvarchar](60) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[ThongTinThayDoiThe] [nvarchar](2000) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[HocKyDuKienTotNghiep] [nvarchar](60) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[HocKyHoanTotNghiep] [nvarchar](60) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[HocKyXetHocBong] [nvarchar](60) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[LyDo] [nvarchar](2000) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[MaNganhTQ] [nvarchar](60) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[HocKyBatDau] [nvarchar](60) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[NoiDungTrinhBay] [nvarchar](2000) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[MaVanban] [nvarchar](60) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[TTbosung] [nvarchar](2000) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[SoLuong] [int] NULL,
	[MienPhi] [bit] NULL,
	[Khan] [bit] NULL,
	[HocKy] [nvarchar](60) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[NamHoc] [nvarchar](60) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[MaEmail] [nvarchar](60) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[LoaiHoTro] [nvarchar](60) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[NoiDungDeNghi] [nvarchar](2000) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[EmailLienHe] [nvarchar](254) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[XacNhanChuTaiKhoan] [bit] NULL,
 CONSTRAINT [PK__RequestR__3214EC0766738F8A] PRIMARY KEY CLUSTERED
(
	[ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY],
 CONSTRAINT [UQ_DemoRevision] UNIQUE NONCLUSTERED
(
	[IDDon] ASC,
	[LanBoSung] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [svc_demo].[LichSuPhanQuyen](
	[ID] [bigint] IDENTITY(1,1) NOT NULL,
	[MaNguoiCap] [nvarchar](40) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[MaChuyenVien] [nvarchar](40) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[MaCongViec] [varchar](60) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[DuocXuLy] [bit] NOT NULL,
	[NgayCap] [datetime2](3) NOT NULL,
 CONSTRAINT [PK__LichSuPh__3214EC272062C6B2] PRIMARY KEY CLUSTERED
(
	[ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [svc_demo].[LichSuRBAC](
	[ID] [bigint] IDENTITY(1,1) NOT NULL,
	[MaNguoiThucHien] [nvarchar](40) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[ThaoTac] [varchar](30) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[MaRole] [varchar](64) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[MaTaiKhoan] [nvarchar](40) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[MoTa] [nvarchar](2000) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[NgayLap] [datetime2](3) NOT NULL,
 CONSTRAINT [PK__LichSuRB__3214EC274BF86DA9] PRIMARY KEY CLUSTERED
(
	[ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [svc_demo].[LichSuTruongDuLieu](
	[IDLichSu] [bigint] NOT NULL,
	[TenTruong] [nvarchar](60) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[LoaiThayDoi] [varchar](30) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
 CONSTRAINT [PK__LichSuTr__656449C94BB72B7B] PRIMARY KEY CLUSTERED
(
	[IDLichSu] ASC,
	[TenTruong] ASC,
	[LoaiThayDoi] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [svc_demo].[LichSuXuLyDon](
	[ID] [bigint] IDENTITY(1,1) NOT NULL,
	[IDDon] [uniqueidentifier] NOT NULL,
	[MaHS] [nvarchar](40) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[VaiTro] [varchar](20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[ThaoTac] [varchar](40) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[TrangThaiTruoc] [varchar](30) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[TrangThaiSau] [varchar](30) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[NoiDung] [nvarchar](2000) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[NgayLap] [datetime2](3) NOT NULL,
	[MaLyDoHuy] [varchar](40) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[LyDoMau] [nvarchar](2000) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[NoiDungThem] [nvarchar](2000) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[NgayXuLy] [datetime2](3) NULL,
	[NgayHenTra] [datetime2](3) NULL,
	[NoiTraHS] [nvarchar](500) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[QuyTacHenTra] [varchar](40) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[MaCBTruoc] [nvarchar](40) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[MaCBSau] [nvarchar](40) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[LyDoBanGiao] [nvarchar](2000) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[NgayIn] [datetime2](3) NULL,
 CONSTRAINT [PK__RequestE__3214EC07C286FA18] PRIMARY KEY CLUSTERED
(
	[ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [svc_demo].[LoaiDon](
	[MaLoaiDon] [varchar](20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[TenLoaiDon] [nvarchar](250) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[Nhom] [varchar](30) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[MaDV] [varchar](20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[CachNop] [varchar](20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[MaMauDuLieu] [varchar](30) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[MaMauIn] [varchar](30) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[BieuTuong] [varchar](30) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[MoTa] [nvarchar](1000) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[HieuLuc] [bit] NOT NULL,
	[ThuTu] [int] NOT NULL,
PRIMARY KEY CLUSTERED
(
	[MaLoaiDon] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [svc_demo].[NhanThan](
	[MaHS] [nvarchar](40) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[NgayCapNhat] [datetime2](3) NOT NULL,
	[Hoten] [nvarchar](150) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[SoThe] [nvarchar](30) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[Lop] [nvarchar](60) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[NgaySinh] [date] NULL,
	[SoCCCD] [nvarchar](30) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[DienThoai] [nvarchar](30) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[NoiSinh] [nvarchar](200) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[GioiTinh] [nvarchar](20) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[DanToc] [nvarchar](60) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[TenNganhTQ] [nvarchar](500) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[LoaiAnh] [varchar](20) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[AnhSinhVien] [varbinary](max) NULL,
	[NguonDuLieu] [varchar](40) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
	[DuLieuThuNghiem] [bit] NOT NULL,
	[TongTinChiChuongTrinh] [decimal](10, 2) NULL,
	[TinChiTichLuy] [decimal](10, 2) NULL,
	[DiemTBCTL] [decimal](10, 2) NULL,
	[DiemTBRL] [decimal](10, 2) NULL,
 CONSTRAINT [PK__StudentP__57B3EA4BC567A88E] PRIMARY KEY CLUSTERED
(
	[MaHS] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [svc_demo].[PhienBanVaiTro](
	[MaRole] [varchar](64) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[PhienBan] [int] NOT NULL,
	[TenRole] [nvarchar](150) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[MoTa] [nvarchar](1000) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[HieuLuc] [bit] NOT NULL,
	[NguoiSua] [nvarchar](40) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[NgayLuu] [datetime2](3) NOT NULL,
 CONSTRAINT [PK__PhienBan__947B9E85A35BBF35] PRIMARY KEY CLUSTERED
(
	[MaRole] ASC,
	[PhienBan] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [svc_demo].[PhienBanVaiTroQuyen](
	[MaRole] [varchar](64) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[PhienBan] [int] NOT NULL,
	[MaQuyen] [varchar](100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
 CONSTRAINT [PK__PhienBan__4166D5FBEE24604F] PRIMARY KEY CLUSTERED
(
	[MaRole] ASC,
	[PhienBan] ASC,
	[MaQuyen] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [svc_demo].[QuyenRBAC](
	[MaQuyen] [varchar](100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[TenQuyen] [nvarchar](250) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[Nhom] [nvarchar](100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
 CONSTRAINT [PK__QuyenRBA__1D4B7ED41FBFF9B0] PRIMARY KEY CLUSTERED
(
	[MaQuyen] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [svc_demo].[QuyenXuLy](
	[MaHS] [nvarchar](40) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[MaCongViec] [varchar](60) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[QuyenNhanDon] [bit] NOT NULL,
	[QuyenXuLy] [bit] NOT NULL,
	[NgayCap] [datetime2](3) NOT NULL,
	[NguoiCap] [nvarchar](40) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
 CONSTRAINT [PK_QuyenXuLy] PRIMARY KEY CLUSTERED
(
	[MaHS] ASC,
	[MaCongViec] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [svc_demo].[Sys_Email](
	[MaEmail] [nvarchar](10) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[TenDenghi] [nvarchar](255) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[HieuLuc] [bit] NOT NULL,
	[NgayDongBo] [datetime2](3) NOT NULL,
 CONSTRAINT [PK__SupportT__A25C5AA6D5C13B5B] PRIMARY KEY CLUSTERED
(
	[MaEmail] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [svc_demo].[Sys_VanBan](
	[IDCode] [nvarchar](12) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[MaVanBan] [nvarchar](2) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[ID] [int] NULL,
	[TenVanBan] [nvarchar](500) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[MaDVcap] [varchar](20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[ThongTinDinhKem] [nvarchar](2000) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[LePhiThuong] [decimal](18, 2) NULL,
	[LePhiNhanh] [decimal](18, 2) NULL,
	[KhongMienPhi] [bit] NULL,
	[SoLuongMien_Ngay] [int] NULL,
	[KhongCapNeuKhongHoc] [bit] NOT NULL,
	[HieuLuc] [bit] NOT NULL,
	[NgayDongBo] [datetime2](3) NOT NULL,
 CONSTRAINT [PK_DemoDocumentType] PRIMARY KEY CLUSTERED
(
	[IDCode] ASC,
	[MaVanBan] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [svc_demo].[TaiKhoanVaiTro](
	[MaHS] [nvarchar](40) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[MaRole] [varchar](64) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[NguoiGan] [nvarchar](40) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[NgayGan] [datetime2](3) NOT NULL,
 CONSTRAINT [PK__TaiKhoan__E7463CE095A2EF78] PRIMARY KEY CLUSTERED
(
	[MaHS] ASC,
	[MaRole] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [svc_demo].[tmKehoach](
	[IDCode] [nvarchar](12) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[TenKH] [nvarchar](150) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[ThuTu] [int] NOT NULL,
	[Hientai] [bit] NOT NULL,
	[NgayDongBo] [datetime2](3) NOT NULL,
 CONSTRAINT [PK__Academic__A25C5AA6DFBDE60A] PRIMARY KEY CLUSTERED
(
	[IDCode] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [svc_demo].[tmNganhTQ](
	[MaNganhTQ] [nvarchar](60) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[TenNganhTQ] [nvarchar](500) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[HieuLuc] [bit] NOT NULL,
	[NgayDongBo] [datetime2](3) NOT NULL,
 CONSTRAINT [PK__ProgramF__A25C5AA620BC0454] PRIMARY KEY CLUSTERED
(
	[MaNganhTQ] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [svc_demo].[TruongCanBoSung](
	[IDDon] [uniqueidentifier] NOT NULL,
	[TenTruong] [nvarchar](60) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
 CONSTRAINT [PK__TruongCa__697DC53DFFCF6272] PRIMARY KEY CLUSTERED
(
	[IDDon] ASC,
	[TenTruong] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [svc_demo].[TruongLoaiDon](
	[MaLoaiDon] [varchar](20) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[TenTruong] [varchar](60) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[BatBuoc] [bit] NOT NULL,
	[ThuTu] [int] NOT NULL,
PRIMARY KEY CLUSTERED
(
	[MaLoaiDon] ASC,
	[TenTruong] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [svc_demo].[VaiTroQuyen](
	[MaRole] [varchar](64) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[MaQuyen] [varchar](100) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
 CONSTRAINT [PK__VaiTroQu__57ED17108279E5DA] PRIMARY KEY CLUSTERED
(
	[MaRole] ASC,
	[MaQuyen] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [svc_demo].[VaiTroRBAC](
	[MaRole] [varchar](64) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[TenRole] [nvarchar](150) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[MoTa] [nvarchar](1000) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
	[HieuLuc] [bit] NOT NULL,
	[PhienBan] [int] NOT NULL,
	[NgayTao] [datetime2](3) NOT NULL,
	[NgayCapNhat] [datetime2](3) NOT NULL,
	[NguoiTao] [nvarchar](40) COLLATE SQL_Latin1_General_CP1_CI_AS NOT NULL,
 CONSTRAINT [PK__VaiTroRB__0639A0FDA29BB627] PRIMARY KEY CLUSTERED
(
	[MaRole] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY],
 CONSTRAINT [UQ__VaiTroRB__37A723F36FF81789] UNIQUE NONCLUSTERED
(
	[TenRole] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]

GO
CREATE NONCLUSTERED INDEX [IX_AcademicLeave_History] ON [academic_leave].[ApplicationHistory]
(
	[ApplicationId] ASC,
	[Id] DESC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
CREATE NONCLUSTERED INDEX [IX_AcademicLeave_Queue] ON [academic_leave].[Applications]
(
	[Status] ASC,
	[StudentConfirmedAt] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
CREATE NONCLUSTERED INDEX [IX_AcademicLeave_Student] ON [academic_leave].[Applications]
(
	[StudentCode] ASC,
	[CreatedAt] DESC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_AcademicLeave_OpenStudent] ON [academic_leave].[Applications]
(
	[StudentCode] ASC
)
WHERE ([Status] IN ('draft', 'submitted', 'needs_changes'))
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_AcademicLeave_Parent] ON [academic_leave].[Applications]
(
	[ParentApplicationId] ASC
)
WHERE ([ParentApplicationId] IS NOT NULL AND [Status]<>'cancelled' AND [Status]<>'rejected' AND [Status]<>'failed')
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_AcademicLeave_StudentSequence] ON [academic_leave].[Applications]
(
	[StudentCode] ASC,
	[StudentSequence] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_AuthStaffProfile] ON [auth].[AccountProfiles]
(
	[StaffAccountId] ASC
)
WHERE ([StaffAccountId] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [IX_CertLevels_Type] ON [certification].[CertificateLevels]
(
	[CertificateTypeId] ASC,
	[SortOrder] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_CertLevels_Code] ON [certification].[CertificateLevels]
(
	[Code] ASC
)
WHERE ([Code] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_CertLevels_SchoolId] ON [certification].[CertificateLevels]
(
	[SchoolId] ASC
)
WHERE ([SchoolId] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [IX_CertTypes_Language] ON [certification].[CertificateTypes]
(
	[LanguageId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_CertTypes_SchoolId] ON [certification].[CertificateTypes]
(
	[SchoolId] ASC
)
WHERE ([SchoolId] IS NOT NULL)
WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
CREATE UNIQUE NONCLUSTERED INDEX [UX_CertFiles_Certificate] ON [certification].[EvidenceFiles]
(
	[CertificateId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [IX_CertPolicies_Language] ON [certification].[RecognitionPolicies]
(
	[LanguageId] ASC,
	[CohortFrom] ASC,
	[CohortTo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [IX_CertPolicies_Type] ON [certification].[RecognitionPolicies]
(
	[CertificateTypeId] ASC,
	[CohortFrom] ASC,
	[CohortTo] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
CREATE NONCLUSTERED INDEX [IX_CertStudent_Owner] ON [certification].[StudentCertificates]
(
	[ActorSource] ASC,
	[ActorReference] ASC,
	[CreatedAt] DESC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
CREATE NONCLUSTERED INDEX [IX_CertStudent_Queue] ON [certification].[StudentCertificates]
(
	[Status] ASC,
	[CreatedAt] DESC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [IX_CNTTFile_Application] ON [certification].[tmCNTTChungChi_File]
(
	[ApplicationId] ASC,
	[Sequence] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
CREATE NONCLUSTERED INDEX [IX_CNTTFile_Certificate] ON [certification].[tmCNTTChungChi_File]
(
	[CertificateId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
SET ANSI_PADDING ON

GO
CREATE NONCLUSTERED INDEX [IX_CNTTStudent_MaCC] ON [certification].[tmCNTTChungChi_SV]
(
	[MaCC] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, DROP_EXISTING = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
GO
ALTER TABLE [academic_leave].[ApplicationHistory] ADD  CONSTRAINT [DF_AcademicLeave_HistoryCreated]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [academic_leave].[Applications] ADD  CONSTRAINT [DF_AcademicLeave_Content]  DEFAULT (N'') FOR [Content]
GO
ALTER TABLE [academic_leave].[Applications] ADD  CONSTRAINT [DF_AcademicLeave_Status]  DEFAULT ('draft') FOR [Status]
GO
ALTER TABLE [academic_leave].[Applications] ADD  CONSTRAINT [DF_AcademicLeave_Created]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [academic_leave].[Applications] ADD  CONSTRAINT [DF_AcademicLeave_Updated]  DEFAULT (sysutcdatetime()) FOR [UpdatedAt]
GO
ALTER TABLE [auth].[AccountProfiles] ADD  DEFAULT ((1)) FOR [Revision]
GO
ALTER TABLE [auth].[AccountSecurityEvents] ADD  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [auth].[Fields] ADD  DEFAULT ((1)) FOR [IsActive]
GO
ALTER TABLE [auth].[LocalAccounts] ADD  CONSTRAINT [DF_AuthActive]  DEFAULT ((1)) FOR [IsActive]
GO
ALTER TABLE [auth].[LocalAccounts] ADD  CONSTRAINT [DF_AuthCreated]  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [auth].[PermissionDefinitions] ADD  DEFAULT ((1)) FOR [IsActive]
GO
ALTER TABLE [auth].[RoleDefinitions] ADD  DEFAULT (N'') FOR [Description]
GO
ALTER TABLE [auth].[RoleDefinitions] ADD  DEFAULT ((1)) FOR [IsActive]
GO
ALTER TABLE [auth].[RoleDefinitions] ADD  DEFAULT ((1)) FOR [Revision]
GO
ALTER TABLE [auth].[Tasks] ADD  DEFAULT ((1)) FOR [IsActive]
GO
ALTER TABLE [certification].[CertificateLevels] ADD  DEFAULT ((0)) FOR [IsSchoolProvided]
GO
ALTER TABLE [certification].[CertificateLevels] ADD  DEFAULT ((1)) FOR [SortOrder]
GO
ALTER TABLE [certification].[CertificateTypeIssuers] ADD  DEFAULT ((1)) FOR [IsActive]
GO
ALTER TABLE [certification].[CertificateTypes] ADD  DEFAULT ((0)) FOR [IsPublished]
GO
ALTER TABLE [certification].[CertificateTypes] ADD  DEFAULT ((0)) FOR [IsSchoolProvided]
GO
ALTER TABLE [certification].[CertificateTypes] ADD  DEFAULT ((1)) FOR [Revision]
GO
ALTER TABLE [certification].[CertificateTypes] ADD  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [certification].[CertificateTypes] ADD  DEFAULT (sysutcdatetime()) FOR [UpdatedAt]
GO
ALTER TABLE [certification].[EvidenceFiles] ADD  DEFAULT ('pending') FOR [Status]
GO
ALTER TABLE [certification].[EvidenceFiles] ADD  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [certification].[IssuingOrganizations] ADD  DEFAULT ((1)) FOR [IsActive]
GO
ALTER TABLE [certification].[IssuingOrganizations] ADD  DEFAULT ((1)) FOR [Revision]
GO
ALTER TABLE [certification].[IssuingOrganizations] ADD  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [certification].[IssuingOrganizations] ADD  DEFAULT (sysutcdatetime()) FOR [UpdatedAt]
GO
ALTER TABLE [certification].[Languages] ADD  DEFAULT ((0)) FOR [IsPublished]
GO
ALTER TABLE [certification].[Languages] ADD  DEFAULT ((0)) FOR [IsSchoolProvided]
GO
ALTER TABLE [certification].[Languages] ADD  DEFAULT ((1)) FOR [Revision]
GO
ALTER TABLE [certification].[Languages] ADD  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [certification].[Languages] ADD  DEFAULT (sysutcdatetime()) FOR [UpdatedAt]
GO
ALTER TABLE [certification].[RecognitionPolicies] ADD  DEFAULT ((1)) FOR [Revision]
GO
ALTER TABLE [certification].[RecognitionPolicies] ADD  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [certification].[RecognitionPolicies] ADD  DEFAULT (sysutcdatetime()) FOR [UpdatedAt]
GO
ALTER TABLE [certification].[StudentCertificates] ADD  DEFAULT ('uploading') FOR [Status]
GO
ALTER TABLE [certification].[StudentCertificates] ADD  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [certification].[StudentCertificates] ADD  DEFAULT (sysutcdatetime()) FOR [UpdatedAt]
GO
ALTER TABLE [certification].[StudentCertificates] ADD  CONSTRAINT [DF_Certification_WorkflowHistory]  DEFAULT (N'[]') FOR [WorkflowHistoryJson]
GO
ALTER TABLE [certification].[tmCNTTChungChi_File] ADD  DEFAULT ('pending') FOR [Status]
GO
ALTER TABLE [certification].[tmCNTTChungChi_File] ADD  DEFAULT (sysutcdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [certification].[tmCNTTChungChi_File] ADD  DEFAULT (sysutcdatetime()) FOR [UpdatedAt]
GO
ALTER TABLE [svc_demo].[CauHinh] ADD  DEFAULT (sysutcdatetime()) FOR [NgayDongBo]
GO
ALTER TABLE [svc_demo].[ChongGuiTrung] ADD  DEFAULT (sysutcdatetime()) FOR [NgayLap]
GO
ALTER TABLE [svc_demo].[DangNhapChuyenVien] ADD  DEFAULT (sysutcdatetime()) FOR [NgayTao]
GO
ALTER TABLE [svc_demo].[DeNghiVanBan] ADD  DEFAULT ((0)) FOR [MienPhi]
GO
ALTER TABLE [svc_demo].[DeNghiVanBan] ADD  DEFAULT ((0)) FOR [Khan]
GO
ALTER TABLE [svc_demo].[DonDeNghi] ADD  DEFAULT (sysutcdatetime()) FOR [NgayDeNghi]
GO
ALTER TABLE [svc_demo].[DonDeNghi] ADD  DEFAULT (sysutcdatetime()) FOR [NgayCapNhat]
GO
ALTER TABLE [svc_demo].[DonDeNghi] ADD  DEFAULT ((1)) FOR [PhienBan]
GO
ALTER TABLE [svc_demo].[LichSuNoiDungDon] ADD  DEFAULT (sysutcdatetime()) FOR [NgayLap]
GO
ALTER TABLE [svc_demo].[LichSuPhanQuyen] ADD  DEFAULT (sysutcdatetime()) FOR [NgayCap]
GO
ALTER TABLE [svc_demo].[LichSuRBAC] ADD  DEFAULT (sysutcdatetime()) FOR [NgayLap]
GO
ALTER TABLE [svc_demo].[LichSuXuLyDon] ADD  DEFAULT (sysutcdatetime()) FOR [NgayLap]
GO
ALTER TABLE [svc_demo].[LoaiDon] ADD  DEFAULT ('file') FOR [BieuTuong]
GO
ALTER TABLE [svc_demo].[LoaiDon] ADD  DEFAULT ((1)) FOR [HieuLuc]
GO
ALTER TABLE [svc_demo].[LoaiDon] ADD  DEFAULT ((0)) FOR [ThuTu]
GO
ALTER TABLE [svc_demo].[NhanThan] ADD  DEFAULT (sysutcdatetime()) FOR [NgayCapNhat]
GO
ALTER TABLE [svc_demo].[NhanThan] ADD  DEFAULT ((1)) FOR [DuLieuThuNghiem]
GO
ALTER TABLE [svc_demo].[PhienBanVaiTro] ADD  DEFAULT (sysutcdatetime()) FOR [NgayLuu]
GO
ALTER TABLE [svc_demo].[QuyenXuLy] ADD  DEFAULT (sysutcdatetime()) FOR [NgayCap]
GO
ALTER TABLE [svc_demo].[Sys_Email] ADD  DEFAULT (sysutcdatetime()) FOR [NgayDongBo]
GO
ALTER TABLE [svc_demo].[Sys_VanBan] ADD  DEFAULT ((1)) FOR [HieuLuc]
GO
ALTER TABLE [svc_demo].[Sys_VanBan] ADD  DEFAULT (sysutcdatetime()) FOR [NgayDongBo]
GO
ALTER TABLE [svc_demo].[TaiKhoan] ADD  DEFAULT ((1)) FOR [HieuLuc]
GO
ALTER TABLE [svc_demo].[TaiKhoan] ADD  DEFAULT ((1)) FOR [PhienBanQuyen]
GO
ALTER TABLE [svc_demo].[TaiKhoan] ADD  DEFAULT ('DEMO') FOR [NguonDanhTinh]
GO
ALTER TABLE [svc_demo].[TaiKhoanVaiTro] ADD  DEFAULT (sysutcdatetime()) FOR [NgayGan]
GO
ALTER TABLE [svc_demo].[tmKehoach] ADD  DEFAULT ((0)) FOR [Hientai]
GO
ALTER TABLE [svc_demo].[tmKehoach] ADD  DEFAULT (sysutcdatetime()) FOR [NgayDongBo]
GO
ALTER TABLE [svc_demo].[tmNganhTQ] ADD  DEFAULT ((0)) FOR [HieuLuc]
GO
ALTER TABLE [svc_demo].[tmNganhTQ] ADD  DEFAULT (sysutcdatetime()) FOR [NgayDongBo]
GO
ALTER TABLE [svc_demo].[TruongLoaiDon] ADD  DEFAULT ((0)) FOR [BatBuoc]
GO
ALTER TABLE [svc_demo].[VaiTroRBAC] ADD  DEFAULT ((1)) FOR [HieuLuc]
GO
ALTER TABLE [svc_demo].[VaiTroRBAC] ADD  DEFAULT ((1)) FOR [PhienBan]
GO
ALTER TABLE [svc_demo].[VaiTroRBAC] ADD  DEFAULT (sysutcdatetime()) FOR [NgayTao]
GO
ALTER TABLE [svc_demo].[VaiTroRBAC] ADD  DEFAULT (sysutcdatetime()) FOR [NgayCapNhat]
GO
ALTER TABLE [academic_leave].[ApplicationHistory]  WITH CHECK ADD  CONSTRAINT [FK_AcademicLeave_History] FOREIGN KEY([ApplicationId])
REFERENCES [academic_leave].[Applications] ([Id])
GO
ALTER TABLE [academic_leave].[ApplicationHistory] CHECK CONSTRAINT [FK_AcademicLeave_History]
GO
ALTER TABLE [academic_leave].[Applications]  WITH CHECK ADD  CONSTRAINT [FK_AcademicLeave_Parent] FOREIGN KEY([ParentApplicationId], [StudentCode])
REFERENCES [academic_leave].[Applications] ([Id], [StudentCode])
GO
ALTER TABLE [academic_leave].[Applications] CHECK CONSTRAINT [FK_AcademicLeave_Parent]
GO
ALTER TABLE [auth].[AccountPermissions]  WITH CHECK ADD FOREIGN KEY([AccountId])
REFERENCES [auth].[LocalAccounts] ([Id])
ON DELETE CASCADE
GO
ALTER TABLE [auth].[AccountPermissions]  WITH CHECK ADD FOREIGN KEY([PermissionName])
REFERENCES [auth].[Permissions] ([PermissionName])
GO
ALTER TABLE [auth].[AccountProfiles]  WITH CHECK ADD FOREIGN KEY([AccountId])
REFERENCES [auth].[LocalAccounts] ([Id])
GO
ALTER TABLE [auth].[AccountProfiles]  WITH CHECK ADD FOREIGN KEY([FieldCode])
REFERENCES [auth].[Fields] ([FieldCode])
GO
ALTER TABLE [auth].[AccountProfiles]  WITH CHECK ADD FOREIGN KEY([StaffAccountId])
REFERENCES [svc_demo].[TaiKhoan] ([MaHS])
GO
ALTER TABLE [auth].[AccountRoles]  WITH CHECK ADD FOREIGN KEY([AccountId])
REFERENCES [auth].[LocalAccounts] ([Id])
ON DELETE CASCADE
GO
ALTER TABLE [auth].[AccountRoles]  WITH CHECK ADD FOREIGN KEY([RoleName])
REFERENCES [auth].[Roles] ([RoleName])
GO
ALTER TABLE [auth].[AccountSecurityEvents]  WITH CHECK ADD FOREIGN KEY([ActorId])
REFERENCES [auth].[LocalAccounts] ([Id])
GO
ALTER TABLE [auth].[AccountSecurityEvents]  WITH CHECK ADD FOREIGN KEY([TargetId])
REFERENCES [auth].[LocalAccounts] ([Id])
GO
ALTER TABLE [auth].[AccountTasks]  WITH CHECK ADD FOREIGN KEY([AccountId], [FieldCode])
REFERENCES [auth].[AccountProfiles] ([AccountId], [FieldCode])
GO
ALTER TABLE [auth].[AccountTasks]  WITH CHECK ADD FOREIGN KEY([TaskId], [FieldCode])
REFERENCES [auth].[Tasks] ([TaskId], [FieldCode])
GO
ALTER TABLE [auth].[PermissionDefinitions]  WITH CHECK ADD FOREIGN KEY([FieldCode])
REFERENCES [auth].[Fields] ([FieldCode])
GO
ALTER TABLE [auth].[PermissionDefinitions]  WITH CHECK ADD FOREIGN KEY([PermissionName])
REFERENCES [auth].[Permissions] ([PermissionName])
GO
ALTER TABLE [auth].[PermissionDefinitions]  WITH CHECK ADD FOREIGN KEY([TaskId])
REFERENCES [auth].[Tasks] ([TaskId])
GO
ALTER TABLE [auth].[RoleDefinitions]  WITH CHECK ADD FOREIGN KEY([FieldCode])
REFERENCES [auth].[Fields] ([FieldCode])
GO
ALTER TABLE [auth].[RoleDefinitions]  WITH CHECK ADD FOREIGN KEY([RoleName])
REFERENCES [auth].[Roles] ([RoleName])
GO
ALTER TABLE [auth].[RolePermissions]  WITH CHECK ADD FOREIGN KEY([PermissionName])
REFERENCES [auth].[Permissions] ([PermissionName])
GO
ALTER TABLE [auth].[RolePermissions]  WITH CHECK ADD FOREIGN KEY([RoleName])
REFERENCES [auth].[Roles] ([RoleName])
GO
ALTER TABLE [auth].[TaskPermissions]  WITH CHECK ADD FOREIGN KEY([TaskId])
REFERENCES [auth].[Tasks] ([TaskId])
GO
ALTER TABLE [auth].[Tasks]  WITH CHECK ADD FOREIGN KEY([FieldCode])
REFERENCES [auth].[Fields] ([FieldCode])
GO
ALTER TABLE [certification].[CertificateLevels]  WITH CHECK ADD FOREIGN KEY([CertificateTypeId])
REFERENCES [certification].[CertificateTypes] ([Id])
GO
ALTER TABLE [certification].[CertificateTypeIssuers]  WITH CHECK ADD FOREIGN KEY([CertificateTypeId])
REFERENCES [certification].[CertificateTypes] ([Id])
GO
ALTER TABLE [certification].[CertificateTypeIssuers]  WITH CHECK ADD FOREIGN KEY([IssuingOrganizationId])
REFERENCES [certification].[IssuingOrganizations] ([Id])
GO
ALTER TABLE [certification].[CertificateTypes]  WITH CHECK ADD FOREIGN KEY([BaseCertificateTypeId])
REFERENCES [certification].[CertificateTypes] ([Id])
GO
ALTER TABLE [certification].[CertificateTypes]  WITH CHECK ADD FOREIGN KEY([LanguageId])
REFERENCES [certification].[Languages] ([Id])
GO
ALTER TABLE [certification].[EvidenceFiles]  WITH CHECK ADD FOREIGN KEY([CertificateId])
REFERENCES [certification].[StudentCertificates] ([Id])
GO
ALTER TABLE [certification].[RecognitionPolicies]  WITH CHECK ADD FOREIGN KEY([CertificateTypeId])
REFERENCES [certification].[CertificateTypes] ([Id])
GO
ALTER TABLE [certification].[RecognitionPolicies]  WITH CHECK ADD FOREIGN KEY([LanguageId])
REFERENCES [certification].[Languages] ([Id])
GO
ALTER TABLE [certification].[StudentCertificates]  WITH CHECK ADD FOREIGN KEY([CertificateTypeId])
REFERENCES [certification].[CertificateTypes] ([Id])
GO
ALTER TABLE [certification].[StudentCertificates]  WITH CHECK ADD  CONSTRAINT [FK_Certification_TypeIssuer] FOREIGN KEY([CertificateTypeId], [IssuingOrganizationId])
REFERENCES [certification].[CertificateTypeIssuers] ([CertificateTypeId], [IssuingOrganizationId])
GO
ALTER TABLE [certification].[StudentCertificates] CHECK CONSTRAINT [FK_Certification_TypeIssuer]
GO
ALTER TABLE [certification].[tmCNTTChungChi_File]  WITH CHECK ADD  CONSTRAINT [FK_CNTTFile_Student] FOREIGN KEY([CertificateId])
REFERENCES [certification].[tmCNTTChungChi_SV] ([ID])
GO
ALTER TABLE [certification].[tmCNTTChungChi_File] CHECK CONSTRAINT [FK_CNTTFile_Student]
GO
ALTER TABLE [certification].[tmCNTTChungChi_SV]  WITH CHECK ADD  CONSTRAINT [FK_CNTTStudent_Catalog] FOREIGN KEY([MaCC])
REFERENCES [certification].[tmCNTTChungChi] ([MaCC])
GO
ALTER TABLE [certification].[tmCNTTChungChi_SV] CHECK CONSTRAINT [FK_CNTTStudent_Catalog]
GO
ALTER TABLE [svc_demo].[ChongGuiTrung]  WITH CHECK ADD  CONSTRAINT [FK__CommandRe__Actor__534D60F1] FOREIGN KEY([MaHS])
REFERENCES [svc_demo].[TaiKhoan] ([MaHS])
GO
ALTER TABLE [svc_demo].[ChongGuiTrung] CHECK CONSTRAINT [FK__CommandRe__Actor__534D60F1]
GO
ALTER TABLE [svc_demo].[ChongGuiTrung]  WITH CHECK ADD  CONSTRAINT [FK__CommandRe__Reque__5441852A] FOREIGN KEY([IDDon])
REFERENCES [svc_demo].[DonDeNghi] ([ID])
GO
ALTER TABLE [svc_demo].[ChongGuiTrung] CHECK CONSTRAINT [FK__CommandRe__Reque__5441852A]
GO
ALTER TABLE [svc_demo].[DangNhapChuyenVien]  WITH CHECK ADD  CONSTRAINT [FK__DangNhapCh__MaHS__498EEC8D] FOREIGN KEY([MaHS])
REFERENCES [svc_demo].[TaiKhoan] ([MaHS])
GO
ALTER TABLE [svc_demo].[DangNhapChuyenVien] CHECK CONSTRAINT [FK__DangNhapCh__MaHS__498EEC8D]
GO
ALTER TABLE [svc_demo].[DeNghiEmail]  WITH CHECK ADD  CONSTRAINT [FK__AccountSu__Reque__6B24EA82] FOREIGN KEY([ID])
REFERENCES [svc_demo].[DonDeNghi] ([ID])
GO
ALTER TABLE [svc_demo].[DeNghiEmail] CHECK CONSTRAINT [FK__AccountSu__Reque__6B24EA82]
GO
ALTER TABLE [svc_demo].[DeNghiEmail]  WITH CHECK ADD  CONSTRAINT [FK__AccountSu__Suppo__6C190EBB] FOREIGN KEY([MaEmail])
REFERENCES [svc_demo].[Sys_Email] ([MaEmail])
GO
ALTER TABLE [svc_demo].[DeNghiEmail] CHECK CONSTRAINT [FK__AccountSu__Suppo__6C190EBB]
GO
ALTER TABLE [svc_demo].[DeNghiVanBan]  WITH CHECK ADD  CONSTRAINT [FK__DocumentR__Reque__6383C8BA] FOREIGN KEY([ID])
REFERENCES [svc_demo].[DonDeNghi] ([ID])
GO
ALTER TABLE [svc_demo].[DeNghiVanBan] CHECK CONSTRAINT [FK__DocumentR__Reque__6383C8BA]
GO
ALTER TABLE [svc_demo].[DeNghiVanBan]  WITH CHECK ADD  CONSTRAINT [FK_DemoDocumentCatalog] FOREIGN KEY([IDCode], [MaVanban])
REFERENCES [svc_demo].[Sys_VanBan] ([IDCode], [MaVanBan])
GO
ALTER TABLE [svc_demo].[DeNghiVanBan] CHECK CONSTRAINT [FK_DemoDocumentCatalog]
GO
ALTER TABLE [svc_demo].[DonDeNghi]  WITH CHECK ADD  CONSTRAINT [FK__Request__Assigne__3C69FB99] FOREIGN KEY([MaCBND])
REFERENCES [svc_demo].[TaiKhoan] ([MaHS])
GO
ALTER TABLE [svc_demo].[DonDeNghi] CHECK CONSTRAINT [FK__Request__Assigne__3C69FB99]
GO
ALTER TABLE [svc_demo].[DonDeNghi]  WITH CHECK ADD  CONSTRAINT [FK__Request__Cancell__403A8C7D] FOREIGN KEY([NguoiHuy])
REFERENCES [svc_demo].[TaiKhoan] ([MaHS])
GO
ALTER TABLE [svc_demo].[DonDeNghi] CHECK CONSTRAINT [FK__Request__Cancell__403A8C7D]
GO
ALTER TABLE [svc_demo].[DonDeNghi]  WITH CHECK ADD  CONSTRAINT [FK__Request__Student__34C8D9D1] FOREIGN KEY([MaHS])
REFERENCES [svc_demo].[TaiKhoan] ([MaHS])
GO
ALTER TABLE [svc_demo].[DonDeNghi] CHECK CONSTRAINT [FK__Request__Student__34C8D9D1]
GO
ALTER TABLE [svc_demo].[DonDeNghi]  WITH CHECK ADD  CONSTRAINT [FK__Request__Submitt__3B75D760] FOREIGN KEY([IDCode])
REFERENCES [svc_demo].[tmKehoach] ([IDCode])
GO
ALTER TABLE [svc_demo].[DonDeNghi] CHECK CONSTRAINT [FK__Request__Submitt__3B75D760]
GO
ALTER TABLE [svc_demo].[His_InDon]  WITH CHECK ADD  CONSTRAINT [FK__His_InDon__ID__05D8E0BE] FOREIGN KEY([ID])
REFERENCES [svc_demo].[DonDeNghi] ([ID])
GO
ALTER TABLE [svc_demo].[His_InDon] CHECK CONSTRAINT [FK__His_InDon__ID__05D8E0BE]
GO
ALTER TABLE [svc_demo].[KetQuaHocTapHocKy]  WITH CHECK ADD  CONSTRAINT [FK__KetQuaHocT__MaHS__0E6E26BF] FOREIGN KEY([MaHS])
REFERENCES [svc_demo].[NhanThan] ([MaHS])
GO
ALTER TABLE [svc_demo].[KetQuaHocTapHocKy] CHECK CONSTRAINT [FK__KetQuaHocT__MaHS__0E6E26BF]
GO
ALTER TABLE [svc_demo].[LichSuNoiDungDon]  WITH CHECK ADD  CONSTRAINT [FK__RequestRe__Creat__48CFD27E] FOREIGN KEY([NguoiLap])
REFERENCES [svc_demo].[TaiKhoan] ([MaHS])
GO
ALTER TABLE [svc_demo].[LichSuNoiDungDon] CHECK CONSTRAINT [FK__RequestRe__Creat__48CFD27E]
GO
ALTER TABLE [svc_demo].[LichSuNoiDungDon]  WITH CHECK ADD  CONSTRAINT [FK__RequestRe__Reque__46E78A0C] FOREIGN KEY([IDDon])
REFERENCES [svc_demo].[DonDeNghi] ([ID])
GO
ALTER TABLE [svc_demo].[LichSuNoiDungDon] CHECK CONSTRAINT [FK__RequestRe__Reque__46E78A0C]
GO
ALTER TABLE [svc_demo].[LichSuPhanQuyen]  WITH CHECK ADD  CONSTRAINT [FK__LichSuPha__MaChu__30C33EC3] FOREIGN KEY([MaChuyenVien])
REFERENCES [svc_demo].[TaiKhoan] ([MaHS])
GO
ALTER TABLE [svc_demo].[LichSuPhanQuyen] CHECK CONSTRAINT [FK__LichSuPha__MaChu__30C33EC3]
GO
ALTER TABLE [svc_demo].[LichSuPhanQuyen]  WITH CHECK ADD  CONSTRAINT [FK__LichSuPha__MaNgu__2FCF1A8A] FOREIGN KEY([MaNguoiCap])
REFERENCES [svc_demo].[TaiKhoan] ([MaHS])
GO
ALTER TABLE [svc_demo].[LichSuPhanQuyen] CHECK CONSTRAINT [FK__LichSuPha__MaNgu__2FCF1A8A]
GO
ALTER TABLE [svc_demo].[LichSuRBAC]  WITH CHECK ADD  CONSTRAINT [FK__LichSuRBA__MaNgu__55F4C372] FOREIGN KEY([MaNguoiThucHien])
REFERENCES [svc_demo].[TaiKhoan] ([MaHS])
GO
ALTER TABLE [svc_demo].[LichSuRBAC] CHECK CONSTRAINT [FK__LichSuRBA__MaNgu__55F4C372]
GO
ALTER TABLE [svc_demo].[LichSuTruongDuLieu]  WITH CHECK ADD  CONSTRAINT [FK__LichSuTru__IDLic__0B91BA14] FOREIGN KEY([IDLichSu])
REFERENCES [svc_demo].[LichSuXuLyDon] ([ID])
GO
ALTER TABLE [svc_demo].[LichSuTruongDuLieu] CHECK CONSTRAINT [FK__LichSuTru__IDLic__0B91BA14]
GO
ALTER TABLE [svc_demo].[LichSuXuLyDon]  WITH CHECK ADD  CONSTRAINT [FK__RequestEv__Actor__4D94879B] FOREIGN KEY([MaHS])
REFERENCES [svc_demo].[TaiKhoan] ([MaHS])
GO
ALTER TABLE [svc_demo].[LichSuXuLyDon] CHECK CONSTRAINT [FK__RequestEv__Actor__4D94879B]
GO
ALTER TABLE [svc_demo].[LichSuXuLyDon]  WITH CHECK ADD  CONSTRAINT [FK__RequestEv__Reque__4CA06362] FOREIGN KEY([IDDon])
REFERENCES [svc_demo].[DonDeNghi] ([ID])
GO
ALTER TABLE [svc_demo].[LichSuXuLyDon] CHECK CONSTRAINT [FK__RequestEv__Reque__4CA06362]
GO
ALTER TABLE [svc_demo].[NhanThan]  WITH CHECK ADD  CONSTRAINT [FK__StudentPr__Actor__74AE54BC] FOREIGN KEY([MaHS])
REFERENCES [svc_demo].[TaiKhoan] ([MaHS])
GO
ALTER TABLE [svc_demo].[NhanThan] CHECK CONSTRAINT [FK__StudentPr__Actor__74AE54BC]
GO
ALTER TABLE [svc_demo].[PhienBanVaiTro]  WITH CHECK ADD  CONSTRAINT [FK__PhienBanV__MaRol__4D5F7D71] FOREIGN KEY([MaRole])
REFERENCES [svc_demo].[VaiTroRBAC] ([MaRole])
GO
ALTER TABLE [svc_demo].[PhienBanVaiTro] CHECK CONSTRAINT [FK__PhienBanV__MaRol__4D5F7D71]
GO
ALTER TABLE [svc_demo].[PhienBanVaiTro]  WITH CHECK ADD  CONSTRAINT [FK__PhienBanV__Nguoi__4E53A1AA] FOREIGN KEY([NguoiSua])
REFERENCES [svc_demo].[TaiKhoan] ([MaHS])
GO
ALTER TABLE [svc_demo].[PhienBanVaiTro] CHECK CONSTRAINT [FK__PhienBanV__Nguoi__4E53A1AA]
GO
ALTER TABLE [svc_demo].[PhienBanVaiTroQuyen]  WITH CHECK ADD  CONSTRAINT [FK__PhienBanV__MaQuy__5224328E] FOREIGN KEY([MaQuyen])
REFERENCES [svc_demo].[QuyenRBAC] ([MaQuyen])
GO
ALTER TABLE [svc_demo].[PhienBanVaiTroQuyen] CHECK CONSTRAINT [FK__PhienBanV__MaQuy__5224328E]
GO
ALTER TABLE [svc_demo].[PhienBanVaiTroQuyen]  WITH CHECK ADD  CONSTRAINT [FK__PhienBanVaiTroQu__531856C7] FOREIGN KEY([MaRole], [PhienBan])
REFERENCES [svc_demo].[PhienBanVaiTro] ([MaRole], [PhienBan])
GO
ALTER TABLE [svc_demo].[PhienBanVaiTroQuyen] CHECK CONSTRAINT [FK__PhienBanVaiTroQu__531856C7]
GO
ALTER TABLE [svc_demo].[QuyenXuLy]  WITH CHECK ADD  CONSTRAINT [FK__QuyenXuLy__MaHS__2B0A656D] FOREIGN KEY([MaHS])
REFERENCES [svc_demo].[TaiKhoan] ([MaHS])
GO
ALTER TABLE [svc_demo].[QuyenXuLy] CHECK CONSTRAINT [FK__QuyenXuLy__MaHS__2B0A656D]
GO
ALTER TABLE [svc_demo].[QuyenXuLy]  WITH CHECK ADD  CONSTRAINT [FK__QuyenXuLy__Nguoi__2CF2ADDF] FOREIGN KEY([NguoiCap])
REFERENCES [svc_demo].[TaiKhoan] ([MaHS])
GO
ALTER TABLE [svc_demo].[QuyenXuLy] CHECK CONSTRAINT [FK__QuyenXuLy__Nguoi__2CF2ADDF]
GO
ALTER TABLE [svc_demo].[Sys_VanBan]  WITH CHECK ADD  CONSTRAINT [FK__DocumentT__TermC__5AEE82B9] FOREIGN KEY([IDCode])
REFERENCES [svc_demo].[tmKehoach] ([IDCode])
GO
ALTER TABLE [svc_demo].[Sys_VanBan] CHECK CONSTRAINT [FK__DocumentT__TermC__5AEE82B9]
GO
ALTER TABLE [svc_demo].[TaiKhoanVaiTro]  WITH CHECK ADD  CONSTRAINT [FK__TaiKhoanV__MaRol__43D61337] FOREIGN KEY([MaRole])
REFERENCES [svc_demo].[VaiTroRBAC] ([MaRole])
GO
ALTER TABLE [svc_demo].[TaiKhoanVaiTro] CHECK CONSTRAINT [FK__TaiKhoanV__MaRol__43D61337]
GO
ALTER TABLE [svc_demo].[TaiKhoanVaiTro]  WITH CHECK ADD  CONSTRAINT [FK__TaiKhoanV__Nguoi__44CA3770] FOREIGN KEY([NguoiGan])
REFERENCES [svc_demo].[TaiKhoan] ([MaHS])
GO
ALTER TABLE [svc_demo].[TaiKhoanVaiTro] CHECK CONSTRAINT [FK__TaiKhoanV__Nguoi__44CA3770]
GO
ALTER TABLE [svc_demo].[TaiKhoanVaiTro]  WITH CHECK ADD  CONSTRAINT [FK__TaiKhoanVa__MaHS__42E1EEFE] FOREIGN KEY([MaHS])
REFERENCES [svc_demo].[TaiKhoan] ([MaHS])
GO
ALTER TABLE [svc_demo].[TaiKhoanVaiTro] CHECK CONSTRAINT [FK__TaiKhoanVa__MaHS__42E1EEFE]
GO
ALTER TABLE [svc_demo].[TruongCanBoSung]  WITH CHECK ADD  CONSTRAINT [FK__TruongCan__IDDon__08B54D69] FOREIGN KEY([IDDon])
REFERENCES [svc_demo].[DonDeNghi] ([ID])
GO
ALTER TABLE [svc_demo].[TruongCanBoSung] CHECK CONSTRAINT [FK__TruongCan__IDDon__08B54D69]
GO
ALTER TABLE [svc_demo].[TruongLoaiDon]  WITH CHECK ADD FOREIGN KEY([MaLoaiDon])
REFERENCES [svc_demo].[LoaiDon] ([MaLoaiDon])
GO
ALTER TABLE [svc_demo].[VaiTroQuyen]  WITH CHECK ADD  CONSTRAINT [FK__VaiTroQuy__MaQuy__40058253] FOREIGN KEY([MaQuyen])
REFERENCES [svc_demo].[QuyenRBAC] ([MaQuyen])
GO
ALTER TABLE [svc_demo].[VaiTroQuyen] CHECK CONSTRAINT [FK__VaiTroQuy__MaQuy__40058253]
GO
ALTER TABLE [svc_demo].[VaiTroQuyen]  WITH CHECK ADD  CONSTRAINT [FK__VaiTroQuy__MaRol__3F115E1A] FOREIGN KEY([MaRole])
REFERENCES [svc_demo].[VaiTroRBAC] ([MaRole])
GO
ALTER TABLE [svc_demo].[VaiTroQuyen] CHECK CONSTRAINT [FK__VaiTroQuy__MaRol__3F115E1A]
GO
ALTER TABLE [svc_demo].[VaiTroRBAC]  WITH CHECK ADD  CONSTRAINT [FK__VaiTroRBA__Nguoi__3C34F16F] FOREIGN KEY([NguoiTao])
REFERENCES [svc_demo].[TaiKhoan] ([MaHS])
GO
ALTER TABLE [svc_demo].[VaiTroRBAC] CHECK CONSTRAINT [FK__VaiTroRBA__Nguoi__3C34F16F]
GO
ALTER TABLE [academic_leave].[ApplicationHistory]  WITH CHECK ADD  CONSTRAINT [CK_AcademicLeave_HistoryJson] CHECK  ((isjson([DataJson])=(1)))
GO
ALTER TABLE [academic_leave].[ApplicationHistory] CHECK CONSTRAINT [CK_AcademicLeave_HistoryJson]
GO
ALTER TABLE [academic_leave].[Applications]  WITH CHECK ADD  CONSTRAINT [CK_AcademicLeave_Confirmed] CHECK  (([Status]='cancelled' OR [Status]='draft' OR [StudentConfirmedAt] IS NOT NULL AND [SnapshotJson] IS NOT NULL))
GO
ALTER TABLE [academic_leave].[Applications] CHECK CONSTRAINT [CK_AcademicLeave_Confirmed]
GO
ALTER TABLE [academic_leave].[Applications]  WITH CHECK ADD  CONSTRAINT [CK_AcademicLeave_IntakeV3] CHECK  (([ReceivedAt] IS NULL AND [PaperDeadlineAt] IS NULL AND NOT ([Status]='approved' OR [Status]='processing' OR [Status]='received') OR [ReceivedAt] IS NOT NULL AND [PaperDeadlineAt] IS NOT NULL AND [PaperDeadlineAt]=dateadd(day,(3),[ReceivedAt]) AND ([Status]='rejected' OR [Status]='approved' OR [Status]='processing' OR [Status]='received')))
GO
ALTER TABLE [academic_leave].[Applications] CHECK CONSTRAINT [CK_AcademicLeave_IntakeV3]
GO
ALTER TABLE [academic_leave].[Applications]  WITH CHECK ADD  CONSTRAINT [CK_AcademicLeave_PaperV3] CHECK  (([PaperReceivedAt] IS NULL AND [PaperReceivedBy] IS NULL AND NOT ([Status]='approved' OR [Status]='processing') OR [PaperReceivedAt] IS NOT NULL AND [PaperReceivedBy] IS NOT NULL AND [ReceivedAt] IS NOT NULL AND [PaperReceivedAt]>=[ReceivedAt] AND ([Status]='rejected' OR [Status]='approved' OR [Status]='processing')))
GO
ALTER TABLE [academic_leave].[Applications] CHECK CONSTRAINT [CK_AcademicLeave_PaperV3]
GO
ALTER TABLE [academic_leave].[Applications]  WITH CHECK ADD  CONSTRAINT [CK_AcademicLeave_Reason] CHECK  (([ReasonCode]='maternity' OR [ReasonCode]='military' OR [ReasonCode]='accident' OR [ReasonCode]='medical'))
GO
ALTER TABLE [academic_leave].[Applications] CHECK CONSTRAINT [CK_AcademicLeave_Reason]
GO
ALTER TABLE [academic_leave].[Applications]  WITH CHECK ADD  CONSTRAINT [CK_AcademicLeave_Semester] CHECK  (([StartSemesterCode] like '[0-9][0-9][12]0'))
GO
ALTER TABLE [academic_leave].[Applications] CHECK CONSTRAINT [CK_AcademicLeave_Semester]
GO
ALTER TABLE [academic_leave].[Applications]  WITH CHECK ADD  CONSTRAINT [CK_AcademicLeave_Sequence] CHECK  (([StudentSequence]>(0)))
GO
ALTER TABLE [academic_leave].[Applications] CHECK CONSTRAINT [CK_AcademicLeave_Sequence]
GO
ALTER TABLE [academic_leave].[Applications]  WITH CHECK ADD  CONSTRAINT [CK_AcademicLeave_Snapshot] CHECK  (([SnapshotJson] IS NULL OR isjson([SnapshotJson])=(1)))
GO
ALTER TABLE [academic_leave].[Applications] CHECK CONSTRAINT [CK_AcademicLeave_Snapshot]
GO
ALTER TABLE [academic_leave].[Applications]  WITH CHECK ADD  CONSTRAINT [CK_AcademicLeave_Status] CHECK  (([Status]='cancelled' OR [Status]='rejected' OR [Status]='approved' OR [Status]='needs_changes' OR [Status]='processing' OR [Status]='received' OR [Status]='submitted' OR [Status]='draft'))
GO
ALTER TABLE [academic_leave].[Applications] CHECK CONSTRAINT [CK_AcademicLeave_Status]
GO
ALTER TABLE [academic_leave].[Applications]  WITH CHECK ADD  CONSTRAINT [CK_AcademicLeave_Student] CHECK  ((len([StudentCode])=(9) AND NOT [StudentCode] like '%[^0-9]%'))
GO
ALTER TABLE [academic_leave].[Applications] CHECK CONSTRAINT [CK_AcademicLeave_Student]
GO
ALTER TABLE [academic_leave].[Applications]  WITH CHECK ADD  CONSTRAINT [CK_AcademicLeave_WorkflowV2] CHECK  (([Kind]='leave' AND [ParentApplicationId] IS NULL AND ([SemesterCount]>=(1) AND [SemesterCount]<=(4)) AND ([ReasonCode]='military' OR [SemesterCount]=(1)) OR [Kind]='extension' AND [ParentApplicationId] IS NOT NULL AND [ParentApplicationId]<>[Id] AND ([SemesterCount]>=(1) AND [SemesterCount]<=(4)) AND ([ReasonCode]='military' OR [SemesterCount]=(1)) OR [Kind]='return' AND [ParentApplicationId] IS NOT NULL AND [ParentApplicationId]<>[Id] AND [SemesterCount]=(0)))
GO
ALTER TABLE [academic_leave].[Applications] CHECK CONSTRAINT [CK_AcademicLeave_WorkflowV2]
GO
ALTER TABLE [auth].[AccountProfiles]  WITH CHECK ADD  CONSTRAINT [CK_AuthAccessLevel] CHECK  (([AccessLevel]='super_admin' AND [FieldCode] IS NULL OR ([AccessLevel]='specialist' OR [AccessLevel]='department_admin') AND [FieldCode] IS NOT NULL))
GO
ALTER TABLE [auth].[AccountProfiles] CHECK CONSTRAINT [CK_AuthAccessLevel]
GO
ALTER TABLE [auth].[LocalAccounts]  WITH CHECK ADD  CONSTRAINT [CK_AuthChannel] CHECK  (([Channel]='admin' OR [Channel]='student'))
GO
ALTER TABLE [auth].[LocalAccounts] CHECK CONSTRAINT [CK_AuthChannel]
GO
ALTER TABLE [certification].[CertificateLevels]  WITH CHECK ADD  CONSTRAINT [CK_CertLevels_Complete] CHECK  (([IsSchoolProvided]=(1) OR [Code] IS NOT NULL AND [DisplayName] IS NOT NULL))
GO
ALTER TABLE [certification].[CertificateLevels] CHECK CONSTRAINT [CK_CertLevels_Complete]
GO
ALTER TABLE [certification].[CertificateLevels]  WITH CHECK ADD  CONSTRAINT [CK_CertLevels_School] CHECK  (([IsSchoolProvided]=(0) OR [SchoolId] IS NOT NULL))
GO
ALTER TABLE [certification].[CertificateLevels] CHECK CONSTRAINT [CK_CertLevels_School]
GO
ALTER TABLE [certification].[CertificateTypes]  WITH CHECK ADD  CONSTRAINT [CK_CertTypes_Code] CHECK  ((len(ltrim(rtrim([Code])))>(0)))
GO
ALTER TABLE [certification].[CertificateTypes] CHECK CONSTRAINT [CK_CertTypes_Code]
GO
ALTER TABLE [certification].[CertificateTypes]  WITH CHECK ADD  CONSTRAINT [CK_CertTypes_Form] CHECK  ((isjson([FormSchemaJson])=(1) AND json_value([FormSchemaJson],'$.fields[0].key') IS NOT NULL))
GO
ALTER TABLE [certification].[CertificateTypes] CHECK CONSTRAINT [CK_CertTypes_Form]
GO
ALTER TABLE [certification].[CertificateTypes]  WITH CHECK ADD  CONSTRAINT [CK_CertTypes_Language] CHECK  (([LanguageId] IS NOT NULL OR [IsSchoolProvided]=(1) AND [IsPublished]=(0)))
GO
ALTER TABLE [certification].[CertificateTypes] CHECK CONSTRAINT [CK_CertTypes_Language]
GO
ALTER TABLE [certification].[CertificateTypes]  WITH CHECK ADD  CONSTRAINT [CK_CertTypes_Name] CHECK  ((len(ltrim(rtrim([DisplayName])))>(0) OR [IsSchoolProvided]=(1) AND [IsPublished]=(0) AND [DisplayName]=N''))
GO
ALTER TABLE [certification].[CertificateTypes] CHECK CONSTRAINT [CK_CertTypes_Name]
GO
ALTER TABLE [certification].[CertificateTypes]  WITH CHECK ADD  CONSTRAINT [CK_CertTypes_Revision] CHECK  (([Revision]>(0)))
GO
ALTER TABLE [certification].[CertificateTypes] CHECK CONSTRAINT [CK_CertTypes_Revision]
GO
ALTER TABLE [certification].[CertificateTypes]  WITH CHECK ADD  CONSTRAINT [CK_CertTypes_School] CHECK  (([IsSchoolProvided]=(0) OR [SchoolId] IS NOT NULL))
GO
ALTER TABLE [certification].[CertificateTypes] CHECK CONSTRAINT [CK_CertTypes_School]
GO
ALTER TABLE [certification].[EvidenceFiles]  WITH CHECK ADD CHECK  (([DeclaredContentType]='image/png' OR [DeclaredContentType]='image/jpeg'))
GO
ALTER TABLE [certification].[EvidenceFiles]  WITH CHECK ADD CHECK  (([DeclaredSizeBytes]>=(1) AND [DeclaredSizeBytes]<=(20971520)))
GO
ALTER TABLE [certification].[EvidenceFiles]  WITH CHECK ADD CHECK  (([InspectionJson] IS NULL OR isjson([InspectionJson])=(1)))
GO
ALTER TABLE [certification].[EvidenceFiles]  WITH CHECK ADD CHECK  (([Status]='completed' OR [Status]='pending'))
GO
ALTER TABLE [certification].[EvidenceFiles]  WITH CHECK ADD CHECK  (([Status]='pending' AND [CompletedAt] IS NULL AND [InspectionJson] IS NULL OR [Status]='completed' AND [CompletedAt] IS NOT NULL AND [InspectionJson] IS NOT NULL))
GO
ALTER TABLE [certification].[Languages]  WITH CHECK ADD  CONSTRAINT [CK_CertLanguages_Code] CHECK  ((len(ltrim(rtrim([Code])))>(0)))
GO
ALTER TABLE [certification].[Languages] CHECK CONSTRAINT [CK_CertLanguages_Code]
GO
ALTER TABLE [certification].[Languages]  WITH CHECK ADD  CONSTRAINT [CK_CertLanguages_Name] CHECK  ((len(ltrim(rtrim([DisplayName])))>(0)))
GO
ALTER TABLE [certification].[Languages] CHECK CONSTRAINT [CK_CertLanguages_Name]
GO
ALTER TABLE [certification].[Languages]  WITH CHECK ADD  CONSTRAINT [CK_CertLanguages_Revision] CHECK  (([Revision]>(0)))
GO
ALTER TABLE [certification].[Languages] CHECK CONSTRAINT [CK_CertLanguages_Revision]
GO
ALTER TABLE [certification].[RecognitionPolicies]  WITH CHECK ADD  CONSTRAINT [CK_CertPolicies_Cohorts] CHECK  (([CohortFrom]>=(1900) AND [CohortFrom]<=(2199) AND ([CohortTo] IS NULL OR [CohortTo]>=[CohortFrom] AND [CohortTo]<=(2199))))
GO
ALTER TABLE [certification].[RecognitionPolicies] CHECK CONSTRAINT [CK_CertPolicies_Cohorts]
GO
ALTER TABLE [certification].[RecognitionPolicies]  WITH CHECK ADD  CONSTRAINT [CK_CertPolicies_Reason] CHECK  (([IsRecognized]=(1) OR [Reason] IS NOT NULL AND len(ltrim(rtrim([Reason])))>(0)))
GO
ALTER TABLE [certification].[RecognitionPolicies] CHECK CONSTRAINT [CK_CertPolicies_Reason]
GO
ALTER TABLE [certification].[RecognitionPolicies]  WITH CHECK ADD  CONSTRAINT [CK_CertPolicies_Revision] CHECK  (([Revision]>(0)))
GO
ALTER TABLE [certification].[RecognitionPolicies] CHECK CONSTRAINT [CK_CertPolicies_Revision]
GO
ALTER TABLE [certification].[RecognitionPolicies]  WITH CHECK ADD  CONSTRAINT [CK_CertPolicies_Target] CHECK  (([LanguageId] IS NOT NULL AND [CertificateTypeId] IS NULL OR [LanguageId] IS NULL AND [CertificateTypeId] IS NOT NULL))
GO
ALTER TABLE [certification].[RecognitionPolicies] CHECK CONSTRAINT [CK_CertPolicies_Target]
GO
ALTER TABLE [certification].[StudentCertificates]  WITH CHECK ADD CHECK  (([ActorSource]='development' OR [ActorSource]='manual' OR [ActorSource]='auth'))
GO
ALTER TABLE [certification].[StudentCertificates]  WITH CHECK ADD CHECK  ((isjson([CatalogSnapshotJson])=(1)))
GO
ALTER TABLE [certification].[StudentCertificates]  WITH CHECK ADD CHECK  (([CohortYear]>=(1900) AND [CohortYear]<=(2199)))
GO
ALTER TABLE [certification].[StudentCertificates]  WITH CHECK ADD CHECK  ((isjson([ResultJson])=(1)))
GO
ALTER TABLE [certification].[StudentCertificates]  WITH CHECK ADD CHECK  ((len([StudentCode])=(9) AND NOT [StudentCode] like ('%[^0-9]%') collate Latin1_General_100_BIN2))
GO
ALTER TABLE [certification].[StudentCertificates]  WITH CHECK ADD  CONSTRAINT [CK_Certification_Cccd] CHECK  (([Cccd] IS NULL OR len([Cccd])=(12) AND NOT [Cccd] like ('%[^0-9]%') collate Latin1_General_100_BIN2))
GO
ALTER TABLE [certification].[StudentCertificates] CHECK CONSTRAINT [CK_Certification_Cccd]
GO
ALTER TABLE [certification].[StudentCertificates]  WITH CHECK ADD  CONSTRAINT [CK_Certification_ReviewStatusV3] CHECK  (([Status]='rejected' OR [Status]='verified' OR [Status]='needs_changes' OR [Status]='processing' OR [Status]='submitted' OR [Status]='checking' OR [Status]='uploading'))
GO
ALTER TABLE [certification].[StudentCertificates] CHECK CONSTRAINT [CK_Certification_ReviewStatusV3]
GO
ALTER TABLE [certification].[StudentCertificates]  WITH CHECK ADD  CONSTRAINT [CK_Certification_WorkflowHistory] CHECK  ((isjson([WorkflowHistoryJson])=(1)))
GO
ALTER TABLE [certification].[StudentCertificates] CHECK CONSTRAINT [CK_Certification_WorkflowHistory]
GO
ALTER TABLE [certification].[StudentCertificates]  WITH CHECK ADD  CONSTRAINT [CK_Certification_WorkflowV2] CHECK  ((([Status]='needs_changes' OR [Status]='rejected' OR [Status]='failed' OR [Status]='verified' OR [Status]='processing' OR [Status]='received' OR [Status]='submitted' OR [Status]='checking' OR [Status]='uploading') AND ([Status]='checking' AND [ClaimToken] IS NOT NULL OR [Status]<>'checking' AND [ClaimToken] IS NULL) AND (([Status]='checking' OR [Status]='uploading') AND [SubmittedAt] IS NULL AND [ReviewedAt] IS NULL OR [Status]='submitted' AND [SubmittedAt] IS NOT NULL AND [ReviewedAt] IS NULL OR ([Status]='needs_changes' OR [Status]='rejected' OR [Status]='failed' OR [Status]='verified' OR [Status]='processing' OR [Status]='received') AND [SubmittedAt] IS NOT NULL AND [ReviewedAt] IS NOT NULL) AND ([ReviewedAt] IS NULL AND [ReviewerReference] IS NULL AND [ReviewerName] IS NULL AND [ReviewerSource] IS NULL AND [ReviewReason] IS NULL AND [VerificationMethod] IS NULL OR [ReviewedAt] IS NOT NULL AND [ReviewerReference] IS NOT NULL AND [ReviewerName] IS NOT NULL AND ([ReviewerSource]='manual' OR [ReviewerSource]='development' OR [ReviewerSource]='auth') AND ([VerificationMethod] IS NULL OR ([VerificationMethod]='other' OR [VerificationMethod]='issuer_lookup' OR [VerificationMethod]='document_comparison')) AND ([Status]<>'verified' OR [VerificationMethod] IS NOT NULL) AND (NOT ([Status]='needs_changes' OR [Status]='failed' OR [Status]='rejected') OR [ReviewReason] IS NOT NULL AND len(ltrim(rtrim([ReviewReason])))>(0)))))
GO
ALTER TABLE [certification].[StudentCertificates] CHECK CONSTRAINT [CK_Certification_WorkflowV2]
GO
ALTER TABLE [certification].[tmCNTTChungChi_File]  WITH CHECK ADD CHECK  (([ActorSource]='development' OR [ActorSource]='manual' OR [ActorSource]='auth'))
GO
ALTER TABLE [certification].[tmCNTTChungChi_File]  WITH CHECK ADD CHECK  (([DeclaredContentType]='image/png' OR [DeclaredContentType]='image/jpeg'))
GO
ALTER TABLE [certification].[tmCNTTChungChi_File]  WITH CHECK ADD CHECK  (([DeclaredSizeBytes]>=(1) AND [DeclaredSizeBytes]<=(20971520)))
GO
ALTER TABLE [certification].[tmCNTTChungChi_File]  WITH CHECK ADD CHECK  (([InspectionJson] IS NULL OR isjson([InspectionJson])=(1)))
GO
ALTER TABLE [certification].[tmCNTTChungChi_File]  WITH CHECK ADD CHECK  (([ReviewJson] IS NULL OR isjson([ReviewJson])=(1)))
GO
ALTER TABLE [certification].[tmCNTTChungChi_File]  WITH CHECK ADD CHECK  (([Sequence]>(0)))
GO
ALTER TABLE [certification].[tmCNTTChungChi_File]  WITH CHECK ADD CHECK  (([Status]='completed' OR [Status]='checking' OR [Status]='pending'))
GO
ALTER TABLE [certification].[tmCNTTChungChi_File]  WITH CHECK ADD  CONSTRAINT [CK_CNTTFile_Claim] CHECK  (([Status]='checking' AND [ClaimToken] IS NOT NULL OR [Status]<>'checking' AND [ClaimToken] IS NULL))
GO
ALTER TABLE [certification].[tmCNTTChungChi_File] CHECK CONSTRAINT [CK_CNTTFile_Claim]
GO
ALTER TABLE [certification].[tmCNTTChungChi_File]  WITH CHECK ADD  CONSTRAINT [CK_CNTTFile_Completed] CHECK  (([Status]='completed' AND [CompletedAt] IS NOT NULL AND [InspectionJson] IS NOT NULL OR [Status]<>'completed' AND [CompletedAt] IS NULL AND [InspectionJson] IS NULL))
GO
ALTER TABLE [certification].[tmCNTTChungChi_File] CHECK CONSTRAINT [CK_CNTTFile_Completed]
GO
ALTER TABLE [certification].[tmCNTTChungChi_File]  WITH CHECK ADD  CONSTRAINT [CK_ItCertification_StudentSnapshot] CHECK  (([StudentSnapshotJson] IS NULL OR isjson([StudentSnapshotJson])=(1)))
GO
ALTER TABLE [certification].[tmCNTTChungChi_File] CHECK CONSTRAINT [CK_ItCertification_StudentSnapshot]
GO
ALTER TABLE [svc_demo].[LoaiDon]  WITH CHECK ADD CHECK  (([CachNop]='WEB' OR [CachNop]='PAPER_FORM'))
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE   PROCEDURE auth.RefreshPermissionCatalog AS BEGIN SET NOCOUNT ON;DECLARE @catalog TABLE(PermissionName nvarchar(100),DisplayName nvarchar(250),GroupName nvarchar(100),FieldCode varchar(10),TaskId int,ModuleCode varchar(40));
INSERT @catalog
 SELECT CONCAT(N'work:',MaLoaiDon),CONCAT(N'Xử lý: ',TenLoaiDon),N'Đơn đề nghị','DT',4,'student-requests'
 FROM svc_demo.LoaiDon WHERE MaLoaiDon NOT IN('CONFIRMATION','LMS_SUPPORT');
INSERT @catalog
 SELECT CONCAT(N'work:CONFIRMATION:',MaVanBan),CONCAT(N'Xử lý: ',TenVanBan),N'Đơn xác nhận','DT',4,'student-requests' FROM svc_demo.Sys_VanBan;
INSERT @catalog VALUES('work:LMS_SUPPORT',N'Xử lý yêu cầu cấp lại mật khẩu LMS',N'Hỗ trợ LMS','DT',4,'student-requests');
INSERT @catalog
 SELECT CONCAT(N'work:certifications:',Id),CONCAT(N'Xử lý: ',COALESCE(NULLIF(DisplayName,N''),Code)),N'Chứng chỉ ngoại ngữ','DT',1,'certifications' FROM certification.CertificateTypes;
INSERT @catalog
 SELECT CONCAT(N'work:it-certifications:',MaCC),CONCAT(N'Xử lý: ',TenCC),N'Chứng chỉ tin học','DT',2,'it-certifications' FROM certification.tmCNTTChungChi;
INSERT @catalog VALUES
 ('work:academic-leave:leave',N'Xử lý ngừng học và gia hạn ngừng học',N'Học vụ','DT',3,'academic-leave'),
 ('work:academic-leave:return',N'Xử lý trở lại học',N'Học vụ','DT',3,'academic-leave'),
 ('certifications:catalog:manage',N'Quản lý danh mục chứng chỉ',N'Danh mục','DT',1,'certifications'),
 ('workbook.export',N'Xuất Excel đơn đề nghị / xác nhận',N'Excel','DT',4,'student-requests'),
 ('workbook.import',N'Nhập Excel xử lý đơn đề nghị / xác nhận',N'Excel','DT',4,'student-requests');
INSERT @catalog
 SELECT CONCAT(m.code,':workbook:',a.code),CONCAT(a.name,N' Excel ',m.name),N'Excel','DT',m.taskId,m.code
 FROM (VALUES('certifications',N'chứng chỉ ngoại ngữ',1),('it-certifications',N'chứng chỉ tin học',2),('academic-leave',N'học vụ',3))m(code,name,taskId)
 CROSS JOIN(VALUES('export',N'Xuất'),('import',N'Nhập'))a(code,name);
INSERT auth.Permissions(PermissionName) SELECT DISTINCT c.PermissionName FROM @catalog c WHERE NOT EXISTS(SELECT 1 FROM auth.Permissions p WHERE p.PermissionName=c.PermissionName);
INSERT auth.PermissionDefinitions(PermissionName,DisplayName,GroupName,FieldCode,TaskId,ModuleCode)
 SELECT c.* FROM @catalog c WHERE NOT EXISTS(SELECT 1 FROM auth.PermissionDefinitions p WHERE p.PermissionName=c.PermissionName);
UPDATE p SET DisplayName=c.DisplayName,GroupName=c.GroupName FROM auth.PermissionDefinitions p JOIN @catalog c ON c.PermissionName=p.PermissionName;
 END
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TRIGGER [certification].[TR_CertLevels_SchoolIdentity] ON [certification].[CertificateLevels] AFTER UPDATE,DELETE AS
 BEGIN
   IF ISNULL(TRY_CONVERT(bit,SESSION_CONTEXT(N'certification.school_catalog_sync')),0)=1 RETURN;
   IF EXISTS(SELECT 1 FROM deleted d WHERE d.IsSchoolProvided=1) THROW 51501,'CERT_SCHOOL_LEVEL_LOCKED',1;
 END
GO
ALTER TABLE [certification].[CertificateLevels] ENABLE TRIGGER [TR_CertLevels_SchoolIdentity]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TRIGGER [certification].[TR_CertTypes_SchoolIdentity] ON [certification].[CertificateTypes] AFTER UPDATE,DELETE AS
 BEGIN
   IF ISNULL(TRY_CONVERT(bit,SESSION_CONTEXT(N'certification.school_catalog_sync')),0)=1 RETURN;
   IF EXISTS(SELECT 1 FROM deleted d LEFT JOIN inserted i ON i.Id=d.Id WHERE d.IsSchoolProvided=1 AND(
     i.Id IS NULL OR i.IsSchoolProvided<>1 OR i.Code<>d.Code OR
     i.DisplayName COLLATE Latin1_General_100_BIN2<>d.DisplayName COLLATE Latin1_General_100_BIN2 OR
     ISNULL(i.LanguageId,0)<>ISNULL(d.LanguageId,0) OR ISNULL(i.SchoolId,0)<>ISNULL(d.SchoolId,0) OR
     ISNULL(i.BaseCertificateTypeId,0)<>ISNULL(d.BaseCertificateTypeId,0) OR
     ISNULL(i.ConversionFlag,255)<>ISNULL(d.ConversionFlag,255) OR
     ISNULL(i.Notes,N'') COLLATE Latin1_General_100_BIN2<>ISNULL(d.Notes,N'') COLLATE Latin1_General_100_BIN2))
     THROW 51501,'CERT_SCHOOL_IDENTITY_LOCKED',1;
 END
GO
ALTER TABLE [certification].[CertificateTypes] ENABLE TRIGGER [TR_CertTypes_SchoolIdentity]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TRIGGER [certification].[TR_CertLanguages_SchoolCode] ON [certification].[Languages] AFTER UPDATE,DELETE AS
 BEGIN
   IF ISNULL(TRY_CONVERT(bit,SESSION_CONTEXT(N'certification.school_catalog_sync')),0)=1 RETURN;
   IF EXISTS(SELECT 1 FROM deleted d LEFT JOIN inserted i ON i.Id=d.Id WHERE d.IsSchoolProvided=1 AND(
     i.Id IS NULL OR i.IsSchoolProvided<>1 OR i.Code<>d.Code)) THROW 51501,'CERT_SCHOOL_LANGUAGE_LOCKED',1;
 END
GO
ALTER TABLE [certification].[Languages] ENABLE TRIGGER [TR_CertLanguages_SchoolCode]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TRIGGER [certification].[TR_CertPolicies_NoOverlap] ON [certification].[RecognitionPolicies] AFTER INSERT,UPDATE AS
 BEGIN
   IF EXISTS(SELECT 1 FROM certification.RecognitionPolicies a WITH(UPDLOCK,HOLDLOCK)
     JOIN certification.RecognitionPolicies b WITH(UPDLOCK,HOLDLOCK) ON a.Id<b.Id
       AND(a.LanguageId=b.LanguageId OR a.CertificateTypeId=b.CertificateTypeId)
       AND a.CohortFrom<=ISNULL(b.CohortTo,2199) AND b.CohortFrom<=ISNULL(a.CohortTo,2199))
     THROW 51301,'CERT_POLICY_OVERLAP',1;
 END
GO
ALTER TABLE [certification].[RecognitionPolicies] ENABLE TRIGGER [TR_CertPolicies_NoOverlap]
GO
EXEC sys.sp_addextendedproperty @name=N'ReviewWorkflowVersion', @value=3 , @level0type=N'SCHEMA',@level0name=N'academic_leave', @level1type=N'TABLE',@level1name=N'Applications'
GO
EXEC sys.sp_addextendedproperty @name=N'GranularRbacVersion', @value=1 , @level0type=N'SCHEMA',@level0name=N'auth', @level1type=N'TABLE',@level1name=N'PermissionDefinitions'
GO
