import { queryLocalDatabase } from '../../../infrastructure/database/index.js';
import { env } from '../../../config/env.js';
import { AppError } from '../../../shared/errors/app-error.js';

const fileTable = 'certification.tmCNTTChungChi_File';
const certificateTable = 'certification.tmCNTTChungChi_SV';
const summarySql = `SELECT g.ApplicationId AS Id,f.ActorReference,f.ActorSource,
 c.MaHS AS StudentCode,f.CertificateId,
 CASE WHEN done.Id IS NULL THEN 'uploading' ELSE COALESCE(JSON_VALUE(done.ReviewJson,'$.Decision'),'submitted') END AS Status,
 done.SubmissionId AS CurrentSubmissionId,g.CreatedAt,g.UpdatedAt,
 CONVERT(varchar(16),CONVERT(binary(8),g.VersionNumber),2) AS VersionToken
 FROM (SELECT ApplicationId,MIN(CreatedAt) AS CreatedAt,MAX(UpdatedAt) AS UpdatedAt,
   MAX(CONVERT(bigint,RowVersion)) AS VersionNumber FROM ${fileTable} GROUP BY ApplicationId) g
 CROSS APPLY(SELECT TOP(1) * FROM ${fileTable} WHERE ApplicationId=g.ApplicationId ORDER BY Sequence DESC,Id) f
 LEFT JOIN ${certificateTable} c ON c.ID=f.CertificateId
 OUTER APPLY(SELECT TOP(1) * FROM ${fileTable} WHERE ApplicationId=g.ApplicationId AND Status='completed' ORDER BY Sequence DESC,Id) done`;
const applicationSql = `SELECT f.*,JSON_QUERY(f.InspectionJson) AS Inspection,JSON_QUERY(f.ReviewJson) AS Review,
 (SELECT t.TenCC FROM ${certificateTable} c JOIN certification.tmCNTTChungChi t ON t.MaCC=c.MaCC WHERE c.ID=f.CertificateId) AS CertificateTypeName,
 JSON_QUERY((SELECT c.* FROM ${certificateTable} c WHERE c.ID=f.CertificateId
   FOR JSON PATH,INCLUDE_NULL_VALUES,WITHOUT_ARRAY_WRAPPER)) AS Certificate,
 CONVERT(varchar(16),CONVERT(binary(8),f.RowVersion),2) AS VersionToken
 FROM ${fileTable} f WHERE f.ApplicationId=TRY_CONVERT(uniqueidentifier,JSON_VALUE(@input,'$.applicationId'))
 ORDER BY f.Sequence DESC,f.CreatedAt,f.Id FOR JSON PATH`;
const lockApplication = `DECLARE @application uniqueidentifier=TRY_CONVERT(uniqueidentifier,JSON_VALUE(@input,'$.applicationId')),
 @status varchar(20),@token varchar(16),@current uniqueidentifier,@lock int,@resource nvarchar(255);
 SET @resource=N'it-certification:'+CONVERT(nvarchar(36),@application);
 EXEC @lock=sys.sp_getapplock @Resource=@resource,@LockMode='Exclusive',@LockOwner='Transaction',@LockTimeout=10000;
 IF @lock<0 THROW 51809,'ITCERT_CONFLICT',1;
 SELECT @status=a.Status,@token=a.VersionToken,@current=a.CurrentSubmissionId FROM (${summarySql}) a WHERE a.Id=@application;
 IF @status IS NULL THROW 51804,'ITCERT_NOT_FOUND',1;
 IF JSON_VALUE(@input,'$.actor.role')='student' AND NOT EXISTS(SELECT 1 FROM ${fileTable} WHERE ApplicationId=@application
   AND ActorReference=JSON_VALUE(@input,'$.actor.reference') AND ActorSource=JSON_VALUE(@input,'$.actor.source'))
   THROW 51803,'ITCERT_FORBIDDEN',1;`;
