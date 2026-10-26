import {AppError} from '../../src/shared/errors/app-error.js';

// HTTP fixtures only. SQL concurrency and migration are tested against SQL Server separately.
export class MemoryRepository {
  records=new Map();
  version=0;
  catalogData={languages:[{Id:1,Code:'LN001',DisplayName:'Tiếng Anh',IsPublished:true,Revision:1}],
    types:[{Id:1,LanguageId:1,Code:'IELTS',DisplayName:'IELTS',IsPublished:true,Revision:1,
      FormSchema:{fields:[{key:'overall',label:'Điểm tổng',type:'number',required:true,min:0,max:9,step:0.5}]},Levels:[]}],
    policies:[{Id:1,LanguageId:1,CohortFrom:1900,CohortTo:null,IsRecognized:true,Revision:1}]};
  copy(value){return structuredClone(value);}
  touch(row){row.VersionToken=(++this.version).toString(16).padStart(16,'0').toUpperCase();row.UpdatedAt=new Date().toISOString();}
  async catalog(){return this.copy(this.catalogData);}
  async get(id){return this.copy(this.records.get(id)??null);}
  async list({actor,status,page,pageSize}){
    const rows=[...this.records.values()].filter(r=>(actor.role!=='student'||(r.ActorReference===actor.reference&&r.ActorSource===actor.source))
      &&(!status||(r.Status==='checking'?'uploading':r.Status)===status));
    return{page,pageSize,totalRecords:rows.length,items:this.copy(rows.slice((page-1)*pageSize,page*pageSize)
      .map(row=>({...row,CertificateTypeName:row.CatalogSnapshot.type.displayName})))};
  }
  check(input){const row=this.records.get(input.applicationId);
    if(!row)throw new AppError('Not found',404);
    if(input.actor.role==='student'&&(input.actor.reference!==row.ActorReference||input.actor.source!==row.ActorSource))throw new AppError('Forbidden',403);
    if(input.expected&&row.VersionToken!==input.expected)throw new AppError('Conflict',409);
    return row;}
  async prepareSubmission(input){
    let row=input.existing?this.check(input):{Id:input.applicationId,ActorReference:input.actor.reference,ActorSource:input.actor.source,
      StudentCode:input.actor.studentCode,CohortYear:input.actor.cohortYear,CreatedAt:new Date().toISOString()};
    if(input.existing&&!['uploading','needs_changes'].includes(row.Status))throw new AppError('Conflict',409);
    Object.assign(row,{CertificateTypeId:input.data.certificateTypeId,FullName:input.data.fullName,ClassName:input.data.className,
      Result:this.copy(input.data.result),CatalogSnapshot:this.copy(input.snapshot),IssuedOn:input.data.issuedOn,Notes:input.data.notes,
      ExpiresAt:input.expiresAt,Status:'uploading',SubmittedAt:null,ReviewedAt:null,ReviewerName:null,ReviewReason:null,
      Files:input.files.map(file=>({Id:file.id,Purpose:file.purpose,OriginalFileName:file.fileName,DeclaredContentType:file.contentType,
        DeclaredSizeBytes:file.sizeBytes,ObjectKey:file.objectKey,Status:'pending'}))});
    this.touch(row);this.records.set(row.Id,row);return this.get(row.Id);
  }
  async claimSubmission(input){const row=this.check(input);
    if(row.Status!=='uploading')throw new AppError('Conflict',409);
    row.Status='checking';row.ClaimToken=input.claimToken;this.touch(row);return this.get(row.Id);}
  async finishSubmission(input){const row=this.check(input);
    if(row.Status!=='checking'||row.ClaimToken!==input.claimToken)throw new AppError('Conflict',409);
    for(const file of row.Files){file.Status='completed';file.Inspection=input.files.find(f=>f.id===file.Id).inspection;}
    Object.assign(row,{Status:'submitted',ClaimToken:null,SubmittedAt:new Date().toISOString(),CatalogSnapshot:this.copy(input.snapshot)});
    this.touch(row);return this.get(row.Id);}
  async releaseSubmission(input){const row=this.check({...input,expected:null});
    if(row.Status==='checking'&&row.ClaimToken===input.claimToken){row.Status='uploading';row.ClaimToken=null;this.touch(row);}
    return this.get(row.Id);}
  async review(input){const row=this.check(input);if(row.Status!=='submitted')throw new AppError('Conflict',409);
    Object.assign(row,{Status:input.decision,ReviewerName:input.actor.name,ReviewerReference:input.actor.reference,
      ReviewedAt:new Date().toISOString(),ReviewReason:input.reason,VerificationMethod:input.verificationMethod});
    this.touch(row);return this.get(row.Id);}
}
export class MemoryStorage {
  bucket='test';objects=new Map();
  async presignUpload(key,type){return{url:'https://r2.example/'+key,method:'PUT',headers:{'Content-Type':type,'If-None-Match':'*'}};}
  async head(key){if(!this.objects.has(key))throw new AppError('Upload missing',502);return{sizeBytes:this.objects.get(key).length};}
  async read(key){return this.objects.get(key);}
  async remove(key){this.objects.delete(key);}
  async download(key){return'https://r2.example/'+key;}
}
