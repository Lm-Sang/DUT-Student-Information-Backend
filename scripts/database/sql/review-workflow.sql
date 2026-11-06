-- Local workflow upgrade. Apply with db:review-workflow:upgrade while deploying the matching backend.
-- Preserves final certificate results; converts old leave online approvals to waiting for paper.
SET NOCOUNT ON;
SET XACT_ABORT ON;
IF DB_NAME() NOT IN(N'sv_dut',N'Studentpage_Integration_20261103')
  THROW 51000,'Local application database required',1;
BEGIN TRY
  BEGIN TRANSACTION;
  DECLARE @lock int;
  EXEC @lock=sys.sp_getapplock @Resource=N'review-workflow-schema-v3',@LockMode='Exclusive',@LockOwner='Transaction',@LockTimeout=10000;
  IF @lock<0 THROW 51509,'Workflow migration lock unavailable',1;
  IF OBJECT_ID(N'certification.StudentCertificates',N'U') IS NULL
    AND OBJECT_ID(N'academic_leave.Applications',N'U') IS NULL
    THROW 51509,'Initialize the local application schemas before upgrading the workflow',1;

  IF OBJECT_ID(N'certification.StudentCertificates',N'U') IS NOT NULL
  BEGIN
    -- Replace only checks owned solely by Status. Preserve cross-column integrity checks.
    DECLARE @dropStatus nvarchar(max)=N'',@statusColumn int=COLUMNPROPERTY(OBJECT_ID(N'certification.StudentCertificates'),N'Status','ColumnId');
    SELECT @dropStatus=@dropStatus+N'ALTER TABLE certification.StudentCertificates DROP CONSTRAINT '+QUOTENAME(c.name)+N';'
    FROM sys.check_constraints c
    WHERE c.parent_object_id=OBJECT_ID(N'certification.StudentCertificates') AND c.definition LIKE '%Status%'
      AND NOT EXISTS(SELECT 1 FROM sys.sql_expression_dependencies d WHERE d.referencing_id=c.object_id
        AND d.referenced_id=c.parent_object_id AND d.referenced_minor_id NOT IN(0,@statusColumn));
    IF @dropStatus<>N'' EXEC(@dropStatus);
    ALTER TABLE certification.StudentCertificates WITH CHECK ADD CONSTRAINT CK_Certification_ReviewStatusV3
      CHECK(Status IN('uploading','checking','submitted','processing','needs_changes','verified','rejected'));
  END;

  IF OBJECT_ID(N'academic_leave.Applications',N'U') IS NOT NULL
  BEGIN
    IF OBJECT_ID(N'academic_leave.ApplicationHistory',N'U') IS NULL
      THROW 51509,'Initialize academic leave history before upgrading the workflow',1;
    IF COL_LENGTH(N'academic_leave.Applications',N'ReceivedAt') IS NULL
      EXEC(N'ALTER TABLE academic_leave.Applications ADD ReceivedAt datetime2(3) NULL');

    -- These checks implement the old online-approval/72-hour-cutoff meanings.
    DECLARE @dropLeave nvarchar(max)=N'';
    SELECT @dropLeave=@dropLeave+N'ALTER TABLE academic_leave.Applications DROP CONSTRAINT '+QUOTENAME(name)+N';'
    FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID(N'academic_leave.Applications')
      AND name IN(N'CK_AcademicLeave_Status',N'CK_AcademicLeave_Approval',N'CK_AcademicLeave_Paper',
        N'CK_AcademicLeave_IntakeV3',N'CK_AcademicLeave_PaperV3');
    IF @dropLeave<>N'' EXEC(@dropLeave);

    IF NOT EXISTS(SELECT 1 FROM sys.extended_properties WHERE class=1
      AND major_id=OBJECT_ID(N'academic_leave.Applications') AND minor_id=0 AND name=N'ReviewWorkflowVersion')
    BEGIN
      INSERT academic_leave.ApplicationHistory(ApplicationId,Action,ActorSource,ActorReference,ActorName,Status,DataJson)
        SELECT Id,'workflow_upgraded','migration','review-workflow-v3',NULL,
          CASE Status WHEN 'approved' THEN 'received' ELSE 'processing' END,
          (SELECT Status AS previousStatus,ReviewedAt AS previousReviewedAt,PaperDeadlineAt AS paperDeadlineAt,
            PaperReceivedAt AS paperReceivedAt FOR JSON PATH,INCLUDE_NULL_VALUES,WITHOUT_ARRAY_WRAPPER)
        FROM academic_leave.Applications WHERE Status IN('approved','paper_received');
      -- Old approved meant "waiting for paper", not a final acceptance. Keep all original timestamps.
      EXEC(N'UPDATE academic_leave.Applications SET ReceivedAt=ReviewedAt,
        Status=CASE Status WHEN ''approved'' THEN ''received'' ELSE ''processing'' END
        WHERE Status IN(''approved'',''paper_received'')');
      EXEC sys.sp_addextendedproperty @name=N'ReviewWorkflowVersion',@value=3,
        @level0type=N'SCHEMA',@level0name=N'academic_leave',@level1type=N'TABLE',@level1name=N'Applications';
    END;

    ALTER TABLE academic_leave.Applications WITH CHECK ADD CONSTRAINT CK_AcademicLeave_Status
      CHECK(Status IN('draft','submitted','received','processing','needs_changes','approved','rejected','cancelled'));
    EXEC(N'ALTER TABLE academic_leave.Applications WITH CHECK ADD CONSTRAINT CK_AcademicLeave_IntakeV3 CHECK(
      (ReceivedAt IS NULL AND PaperDeadlineAt IS NULL AND Status NOT IN(''received'',''processing'',''approved''))
      OR (ReceivedAt IS NOT NULL AND PaperDeadlineAt IS NOT NULL AND PaperDeadlineAt=DATEADD(day,3,ReceivedAt)
        AND Status IN(''received'',''processing'',''approved'',''rejected'')))');
    EXEC(N'ALTER TABLE academic_leave.Applications WITH CHECK ADD CONSTRAINT CK_AcademicLeave_PaperV3 CHECK(
      (PaperReceivedAt IS NULL AND PaperReceivedBy IS NULL AND Status NOT IN(''processing'',''approved''))
      OR (PaperReceivedAt IS NOT NULL AND PaperReceivedBy IS NOT NULL AND ReceivedAt IS NOT NULL
        AND PaperReceivedAt>=ReceivedAt AND Status IN(''processing'',''approved'',''rejected'')))');
    -- No PaperReceivedAt<=PaperDeadlineAt cutoff: late paper leaves the waiting state only on explicit receipt.
  END;
  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF XACT_STATE()<>0 ROLLBACK TRANSACTION;
  THROW;
END CATCH;
