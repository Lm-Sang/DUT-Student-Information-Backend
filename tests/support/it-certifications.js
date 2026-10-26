import {AppError} from '../../src/shared/errors/app-error.js';

// IT API fixtures for the combined local FE; real SQL relationships have separate integration tests.
export class MemoryItRepository {
  applications=new Map();version=0;nextId=1;
  types=[{ID:1,MaCC:'CNTT01',TenCC:'Chứng chỉ CNTT cơ bản'},{ID:2,MaCC:'CNTT02',TenCC:'Chứng chỉ CNTT nâng cao'}];
  touch(row){row.VersionToken=(++this.version).toString(16).padStart(16,'0').toUpperCase();row.UpdatedAt=new Date().toISOString();}
  async catalog(){return structuredClone(this.types);}
  async get(id){return structuredClone(this.applications.get(id)??null);}
  check(input){const row=this.applications.get(input.applicationId);if(!row)throw new AppError('Not found',404);
    if(input.expected&&input.expected!==row.VersionToken)throw new AppError('Conflict',409);return row;}
  async list({actor,status,page,pageSize}){
    const rows=[...this.applications.values()].filter(r=>(actor.role==='reviewer'||r.ActorReference===actor.reference&&r.ActorSource===actor.source)&&(!status||status===r.Status));
    return{page,pageSize,totalRecords:rows.length,items:structuredClone(rows.slice((page-1)*pageSize,page*pageSize).map(r=>({...r,
      Certificate:r.Submissions[0].Certificate,CertificateTypeName:r.Submissions[0].CertificateTypeName})))};
  }
  async prepareSubmission(input){
    const row=input.existing?this.check(input):{Id:input.applicationId,ActorReference:input.actor.reference,ActorSource:input.actor.source,
      StudentCode:input.actor.studentCode,Status:'uploading',CreatedAt:new Date().toISOString(),CurrentSubmissionId:null,Submissions:[]};
    let sub=row.Submissions.find(s=>s.Status!=='submitted');
    if(!sub){sub={Id:input.submissionId,Sequence:row.Submissions.length+1,Certificate:{ID:this.nextId++},CreatedAt:new Date().toISOString()};row.Submissions.unshift(sub);}
    Object.assign(sub,{Certificate:{...sub.Certificate,...input.data},CertificateTypeName:this.types.find(t=>t.MaCC===input.data.MaCC).TenCC,
      ExpiresAt:input.expiresAt,Status:'uploading',Files:input.files.map(f=>({Id:f.id,ObjectKey:f.objectKey,
        DeclaredContentType:f.contentType,DeclaredSizeBytes:f.sizeBytes,OriginalFileName:f.fileName,Status:'pending'}))});
    this.touch(row);this.applications.set(row.Id,row);return this.get(row.Id);
  }
  async claimSubmission(input){const row=this.check(input),sub=row.Submissions.find(s=>s.Id===input.submissionId);
    if(sub.Status!=='uploading')throw new AppError('Conflict',409);sub.Status='checking';sub.ClaimToken=input.claimToken;this.touch(row);return this.get(row.Id);}
  async finishSubmission(input){const row=this.check(input),sub=row.Submissions.find(s=>s.Id===input.submissionId);
    if(sub.Status!=='checking'||sub.ClaimToken!==input.claimToken)throw new AppError('Conflict',409);
    for(const f of sub.Files){f.Status='completed';f.Inspection=input.files.find(result=>result.id===f.Id).inspection;}
    sub.Status='submitted';sub.SubmittedAt=new Date().toISOString();row.Status='submitted';row.CurrentSubmissionId=sub.Id;
    this.touch(row);return this.get(row.Id);}
  async releaseSubmission(input){const row=this.check({...input,expected:null}),sub=row.Submissions.find(s=>s.Id===input.submissionId);
    if(sub.Status==='checking'&&sub.ClaimToken===input.claimToken)sub.Status='uploading';this.touch(row);return this.get(row.Id);}
  async review(input){const row=this.check(input);if(row.Status!=='submitted')throw new AppError('Conflict',409);
    const sub=row.Submissions.find(s=>s.Id===row.CurrentSubmissionId);
    sub.Review={Decision:input.decision,Reason:input.reason,VerificationMethod:input.verificationMethod,ReviewerName:input.actor.name,ReviewedAt:new Date().toISOString()};
    row.Status=input.decision;this.touch(row);return this.get(row.Id);}
}
