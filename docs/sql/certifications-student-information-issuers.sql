-- Run against the local Studentpage database. Additive and safe to run again.
-- Existing applications remain intact; missing historical identity is resolved
-- by a read-only DATA_SV1 lookup in the application, never fabricated here.
SET XACT_ABORT ON;
BEGIN TRY
  BEGIN TRANSACTION;
  IF OBJECT_ID(N'certification.StudentCertificates',N'U') IS NULL
    OR OBJECT_ID(N'certification.tmCNTTChungChi_File',N'U') IS NULL
    THROW 51900,'Certification base tables must exist before this migration.',1;

  IF OBJECT_ID(N'certification.IssuingOrganizations',N'U') IS NULL
    CREATE TABLE certification.IssuingOrganizations(
      Id int IDENTITY(1,1) NOT NULL PRIMARY KEY,
      Code varchar(50) NOT NULL UNIQUE,
      DisplayName nvarchar(250) NOT NULL,
      IsActive bit NOT NULL DEFAULT(1),
      SourceUrl nvarchar(1000) NOT NULL,
      VerifiedOn date NOT NULL,
      Revision int NOT NULL DEFAULT(1),
      CreatedAt datetime2(3) NOT NULL DEFAULT(SYSUTCDATETIME()),
      UpdatedAt datetime2(3) NOT NULL DEFAULT(SYSUTCDATETIME()),
      RowVersion rowversion NOT NULL
    );
  IF OBJECT_ID(N'certification.CertificateTypeIssuers',N'U') IS NULL
    CREATE TABLE certification.CertificateTypeIssuers(
      CertificateTypeId int NOT NULL,
      IssuingOrganizationId int NOT NULL,
      IsActive bit NOT NULL DEFAULT(1),
      PRIMARY KEY(CertificateTypeId,IssuingOrganizationId),
      FOREIGN KEY(CertificateTypeId) REFERENCES certification.CertificateTypes(Id),
      FOREIGN KEY(IssuingOrganizationId) REFERENCES certification.IssuingOrganizations(Id)
    );
  IF COL_LENGTH('certification.StudentCertificates','Cccd') IS NULL
    EXEC(N'ALTER TABLE certification.StudentCertificates ADD Cccd varchar(12) NULL;');
  IF COL_LENGTH('certification.StudentCertificates','IssuingOrganizationId') IS NULL
    EXEC(N'ALTER TABLE certification.StudentCertificates ADD IssuingOrganizationId int NULL;');
  IF COL_LENGTH('certification.tmCNTTChungChi_File','StudentSnapshotJson') IS NULL
    EXEC(N'ALTER TABLE certification.tmCNTTChungChi_File ADD StudentSnapshotJson nvarchar(max) NULL;');

  IF NOT EXISTS(SELECT 1 FROM sys.check_constraints WHERE name='CK_Certification_Cccd' AND parent_object_id=OBJECT_ID('certification.StudentCertificates'))
    EXEC(N'ALTER TABLE certification.StudentCertificates ADD CONSTRAINT CK_Certification_Cccd
      CHECK(Cccd IS NULL OR (LEN(Cccd)=12 AND Cccd NOT LIKE ''%[^0-9]%'' COLLATE Latin1_General_100_BIN2));');
  IF NOT EXISTS(SELECT 1 FROM sys.foreign_keys WHERE name='FK_Certification_TypeIssuer' AND parent_object_id=OBJECT_ID('certification.StudentCertificates'))
    EXEC(N'ALTER TABLE certification.StudentCertificates ADD CONSTRAINT FK_Certification_TypeIssuer
      FOREIGN KEY(CertificateTypeId,IssuingOrganizationId)
      REFERENCES certification.CertificateTypeIssuers(CertificateTypeId,IssuingOrganizationId);');
  IF NOT EXISTS(SELECT 1 FROM sys.check_constraints WHERE name='CK_ItCertification_StudentSnapshot' AND parent_object_id=OBJECT_ID('certification.tmCNTTChungChi_File'))
    EXEC(N'ALTER TABLE certification.tmCNTTChungChi_File ADD CONSTRAINT CK_ItCertification_StudentSnapshot
      CHECK(StudentSnapshotJson IS NULL OR ISJSON(StudentSnapshotJson)=1);');
  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF XACT_STATE()<>0 ROLLBACK TRANSACTION;
  THROW;
END CATCH;