const editable = "IF @status NOT IN('uploading','needs_changes') THROW 51809,'ITCERT_CONFLICT',1;";
const sameToken = "IF @token<>JSON_VALUE(@input,'$.expected') OR JSON_VALUE(@input,'$.expected') IS NULL THROW 51809,'ITCERT_CONFLICT',1;";
const nativeFields = ['MaHS','MaCC','SoHieu','SoVaoSo','SoNgayQD','GhiChu','CoSoCapCC','NgayCC','MaHS_SoVaoSo'];
const nativeValue = field => field === 'NgayCC'
  ? "TRY_CONVERT(date,JSON_VALUE(@input,'$.data.NgayCC'),23)"
  : `JSON_VALUE(@input,'$.data.${field}')`;

// Reconstruct the API upload history from file metadata; no duplicate business tables.
function applicationFromFiles(files) {
  if (!files?.length) return null;
  const submissions = [];
  for (const file of files) {
    let submission = submissions.find(item => item.Id === file.SubmissionId);
    if (!submission) {
      submission = { Id:file.SubmissionId, Sequence:file.Sequence, Certificate:file.Certificate,CertificateTypeName:file.CertificateTypeName,
        Status:file.Status === 'completed' ? 'submitted' : file.Status === 'checking' ? 'checking' : 'uploading',
        ExpiresAt:file.ExpiresAt, SubmittedAt:file.CompletedAt, CreatedAt:file.CreatedAt, Review:file.Review, Files:[] };
      submissions.push(submission);
    }
    submission.Files.push({...file, Status:file.Status === 'completed' ? 'completed' : 'pending'});
  }
  const current = submissions.find(item => item.Status === 'submitted');
  return { Id:files[0].ApplicationId, ActorReference:files[0].ActorReference, ActorSource:files[0].ActorSource,
    StudentCode:files[0].Certificate.MaHS, Status:current?.Review?.Decision ?? (current ? 'submitted' : 'uploading'),
    CurrentSubmissionId:current?.Id ?? null, Submissions:submissions,
    VersionToken:files.map(f => f.VersionToken).sort().at(-1),
    CreatedAt:files.map(f => f.CreatedAt).sort()[0], UpdatedAt:files.map(f => f.UpdatedAt).sort().at(-1) };
}

