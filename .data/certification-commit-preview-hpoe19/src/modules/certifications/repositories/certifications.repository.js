import { queryLocalDatabase } from '../../../infrastructure/database/index.js';
import { env } from '../../../config/env.js';
import { AppError } from '../../../shared/errors/app-error.js';

const applicationSql = `SELECT a.Id,a.ActorReference,a.ActorSource,a.StudentCode,a.CohortYear,a.Status,a.CurrentSubmissionId,
 a.CreatedAt,a.UpdatedAt,CONVERT(varchar(16),CONVERT(varbinary(8),a.RowVersion),2) AS VersionToken,
 JSON_QUERY(COALESCE((SELECT s.Id,s.ApplicationId,s.Sequence,s.CertificateTypeId,s.FullName,s.ClassName,
   JSON_QUERY(s.ResultJson) AS Result,JSON_QUERY(s.CatalogSnapshotJson) AS CatalogSnapshot,s.IssuedOn,s.Notes,
   s.Status,s.ExpiresAt,s.ClaimToken,s.SubmittedAt,s.CreatedAt,s.UpdatedAt,CONVERT(varchar(16),CONVERT(varbinary(8),s.RowVersion),2) AS VersionToken,
   JSON_QUERY(COALESCE((SELECT f.*,JSON_QUERY(f.InspectionJson) AS Inspection FROM certification.EvidenceFiles f
     WHERE f.SubmissionId=s.Id ORDER BY f.CreatedAt,f.Id FOR JSON PATH),'[]')) AS Files,
   JSON_QUERY((SELECT r.* FROM certification.Reviews r WHERE r.SubmissionId=s.Id FOR JSON PATH,WITHOUT_ARRAY_WRAPPER)) AS Review
   FROM certification.Submissions s WHERE s.ApplicationId=a.Id ORDER BY s.Sequence DESC FOR JSON PATH),'[]')) AS Submissions
 FROM certification.Applications a WHERE a.Id=TRY_CONVERT(uniqueidentifier,JSON_VALUE(@input,'$.applicationId'))
 FOR JSON PATH,WITHOUT_ARRAY_WRAPPER`;

const lockApplication = `DECLARE @application uniqueidentifier=TRY_CONVERT(uniqueidentifier,JSON_VALUE(@input,'$.applicationId')),
 @status varchar(20),@token varchar(16),@current uniqueidentifier;
 SELECT @status=Status,@token=CONVERT(varchar(16),CONVERT(varbinary(8),RowVersion),2),@current=CurrentSubmissionId
 FROM certification.Applications WITH(UPDLOCK,HOLDLOCK) WHERE Id=@application;
 IF @status IS NULL THROW 51404,'CERT_NOT_FOUND',1;
 IF JSON_VALUE(@input,'$.actor.role')='student' AND NOT EXISTS(SELECT 1 FROM certification.Applications WHERE Id=@application
   AND ActorReference=JSON_VALUE(@input,'$.actor.reference') AND ActorSource=JSON_VALUE(@input,'$.actor.source'))
   THROW 51403,'CERT_FORBIDDEN',1;`;
const editable = "IF @status NOT IN('uploading','needs_changes') THROW 51409,'CERT_CONFLICT',1;";
const sameToken = "IF @token<>JSON_VALUE(@input,'$.expected') OR JSON_VALUE(@input,'$.expected') IS NULL THROW 51409,'CERT_CONFLICT',1;";
const lockPolicyVersions = `DECLARE @policyCount int;
 SELECT @policyCount=COUNT(*) FROM certification.RecognitionPolicies WITH(UPDLOCK,HOLDLOCK);
 IF @policyCount<>(SELECT COUNT(*) FROM OPENJSON(@input,'$.policyVersions')) OR EXISTS(
   SELECT 1 FROM OPENJSON(@input,'$.policyVersions') p LEFT JOIN certification.RecognitionPolicies r
   ON r.Id=TRY_CONVERT(int,JSON_VALUE(p.value,'$.id'))
   WHERE r.Id IS NULL OR r.Revision<>TRY_CONVERT(int,JSON_VALUE(p.value,'$.revision')))
   THROW 51409,'CERT_CONFLICT',1;
 IF NOT EXISTS(SELECT 1 FROM certification.CertificateTypes t WITH(UPDLOCK,HOLDLOCK)
   JOIN certification.Languages l WITH(UPDLOCK,HOLDLOCK) ON l.Id=t.LanguageId
   WHERE t.Id=TRY_CONVERT(int,JSON_VALUE(@input,'$.snapshot.type.id')) AND t.IsPublished=1 AND l.IsPublished=1
     AND l.Id=TRY_CONVERT(int,JSON_VALUE(@input,'$.snapshot.language.id')))
   THROW 51409,'CERT_CONFLICT',1;`;
