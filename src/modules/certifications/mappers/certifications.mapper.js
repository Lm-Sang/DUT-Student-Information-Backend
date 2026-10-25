import { resolveFormSchema } from '../domain/certifications.rules.js';

const id = value => value?.toLowerCase();
const utc = value => value ? new Date(/[zZ]|[+-]\d\d:\d\d$/.test(value) ? value : value+'Z').toISOString() : null;
export const languageDto = row => ({
  id:row.Id,code:row.Code,displayName:row.DisplayName,isPublished:Boolean(row.IsPublished),revision:row.Revision,rowVersion:row.VersionToken,
  isSchoolProvided:Boolean(row.IsSchoolProvided),
});
export const typeDto = row => ({
  id:row.Id,languageId:row.LanguageId ?? null,code:row.Code,displayName:row.DisplayName,isPublished:Boolean(row.IsPublished),
  formSchema:resolveFormSchema(row.FormSchema,row.Levels),revision:row.Revision,rowVersion:row.VersionToken,
  isSchoolProvided:Boolean(row.IsSchoolProvided),baseCertificateTypeId:row.BaseCertificateTypeId ?? null,
  levels:(row.Levels ?? []).map(level => ({id:level.Id,code:level.Code ?? null,
    displayName:level.DisplayName ?? null,weight:level.Weight ?? null})),
});
export const policyDto = row => ({
  id:row.Id,languageId:row.LanguageId ?? null,certificateTypeId:row.CertificateTypeId ?? null,
  cohortFrom:row.CohortFrom,cohortTo:row.CohortTo ?? null,isRecognized:Boolean(row.IsRecognized),
  reason:row.Reason ?? null,documentReference:row.DocumentReference ?? null,revision:row.Revision,rowVersion:row.VersionToken,
});
export function fileDto(file) {
  const inspection = file.Inspection;
  return { id:id(file.Id),purpose:file.Purpose,fileName:file.OriginalFileName,contentType:file.DeclaredContentType,
    sizeBytes:file.DeclaredSizeBytes,status:file.Status,
    quality:inspection ? {status:inspection.status,reasons:inspection.reasons,metrics:inspection.metrics,
      widthPixels:inspection.widthPixels,heightPixels:inspection.heightPixels,
      algorithm:inspection.algorithmName,algorithmVersion:inspection.algorithmVersion} : null };
}
export function submissionDto(row) {
  return { id:id(row.Id),sequence:row.Sequence,fullName:row.FullName,className:row.ClassName,
    certificateTypeId:row.CertificateTypeId,result:row.Result,
    catalogSnapshot:row.CatalogSnapshot,issuedOn:row.IssuedOn?.slice(0,10),notes:row.Notes ?? null,
    status:row.Status === 'checking' ? 'uploading' : row.Status,processing:row.Status === 'checking',
    expiresAt:utc(row.ExpiresAt),submittedAt:utc(row.SubmittedAt),createdAt:utc(row.CreatedAt),
    files:(row.Files ?? []).map(fileDto),
    review:row.Review ? {decision:row.Review.Decision,reason:row.Review.Reason ?? null,
      verificationMethod:row.Review.VerificationMethod,reviewerName:row.Review.ReviewerName,reviewedAt:utc(row.Review.ReviewedAt)} : null };
}
export function applicationDto(row) {
  const submissions = row.Submissions ?? [];
  return { id:id(row.Id),studentCode:row.StudentCode,cohortYear:row.CohortYear,status:row.Status,rowVersion:row.VersionToken,
    createdAt:utc(row.CreatedAt),updatedAt:utc(row.UpdatedAt),
    currentSubmission:submissions.find(s => s.Id.toLowerCase() === row.CurrentSubmissionId?.toLowerCase())
      ? submissionDto(submissions.find(s => s.Id.toLowerCase() === row.CurrentSubmissionId?.toLowerCase())) : null,
    pendingSubmission:submissions.some(s => s.Status !== 'submitted') ? submissionDto(submissions.find(s => s.Status !== 'submitted')) : null,
    submissions:submissions.filter(s => s.Status === 'submitted').map(submissionDto) };
}
export function listDto(result) {
  return {page:result.page,pageSize:result.pageSize,totalRecords:result.totalRecords,
    totalPages:Math.ceil(result.totalRecords/result.pageSize),
    items:(result.items ?? []).map(row => ({id:id(row.Id),studentCode:row.StudentCode,cohortYear:row.CohortYear,
      status:row.Status,fullName:row.FullName ?? null,certificateTypeId:row.CertificateTypeId ?? null,
      certificateTypeName:row.CertificateTypeName ?? null,rowVersion:row.VersionToken,
      createdAt:utc(row.CreatedAt),updatedAt:utc(row.UpdatedAt)}))};
}
