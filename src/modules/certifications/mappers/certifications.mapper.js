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
export function applicationDto(row) {
  return { id:id(row.Id),studentCode:row.StudentCode,cohortYear:row.CohortYear,
    rowVersion:row.VersionToken,fullName:row.FullName,className:row.ClassName,
    certificateTypeId:row.CertificateTypeId,result:row.Result,
    catalogSnapshot:row.CatalogSnapshot,issuedOn:row.IssuedOn?.slice(0,10),notes:row.Notes ?? null,
    status:row.Status === 'checking' ? 'uploading' : row.Status,processing:row.Status === 'checking',
    expiresAt:utc(row.ExpiresAt),submittedAt:utc(row.SubmittedAt),createdAt:utc(row.CreatedAt),updatedAt:utc(row.UpdatedAt),
    files:(row.Files ?? []).map(fileDto),
    review:row.ReviewedAt ? {decision:row.Status,reason:row.ReviewReason ?? null,
      verificationMethod:row.VerificationMethod,reviewerName:row.ReviewerName,reviewedAt:utc(row.ReviewedAt)} : null };
}
export function listDto(result) {
  return {page:result.page,pageSize:result.pageSize,totalRecords:result.totalRecords,
    totalPages:Math.ceil(result.totalRecords/result.pageSize),
    items:(result.items ?? []).map(row => ({id:id(row.Id),studentCode:row.StudentCode,cohortYear:row.CohortYear,
      status:row.Status==='checking'?'uploading':row.Status,processing:row.Status==='checking',fullName:row.FullName ?? null,certificateTypeId:row.CertificateTypeId ?? null,
      certificateTypeName:row.CertificateTypeName ?? null,rowVersion:row.VersionToken,
      createdAt:utc(row.CreatedAt),updatedAt:utc(row.UpdatedAt)}))};
}