const submissionFields = `CertificateTypeId=TRY_CONVERT(int,JSON_VALUE(@input,'$.data.certificateTypeId')),
 FullName=JSON_VALUE(@input,'$.data.fullName'),ClassName=JSON_VALUE(@input,'$.data.className'),
 ResultJson=JSON_QUERY(@input,'$.data.result'),CatalogSnapshotJson=JSON_QUERY(@input,'$.snapshot'),
 IssuedOn=TRY_CONVERT(date,JSON_VALUE(@input,'$.data.issuedOn'),23),Notes=JSON_VALUE(@input,'$.data.notes'),
 ExpiresAt=TRY_CONVERT(datetime2(3),JSON_VALUE(@input,'$.expiresAt'),127),UpdatedAt=@now`;

export function createCertificationsRepository({ query = queryLocalDatabase,
 databaseName = env.localDatabase.name, databaseHost = env.localDatabase.host } = {}) {
 async function run(statement,input = {}) {
   if (databaseName !== 'Studentpage' || !['localhost','127.0.0.1','::1'].includes(databaseHost.toLowerCase()))
     throw new AppError('Certification yêu cầu DB local Studentpage.',503);
   try {
     const result = await query('SET NOCOUNT ON; DECLARE @input nvarchar(max)=?; ' + statement,[JSON.stringify(input)]);
     return JSON.parse(result.first[0]?.Json ?? 'null');
   } catch(error) {
     if (error instanceof AppError) throw error;
     const message = error.message ?? '';
     if (/cannot insert the value null into column ['"]TemporaryObjectKey['"]/i.test(message))
       throw new AppError('Cấu trúc DB chứng chỉ chưa được cập nhật cho luồng upload mới.',503,
         {code:'CERT_SCHEMA_MIGRATION_REQUIRED',migration:'certification-direct-evidence-upload.sql'});
     const mapped = [
       ['CERT_NOT_FOUND',404,'Không tìm thấy bản ghi.'],['CERT_FORBIDDEN',403,'Không có quyền truy cập.'],
       ['CERT_CONFLICT',409,'Bản ghi đã thay đổi hoặc không được chỉnh sửa.'],
       ['CERT_EXPIRED',410,'Phiên upload đã hết hạn.'],['CERT_POLICY_OVERLAP',409,'Các khoảng khóa bị chồng lấn.'],
       ['CERT_',409,'Thao tác vi phạm trạng thái hoặc tính bất biến của hồ sơ.'],
     ].find(([code]) => message.includes(code));
     if (mapped) throw new AppError(mapped[2],mapped[1],{code:mapped[0]});
     if (/constraint|duplicate key/i.test(message)) throw new AppError('Dữ liệu bị trùng hoặc vi phạm ràng buộc.',409);
     throw new AppError('Không thể truy cập DB chứng chỉ local.',503,{code:'CERT_DATABASE_UNAVAILABLE'});
   }
 }
 async function mutate(input,statement,output = applicationSql) {
   return run(`SET XACT_ABORT ON; BEGIN TRY BEGIN TRANSACTION;
     DECLARE @now datetime2(3)=SYSUTCDATETIME();
     ${statement}
     SELECT (${output}) AS Json;
     COMMIT TRANSACTION;
     END TRY BEGIN CATCH IF XACT_STATE()<>0 ROLLBACK TRANSACTION; THROW; END CATCH;`,input);
 }
 const levelsSql = `JSON_QUERY(COALESCE((SELECT l.Id,l.Code,l.DisplayName,l.Weight
   FROM certification.CertificateLevels l WHERE l.CertificateTypeId=t.Id ORDER BY l.SortOrder,l.Id FOR JSON PATH),'[]')) AS Levels`;
 const catalogSql = `SELECT
   JSON_QUERY(COALESCE((SELECT *,CONVERT(varchar(16),CONVERT(varbinary(8),RowVersion),2) AS VersionToken FROM certification.Languages ORDER BY Id FOR JSON PATH),'[]')) AS languages,
   JSON_QUERY(COALESCE((SELECT t.*,JSON_QUERY(t.FormSchemaJson) AS FormSchema,${levelsSql},CONVERT(varchar(16),CONVERT(varbinary(8),t.RowVersion),2) AS VersionToken FROM certification.CertificateTypes t ORDER BY t.Id FOR JSON PATH),'[]')) AS types,
   JSON_QUERY(COALESCE((SELECT *,CONVERT(varchar(16),CONVERT(varbinary(8),RowVersion),2) AS VersionToken FROM certification.RecognitionPolicies ORDER BY Id FOR JSON PATH),'[]')) AS policies
   FOR JSON PATH,WITHOUT_ARRAY_WRAPPER`;
 const tables = {
   languages: { name:'Languages', fields:"Code=JSON_VALUE(@input,'$.data.code'),DisplayName=JSON_VALUE(@input,'$.data.displayName'),IsPublished=TRY_CONVERT(bit,JSON_VALUE(@input,'$.data.isPublished'))",
     columns:'Code,DisplayName,IsPublished', values:"JSON_VALUE(@input,'$.data.code'),JSON_VALUE(@input,'$.data.displayName'),TRY_CONVERT(bit,JSON_VALUE(@input,'$.data.isPublished'))" },
   types: { name:'CertificateTypes',fields:"LanguageId=TRY_CONVERT(int,JSON_VALUE(@input,'$.data.languageId')),BaseCertificateTypeId=TRY_CONVERT(int,JSON_VALUE(@input,'$.data.baseCertificateTypeId')),Code=JSON_VALUE(@input,'$.data.code'),DisplayName=JSON_VALUE(@input,'$.data.displayName'),FormSchemaJson=JSON_QUERY(@input,'$.data.formSchema'),IsPublished=TRY_CONVERT(bit,JSON_VALUE(@input,'$.data.isPublished'))",
     columns:'LanguageId,BaseCertificateTypeId,Code,DisplayName,FormSchemaJson,IsPublished', values:"TRY_CONVERT(int,JSON_VALUE(@input,'$.data.languageId')),TRY_CONVERT(int,JSON_VALUE(@input,'$.data.baseCertificateTypeId')),JSON_VALUE(@input,'$.data.code'),JSON_VALUE(@input,'$.data.displayName'),JSON_QUERY(@input,'$.data.formSchema'),TRY_CONVERT(bit,JSON_VALUE(@input,'$.data.isPublished'))" },
   policies: { name:'RecognitionPolicies',fields:"LanguageId=TRY_CONVERT(int,JSON_VALUE(@input,'$.data.languageId')),CertificateTypeId=TRY_CONVERT(int,JSON_VALUE(@input,'$.data.certificateTypeId')),CohortFrom=TRY_CONVERT(smallint,JSON_VALUE(@input,'$.data.cohortFrom')),CohortTo=TRY_CONVERT(smallint,JSON_VALUE(@input,'$.data.cohortTo')),IsRecognized=TRY_CONVERT(bit,JSON_VALUE(@input,'$.data.isRecognized')),Reason=JSON_VALUE(@input,'$.data.reason'),DocumentReference=JSON_VALUE(@input,'$.data.documentReference')",
     columns:'LanguageId,CertificateTypeId,CohortFrom,CohortTo,IsRecognized,Reason,DocumentReference', values:"TRY_CONVERT(int,JSON_VALUE(@input,'$.data.languageId')),TRY_CONVERT(int,JSON_VALUE(@input,'$.data.certificateTypeId')),TRY_CONVERT(smallint,JSON_VALUE(@input,'$.data.cohortFrom')),TRY_CONVERT(smallint,JSON_VALUE(@input,'$.data.cohortTo')),TRY_CONVERT(bit,JSON_VALUE(@input,'$.data.isRecognized')),JSON_VALUE(@input,'$.data.reason'),JSON_VALUE(@input,'$.data.documentReference')" },
 };
 return Object.freeze({
   catalog() { return run('SELECT ('+catalogSql+') AS Json;'); },
   saveCatalog(kind,input) {
     const table = tables[kind];
     if (!table) throw new TypeError('Unknown catalog kind');
     // Table/column fragments are fixed code; all external values remain bound JSON.
     const statement = input.id ? `DECLARE @id int=TRY_CONVERT(int,JSON_VALUE(@input,'$.id'));
       IF NOT EXISTS(SELECT 1 FROM certification.${table.name} WITH(UPDLOCK,HOLDLOCK) WHERE Id=@id) THROW 51404,'CERT_NOT_FOUND',1;
       ${kind === 'types' ? "IF EXISTS(SELECT 1 FROM certification.Submissions s JOIN certification.CertificateTypes t ON t.Id=s.CertificateTypeId WHERE t.Id=@id AND t.LanguageId<>TRY_CONVERT(int,JSON_VALUE(@input,'$.data.languageId'))) THROW 51409,'CERT_CONFLICT',1;" : ''}
       UPDATE certification.${table.name} SET ${table.fields},Revision=Revision+1,UpdatedAt=@now
         WHERE Id=@id AND CONVERT(varchar(16),CONVERT(varbinary(8),RowVersion),2)=JSON_VALUE(@input,'$.expected');
       IF @@ROWCOUNT=0 THROW 51409,'CERT_CONFLICT',1;`
       : `INSERT certification.${table.name}(${table.columns}) VALUES(${table.values}); DECLARE @id int=CONVERT(int,SCOPE_IDENTITY());`;
     return mutate(input,statement,`SELECT t.*,CONVERT(varchar(16),CONVERT(varbinary(8),t.RowVersion),2) AS VersionToken
       ${kind === 'types' ? ',JSON_QUERY(t.FormSchemaJson) AS FormSchema,'+levelsSql : ''}
       FROM certification.${table.name} t WHERE t.Id=@id FOR JSON PATH,WITHOUT_ARRAY_WRAPPER`);
   },
   get(applicationId) { return run('SELECT ('+applicationSql+') AS Json;',{applicationId}); },
   list(input) {
     const filter = `(JSON_VALUE(@input,'$.actor.role')<>'student' OR
       (a.ActorReference=JSON_VALUE(@input,'$.actor.reference') AND a.ActorSource=JSON_VALUE(@input,'$.actor.source')))
       AND(JSON_VALUE(@input,'$.status') IS NULL OR a.Status=JSON_VALUE(@input,'$.status'))`;
     return run(`DECLARE @page int=TRY_CONVERT(int,JSON_VALUE(@input,'$.page')),@pageSize int=TRY_CONVERT(int,JSON_VALUE(@input,'$.pageSize'));
       SELECT (SELECT @page AS page,@pageSize AS pageSize,
       (SELECT COUNT(*) FROM certification.Applications a WHERE ${filter}) AS totalRecords,
       JSON_QUERY(COALESCE((SELECT a.Id,a.StudentCode,a.CohortYear,a.Status,a.CreatedAt,a.UpdatedAt,a.CurrentSubmissionId,
         CONVERT(varchar(16),CONVERT(varbinary(8),a.RowVersion),2) AS VersionToken,s.FullName,s.CertificateTypeId,s.CertificateTypeName
         FROM certification.Applications a OUTER APPLY(SELECT TOP(1) FullName,CertificateTypeId,
           JSON_VALUE(CatalogSnapshotJson,'$.type.displayName') AS CertificateTypeName
           FROM certification.Submissions WHERE ApplicationId=a.Id ORDER BY Sequence DESC)s
         WHERE ${filter} ORDER BY a.CreatedAt DESC,a.Id OFFSET (@page-1)*@pageSize ROWS FETCH NEXT @pageSize ROWS ONLY
         FOR JSON PATH),'[]')) AS items FOR JSON PATH,WITHOUT_ARRAY_WRAPPER) AS Json;`,input);
   },
   prepareSubmission(input) {
     return mutate(input,`
       DECLARE @submission uniqueidentifier=TRY_CONVERT(uniqueidentifier,JSON_VALUE(@input,'$.submissionId'));
       ${input.existing ? lockApplication+editable+sameToken : `DECLARE @application uniqueidentifier=TRY_CONVERT(uniqueidentifier,JSON_VALUE(@input,'$.applicationId'));
         INSERT certification.Applications(Id,ActorReference,ActorSource,StudentCode,CohortYear,CreatedAt,UpdatedAt)
         VALUES(@application,JSON_VALUE(@input,'$.actor.reference'),JSON_VALUE(@input,'$.actor.source'),
           JSON_VALUE(@input,'$.actor.studentCode'),TRY_CONVERT(smallint,JSON_VALUE(@input,'$.actor.cohortYear')),@now,@now);`}
       ${lockPolicyVersions}
       IF NOT EXISTS(SELECT 1 FROM certification.CertificateTypes WHERE Id=TRY_CONVERT(int,JSON_VALUE(@input,'$.data.certificateTypeId'))
         AND Revision=TRY_CONVERT(int,JSON_VALUE(@input,'$.snapshot.type.revision'))) THROW 51409,'CERT_CONFLICT',1;
       DECLARE @pending uniqueidentifier,@pendingStatus varchar(20),@expires datetime2(3);
       SELECT @pending=Id,@pendingStatus=Status,@expires=ExpiresAt FROM certification.Submissions WITH(UPDLOCK,HOLDLOCK)
         WHERE ApplicationId=@application AND Status<>'submitted';
       IF @pending IS NOT NULL
       BEGIN
         IF @pending<>@submission OR(@pendingStatus='checking' AND @expires>@now) THROW 51409,'CERT_CONFLICT',1;
         UPDATE certification.Submissions SET Status='uploading',ClaimToken=NULL WHERE Id=@pending;
         DELETE certification.EvidenceFiles WHERE SubmissionId=@pending;
         UPDATE certification.Submissions SET ${submissionFields} WHERE Id=@pending;
       END
       ELSE
       BEGIN
         DECLARE @sequence int=(SELECT ISNULL(MAX(Sequence),0)+1 FROM certification.Submissions WHERE ApplicationId=@application);
         INSERT certification.Submissions(Id,ApplicationId,Sequence,CertificateTypeId,FullName,ClassName,ResultJson,
           CatalogSnapshotJson,IssuedOn,Notes,ExpiresAt,CreatedAt,UpdatedAt)
         VALUES(@submission,@application,@sequence,TRY_CONVERT(int,JSON_VALUE(@input,'$.data.certificateTypeId')),
           JSON_VALUE(@input,'$.data.fullName'),JSON_VALUE(@input,'$.data.className'),JSON_QUERY(@input,'$.data.result'),
           JSON_QUERY(@input,'$.snapshot'),TRY_CONVERT(date,JSON_VALUE(@input,'$.data.issuedOn'),23),
           JSON_VALUE(@input,'$.data.notes'),TRY_CONVERT(datetime2(3),JSON_VALUE(@input,'$.expiresAt'),127),@now,@now);
       END;
       -- v3 requires a unique, non-null legacy key. Keep an unused metadata value
       -- without creating any corresponding R2 object. New v4 schemas omit it.
       -- Dynamic SQL avoids referencing a missing column when running on v4.
       DECLARE @legacyFileKey bit=CASE WHEN COL_LENGTH(N'certification.EvidenceFiles',N'TemporaryObjectKey') IS NULL THEN 0 ELSE 1 END;
       DECLARE @filesSql nvarchar(max)=N'INSERT certification.EvidenceFiles(
         Id,SubmissionId,Purpose,OriginalFileName,DeclaredContentType,DeclaredSizeBytes,Bucket,ObjectKey,CreatedAt'
         +CASE WHEN @legacyFileKey=1 THEN N',TemporaryObjectKey' ELSE N'' END+N')
       SELECT TRY_CONVERT(uniqueidentifier,JSON_VALUE(f.value,''$.id'')),@submission,JSON_VALUE(f.value,''$.purpose''),
         JSON_VALUE(f.value,''$.fileName''),JSON_VALUE(f.value,''$.contentType''),TRY_CONVERT(bigint,JSON_VALUE(f.value,''$.sizeBytes'')),
         JSON_VALUE(@input,''$.bucket''),JSON_VALUE(f.value,''$.objectKey''),@now'
         +CASE WHEN @legacyFileKey=1 THEN N',JSON_VALUE(f.value,''$.objectKey'')+''.legacy-unused''' ELSE N'' END+N'
         FROM OPENJSON(@input,''$.files'') f;';
       EXEC sys.sp_executesql @filesSql,N'@input nvarchar(max),@submission uniqueidentifier,@now datetime2(3)',
         @input=@input,@submission=@submission,@now=@now;
       UPDATE certification.Applications SET UpdatedAt=@now WHERE Id=@application;
     `);
   },
   claimSubmission(input) {
     return mutate(input,`${lockApplication}${editable}${sameToken}
       DECLARE @submission uniqueidentifier=TRY_CONVERT(uniqueidentifier,JSON_VALUE(@input,'$.submissionId'));
       IF EXISTS(SELECT 1 FROM certification.Submissions WHERE Id=@submission AND ExpiresAt<=@now) THROW 51410,'CERT_EXPIRED',1;
       UPDATE certification.Submissions SET Status='checking',
         ClaimToken=TRY_CONVERT(uniqueidentifier,JSON_VALUE(@input,'$.claimToken')),UpdatedAt=@now
         WHERE Id=@submission AND ApplicationId=@application AND Status='uploading';
       IF @@ROWCOUNT=0 THROW 51409,'CERT_CONFLICT',1;
     `);
   },
   finishSubmission(input) {
     return mutate(input,`${lockApplication}${editable}${sameToken}
       ${lockPolicyVersions}
       DECLARE @submission uniqueidentifier=TRY_CONVERT(uniqueidentifier,JSON_VALUE(@input,'$.submissionId'));
       IF NOT EXISTS(SELECT 1 FROM certification.Submissions WITH(UPDLOCK,HOLDLOCK) WHERE Id=@submission
         AND ApplicationId=@application AND Status='checking' AND ClaimToken=TRY_CONVERT(uniqueidentifier,JSON_VALUE(@input,'$.claimToken')))
         THROW 51409,'CERT_CONFLICT',1;
       IF EXISTS(SELECT 1 FROM certification.Submissions WHERE Id=@submission AND ExpiresAt<=@now) THROW 51410,'CERT_EXPIRED',1;
       IF (SELECT COUNT(*) FROM certification.EvidenceFiles WHERE SubmissionId=@submission)
         <>(SELECT COUNT(*) FROM OPENJSON(@input,'$.files')) OR NOT EXISTS(SELECT 1 FROM OPENJSON(@input,'$.files'))
         THROW 51409,'CERT_CONFLICT',1;
       UPDATE f SET Status='completed',InspectionJson=JSON_QUERY(j.value,'$.inspection'),CompletedAt=@now
         FROM certification.EvidenceFiles f JOIN OPENJSON(@input,'$.files') j
         ON f.Id=TRY_CONVERT(uniqueidentifier,JSON_VALUE(j.value,'$.id')) WHERE f.SubmissionId=@submission AND f.Status='pending';
       IF @@ROWCOUNT<>(SELECT COUNT(*) FROM OPENJSON(@input,'$.files')) THROW 51409,'CERT_CONFLICT',1;
       UPDATE certification.Submissions SET Status='submitted',ClaimToken=NULL,SubmittedAt=@now,UpdatedAt=@now,
         CatalogSnapshotJson=JSON_QUERY(@input,'$.snapshot') WHERE Id=@submission;
       UPDATE certification.Applications SET Status='submitted',CurrentSubmissionId=@submission,UpdatedAt=@now WHERE Id=@application;
     `);
   },
   releaseSubmission(input) {
     return mutate(input,`
       UPDATE certification.Submissions SET Status='uploading',ClaimToken=NULL,UpdatedAt=@now
         WHERE Id=TRY_CONVERT(uniqueidentifier,JSON_VALUE(@input,'$.submissionId')) AND Status='checking'
         AND ClaimToken=TRY_CONVERT(uniqueidentifier,JSON_VALUE(@input,'$.claimToken'));
     `);
   },
   review(input) {
     return mutate(input,`${lockApplication}${sameToken}
       IF @status<>'submitted' THROW 51409,'CERT_CONFLICT',1;
       INSERT certification.Reviews(SubmissionId,ReviewerReference,ReviewerName,ActorSource,Decision,Reason,VerificationMethod,ReviewedApplicationRowVersion,ReviewedAt)
       VALUES(@current,JSON_VALUE(@input,'$.actor.reference'),JSON_VALUE(@input,'$.actor.name'),JSON_VALUE(@input,'$.actor.source'),
         JSON_VALUE(@input,'$.decision'),JSON_VALUE(@input,'$.reason'),JSON_VALUE(@input,'$.verificationMethod'),CONVERT(binary(8),@token,2),@now);
       UPDATE certification.Applications SET Status=JSON_VALUE(@input,'$.decision'),UpdatedAt=@now WHERE Id=@application;
     `);
   },
 });
}