export function createItCertificationsRepository({query=queryLocalDatabase,
  databaseName=env.localDatabase.name,databaseHost=env.localDatabase.host} = {}) {
  async function run(statement, input = {}) {
    if (databaseName !== 'Studentpage' || !['localhost','127.0.0.1','::1'].includes(databaseHost.toLowerCase()))
      throw new AppError('Chứng chỉ tin học yêu cầu DB local Studentpage.',503);
    try {
      const result = await query('SET NOCOUNT ON; DECLARE @input nvarchar(max)=?; '+statement,[JSON.stringify(input)]);
      return JSON.parse(result.first[0]?.Json ?? 'null');
    } catch (error) {
      if (error instanceof AppError) throw error;
      const message = error.message ?? '';
      if (/invalid object name.*tmCNTTChungChi/i.test(message))
        throw new AppError('DB chứng chỉ tin học chưa được khởi tạo.',503,{code:'ITCERT_SCHEMA_REQUIRED'});
      const mapped = [
        ['ITCERT_NOT_FOUND',404,'Không tìm thấy hồ sơ tin học.'],
        ['ITCERT_FORBIDDEN',403,'Không có quyền truy cập hồ sơ.'],
        ['ITCERT_CATALOG',400,'Mã chứng chỉ không có trong danh mục tin học.'],
        ['ITCERT_EXPIRED',410,'URL upload đã hết hạn. Vui lòng xin URL mới.'],
        ['ITCERT_',409,'Hồ sơ đã thay đổi hoặc thao tác không hợp lệ.'],
      ].find(([code]) => message.includes(code));
      if (mapped) throw new AppError(mapped[2],mapped[1],{code:mapped[0]});
      if (/constraint|duplicate key/i.test(message))
        throw new AppError('Dữ liệu tin học bị trùng hoặc tham chiếu danh mục/chứng chỉ không hợp lệ.',409);
      throw new AppError('Không thể truy cập DB chứng chỉ tin học.',503,{code:'ITCERT_DATABASE_UNAVAILABLE'});
    }
  }
  async function mutate(input, statement) {
    return applicationFromFiles(await run(`SET XACT_ABORT ON; BEGIN TRY BEGIN TRANSACTION;
      DECLARE @now datetime2(3)=SYSUTCDATETIME(); ${statement}
      SELECT (${applicationSql}) AS Json; COMMIT TRANSACTION;
      END TRY BEGIN CATCH IF XACT_STATE()<>0 ROLLBACK TRANSACTION; THROW; END CATCH;`,input));
  }
  return Object.freeze({
    catalog() {
      return run('SELECT (SELECT ID,MaCC,TenCC FROM certification.tmCNTTChungChi ORDER BY ID FOR JSON PATH,INCLUDE_NULL_VALUES) AS Json;');
    },
    get(applicationId) {
      return run('SELECT ('+applicationSql+') AS Json;',{applicationId}).then(applicationFromFiles);
    },
    // Also exposes imported original records that have no uploaded file yet.
    records({actor,page,pageSize}) {
      return run(`SELECT(SELECT (SELECT COUNT(*) FROM ${certificateTable} c
          WHERE JSON_VALUE(@input,'$.actor.role')='reviewer' OR c.MaHS=JSON_VALUE(@input,'$.actor.studentCode')) AS totalRecords,
        JSON_QUERY(COALESCE((SELECT c.* FROM ${certificateTable} c
          WHERE JSON_VALUE(@input,'$.actor.role')='reviewer' OR c.MaHS=JSON_VALUE(@input,'$.actor.studentCode')
          ORDER BY c.ID OFFSET (TRY_CONVERT(int,JSON_VALUE(@input,'$.page'))-1)*TRY_CONVERT(int,JSON_VALUE(@input,'$.pageSize')) ROWS
          FETCH NEXT TRY_CONVERT(int,JSON_VALUE(@input,'$.pageSize')) ROWS ONLY
          FOR JSON PATH,INCLUDE_NULL_VALUES),'[]')) AS items FOR JSON PATH,WITHOUT_ARRAY_WRAPPER) AS Json;`,{actor,page,pageSize});
    },
    list(input) {
      const filter = `(JSON_VALUE(@input,'$.actor.role')<>'student' OR
        (a.ActorReference=JSON_VALUE(@input,'$.actor.reference') AND a.ActorSource=JSON_VALUE(@input,'$.actor.source')))
        AND(JSON_VALUE(@input,'$.status') IS NULL OR a.Status=JSON_VALUE(@input,'$.status'))`;
      return run(`SELECT(SELECT TRY_CONVERT(int,JSON_VALUE(@input,'$.page')) AS page,
        TRY_CONVERT(int,JSON_VALUE(@input,'$.pageSize')) AS pageSize,
        (SELECT COUNT(*) FROM (${summarySql}) a WHERE ${filter}) AS totalRecords,
        JSON_QUERY(COALESCE((SELECT a.*,
          (SELECT t.TenCC FROM ${certificateTable} c JOIN certification.tmCNTTChungChi t ON t.MaCC=c.MaCC WHERE c.ID=a.CertificateId) AS CertificateTypeName,
          JSON_QUERY((SELECT c.* FROM ${certificateTable} c WHERE c.ID=a.CertificateId
          FOR JSON PATH,INCLUDE_NULL_VALUES,WITHOUT_ARRAY_WRAPPER)) AS Certificate FROM (${summarySql}) a WHERE ${filter}
          ORDER BY a.CreatedAt DESC,a.Id OFFSET (TRY_CONVERT(int,JSON_VALUE(@input,'$.page'))-1)*TRY_CONVERT(int,JSON_VALUE(@input,'$.pageSize')) ROWS
          FETCH NEXT TRY_CONVERT(int,JSON_VALUE(@input,'$.pageSize')) ROWS ONLY FOR JSON PATH),'[]')) AS items
        FOR JSON PATH,WITHOUT_ARRAY_WRAPPER) AS Json;`,input);
    },
    prepareSubmission(input) {
      return mutate(input, `DECLARE @submission uniqueidentifier=TRY_CONVERT(uniqueidentifier,JSON_VALUE(@input,'$.submissionId'));
        ${input.existing ? lockApplication+editable+sameToken : "DECLARE @application uniqueidentifier=TRY_CONVERT(uniqueidentifier,JSON_VALUE(@input,'$.applicationId'));"}
        IF NOT EXISTS(SELECT 1 FROM certification.tmCNTTChungChi WHERE MaCC=JSON_VALUE(@input,'$.data.MaCC')) THROW 51801,'ITCERT_CATALOG',1;
        DECLARE @certificate int,@sequence int,@pending uniqueidentifier;
        SELECT TOP(1) @pending=SubmissionId,@certificate=CertificateId,@sequence=Sequence
          FROM ${fileTable} WHERE ApplicationId=@application AND Status<>'completed';
        IF @pending IS NOT NULL
        BEGIN
          IF @pending<>@submission OR EXISTS(SELECT 1 FROM ${fileTable} WHERE SubmissionId=@pending AND Status='checking' AND ExpiresAt>@now)
            THROW 51809,'ITCERT_CONFLICT',1;
          IF (SELECT COUNT(*) FROM ${certificateTable} WHERE ID=@certificate)<>1 THROW 51809,'ITCERT_AMBIGUOUS_ID',1;
          DELETE ${fileTable} WHERE SubmissionId=@pending;
          UPDATE ${certificateTable} SET ${nativeFields.map(field => field+'='+nativeValue(field)).join(',')} WHERE ID=@certificate;
        END
        ELSE
        BEGIN
          -- The original ID is not IDENTITY. Lock the table while allocating a new ID.
          SELECT @certificate=ISNULL(MAX(ID),0)+1 FROM ${certificateTable} WITH(TABLOCKX,HOLDLOCK);
          SELECT @sequence=ISNULL(MAX(Sequence),0)+1 FROM ${fileTable} WHERE ApplicationId=@application;
          INSERT ${certificateTable}(ID,${nativeFields.join(',')}) VALUES(@certificate,${nativeFields.map(nativeValue).join(',')});
        END;
        INSERT ${fileTable}(Id,ApplicationId,SubmissionId,CertificateId,Sequence,ActorReference,ActorSource,
          OriginalFileName,DeclaredContentType,DeclaredSizeBytes,Bucket,ObjectKey,ExpiresAt,CreatedAt,UpdatedAt)
        SELECT TRY_CONVERT(uniqueidentifier,JSON_VALUE(f.value,'$.id')),@application,@submission,@certificate,@sequence,
          JSON_VALUE(@input,'$.actor.reference'),JSON_VALUE(@input,'$.actor.source'),JSON_VALUE(f.value,'$.fileName'),
          JSON_VALUE(f.value,'$.contentType'),TRY_CONVERT(bigint,JSON_VALUE(f.value,'$.sizeBytes')),
          JSON_VALUE(@input,'$.bucket'),JSON_VALUE(f.value,'$.objectKey'),TRY_CONVERT(datetime2(3),JSON_VALUE(@input,'$.expiresAt'),127),@now,@now
          FROM OPENJSON(@input,'$.files') f;`);
    },
    claimSubmission(input) {
      return mutate(input,`${lockApplication}${editable}${sameToken}
        IF EXISTS(SELECT 1 FROM ${fileTable} WHERE SubmissionId=TRY_CONVERT(uniqueidentifier,JSON_VALUE(@input,'$.submissionId')) AND ExpiresAt<=@now)
          THROW 51810,'ITCERT_EXPIRED',1;
        IF EXISTS(SELECT 1 FROM ${fileTable} WHERE SubmissionId=TRY_CONVERT(uniqueidentifier,JSON_VALUE(@input,'$.submissionId')) AND Status<>'pending')
          THROW 51809,'ITCERT_CONFLICT',1;
        UPDATE ${fileTable} SET Status='checking',ClaimToken=TRY_CONVERT(uniqueidentifier,JSON_VALUE(@input,'$.claimToken')),UpdatedAt=@now
          WHERE SubmissionId=TRY_CONVERT(uniqueidentifier,JSON_VALUE(@input,'$.submissionId')) AND ApplicationId=@application AND Status='pending';
        IF @@ROWCOUNT=0 THROW 51809,'ITCERT_CONFLICT',1;`);
    },
    finishSubmission(input) {
      return mutate(input,`${lockApplication}${editable}${sameToken}
        DECLARE @submission uniqueidentifier=TRY_CONVERT(uniqueidentifier,JSON_VALUE(@input,'$.submissionId'));
        IF NOT EXISTS(SELECT 1 FROM ${fileTable} WHERE SubmissionId=@submission AND ApplicationId=@application)
          OR EXISTS(SELECT 1 FROM ${fileTable} WHERE SubmissionId=@submission AND
            (Status<>'checking' OR ClaimToken<>TRY_CONVERT(uniqueidentifier,JSON_VALUE(@input,'$.claimToken'))))
          THROW 51809,'ITCERT_CONFLICT',1;
        IF EXISTS(SELECT 1 FROM ${fileTable} WHERE SubmissionId=@submission AND ExpiresAt<=@now) THROW 51810,'ITCERT_EXPIRED',1;
        IF (SELECT COUNT(*) FROM ${fileTable} WHERE SubmissionId=@submission)<>(SELECT COUNT(*) FROM OPENJSON(@input,'$.files'))
          OR NOT EXISTS(SELECT 1 FROM OPENJSON(@input,'$.files')) THROW 51809,'ITCERT_CONFLICT',1;
        UPDATE f SET Status='completed',ClaimToken=NULL,InspectionJson=JSON_QUERY(j.value,'$.inspection'),CompletedAt=@now,UpdatedAt=@now
          FROM ${fileTable} f JOIN OPENJSON(@input,'$.files') j ON f.Id=TRY_CONVERT(uniqueidentifier,JSON_VALUE(j.value,'$.id'))
          WHERE f.SubmissionId=@submission AND f.ApplicationId=@application;
        IF @@ROWCOUNT<>(SELECT COUNT(*) FROM OPENJSON(@input,'$.files')) THROW 51809,'ITCERT_CONFLICT',1;`);
    },
    releaseSubmission(input) {
      return mutate(input,`${lockApplication}
        UPDATE ${fileTable} SET Status='pending',ClaimToken=NULL,UpdatedAt=@now
        WHERE SubmissionId=TRY_CONVERT(uniqueidentifier,JSON_VALUE(@input,'$.submissionId')) AND ApplicationId=@application AND Status='checking'
          AND ClaimToken=TRY_CONVERT(uniqueidentifier,JSON_VALUE(@input,'$.claimToken'));`);
    },
    review(input) {
      return mutate(input,`${lockApplication}${sameToken}
        IF @status<>'submitted' THROW 51809,'ITCERT_CONFLICT',1;
        DECLARE @review nvarchar(max)=(SELECT JSON_VALUE(@input,'$.decision') AS Decision,JSON_VALUE(@input,'$.reason') AS Reason,
          JSON_VALUE(@input,'$.verificationMethod') AS VerificationMethod,JSON_VALUE(@input,'$.actor.reference') AS ReviewerReference,
          JSON_VALUE(@input,'$.actor.name') AS ReviewerName,@now AS ReviewedAt FOR JSON PATH,WITHOUT_ARRAY_WRAPPER);
        UPDATE ${fileTable} SET ReviewJson=@review,UpdatedAt=@now WHERE SubmissionId=@current AND ApplicationId=@application;`);
    },
  });
}
