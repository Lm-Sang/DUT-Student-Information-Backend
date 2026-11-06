import { requestDeadlines } from '../../request-regulations/index.js';
import {fileDto} from './certifications.mapper.js';
import {certificationReviewActions} from '../rules/certifications.rules.js';

const id=value=>value?.toLowerCase();
const utc=value=>value?new Date(/[zZ]|[+-]\d\d:\d\d$/.test(value)?value:value+'Z').toISOString():null;
export function itSubmissionDto(row) {
  return{id:id(row.Id),sequence:row.Sequence,data:row.Certificate,certificateTypeName:row.CertificateTypeName??null,
    status:row.Status==='checking'?'uploading':row.Status,processing:row.Status==='checking',expiresAt:utc(row.ExpiresAt),
    submittedAt:utc(row.SubmittedAt),createdAt:utc(row.CreatedAt),files:(row.Files??[]).map(file=>fileDto({...file,Purpose:'general'})),
    review:row.Review?{decision:row.Review.Decision,reason:row.Review.Reason??null,verificationMethod:row.Review.VerificationMethod,
      reviewerName:row.Review.ReviewerName,reviewedAt:utc(row.Review.ReviewedAt)}:null};
}
export function itApplicationDto(row, now = new Date()) {
  const submissions=row.Submissions??[],current=submissions.find(s=>id(s.Id)===id(row.CurrentSubmissionId));
  const pending=submissions.find(s=>s.Status!=='submitted');
  return{id:id(row.Id),studentCode:row.StudentCode,status:row.Status,rowVersion:row.VersionToken,
    ...requestDeadlines({kind:'certificate',status:row.Status,submittedAt:current?.SubmittedAt,receivedAt:current?.Review?.ReviewedAt}, now),
    allowedActions:certificationReviewActions(row.Status),
    fullName:row.StudentSnapshot?.fullName ?? null,className:row.StudentSnapshot?.className ?? null,cccd:row.StudentSnapshot?.cccd ?? null,
    createdAt:utc(row.CreatedAt),updatedAt:utc(row.UpdatedAt),currentSubmission:current?itSubmissionDto(current):null,
    pendingSubmission:pending?itSubmissionDto(pending):null,submissions:submissions.filter(s=>s.Status==='submitted').map(itSubmissionDto)};
}
export function itListDto(result, now = new Date()) {
  return{page:result.page,pageSize:result.pageSize,totalRecords:result.totalRecords,totalPages:Math.ceil(result.totalRecords/result.pageSize),
    items:(result.items??[]).map(row=>({id:id(row.Id),studentCode:row.StudentCode,status:row.Status,rowVersion:row.VersionToken,
      fullName:row.StudentSnapshot?.fullName ?? null,className:row.StudentSnapshot?.className ?? null,cccd:row.StudentSnapshot?.cccd ?? null,
      ...requestDeadlines({kind:'certificate',status:row.Status,submittedAt:row.SubmittedAt,receivedAt:row.ReviewedAt}, now),
      data:row.Certificate,certificateTypeName:row.CertificateTypeName??null,
      createdAt:utc(row.CreatedAt),updatedAt:utc(row.UpdatedAt)}))};
}
