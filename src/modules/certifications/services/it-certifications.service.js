import {randomUUID} from 'node:crypto';
import {AppError} from '../../../shared/errors/app-error.js';
import {validateItData} from '../dto/it-certifications.request.dto.js';
import {itApplicationDto,itListDto} from '../mappers/it-certifications.mapper.js';
import {canEdit} from '../domain/certifications.rules.js';
import {inspectEvidenceFiles} from './inspect-evidence-files.js';
import {notifyCertificateChanged} from './certification-events.js';

export function createItCertificationsService({repository,storage,inspectImage,config,clock=()=>new Date(),events,inspectionQueue}) {
  function profile(actor){
    if(actor?.role!=='student'||!/^\d{9}$/.test(actor.studentCode??''))
      throw new AppError('Cần hồ sơ sinh viên đã xác thực và MSSV hợp lệ.',403);
  }
  async function load(actor,applicationId){
    if(!['student','reviewer'].includes(actor?.role))throw new AppError('Không có quyền truy cập.',403);
    const application=await repository.get(applicationId);
    if(!application)throw new AppError('Không tìm thấy hồ sơ tin học.',404);
    if(actor.role==='student'&&(application.ActorReference!==actor.reference||application.ActorSource!==actor.source))
      throw new AppError('Không được truy cập hồ sơ này.',403);
    return application;
  }
  return Object.freeze({
    async form(actor){
      profile(actor);
      return{catalog:await repository.catalog(),fields:[
        {key:'SoHieu',label:'Số hiệu',type:'text',required:false,maxLength:20},
        {key:'CoSoCapCC',label:'Cơ sở cấp chứng chỉ',type:'text',required:true,maxLength:250},
        {key:'SoVaoSo',label:'Số vào sổ',type:'text',required:false,maxLength:30},
        {key:'MaCC',label:'Tên chứng chỉ',type:'select',required:true,maxLength:10,optionLabelKey:'TenCC',optionValueKey:'MaCC'},
        {key:'NgayCC',label:'Ngày cấp',type:'date',required:false},
      ],student:{studentCode:actor.studentCode,fullName:actor.name??'',className:actor.className??''},
      maxFiles:config.maxFiles,maxFileBytes:config.maxFileBytes,
      imageValidation:{maxPixels:config.maxPixels,minImageSide:config.minImageSide,blurThreshold:config.blurThreshold}};
    },
    async records(actor,query){
      if(!['student','reviewer'].includes(actor?.role))throw new AppError('Không có quyền truy cập.',403);
      if(actor.role==='student')profile(actor);
      const result=await repository.records({...query,actor});
      return{...result,page:query.page,pageSize:query.pageSize,totalPages:Math.ceil(result.totalRecords/query.pageSize)};
    },
    async list(actor,query){return itListDto(await repository.list({...query,actor}));},
    async get(actor,applicationId){return itApplicationDto(await load(actor,applicationId));},
    async prepare(actor,input){
      profile(actor);
      const data=validateItData(input.data,actor.studentCode);
      if(data.MaHS!==actor.studentCode)throw new AppError('Mã hồ sơ phải khớp sinh viên đang đăng nhập.',403);
      if(!(await repository.catalog()).some(item=>item.MaCC===data.MaCC))
        throw new AppError('Mã chứng chỉ không có trong danh mục tin học.',400,{field:'MaCC'});
      const applicationId=input.applicationId??randomUUID();
      let submissionId=randomUUID(),expected=null;
      if(input.applicationId){
        const application=await load(actor,applicationId);
        if(!canEdit(application.Status))throw new AppError('Chỉ được sửa hồ sơ chưa nộp hoặc được yêu cầu bổ sung.',409);
        if(application.StudentCode!==actor.studentCode)throw new AppError('MSSV không khớp hồ sơ.',403);
        submissionId=application.Submissions.find(s=>s.Status!=='submitted')?.Id??submissionId;
        expected=application.VersionToken;
      }
      if(!storage.bucket)throw new AppError('Chưa cấu hình bucket R2.',503);
      const expiresAt=new Date(clock().getTime()+config.uploadTtlSeconds*1000).toISOString();
      const files=[],uploads=[];
      for(const file of input.files){
        const id=randomUUID(),objectKey='certifications/evidence/it/'+applicationId+'/'+submissionId+'/'+id;
        const signed=await storage.presignUpload(objectKey,file.contentType,config.uploadTtlSeconds);
        files.push({...file,id,objectKey});uploads.push({id,purpose:'general',fileName:file.fileName,...signed,expiresAt});
      }
      const prepared=await repository.prepareSubmission({actor,applicationId,submissionId,expected,existing:Boolean(input.applicationId),
        data,files,bucket:storage.bucket,expiresAt});
      notifyCertificateChanged(events,'it',prepared);
      return{applicationId,expiresAt,uploads};
    },
    async complete(actor,applicationId){
      profile(actor);
      const application=await load(actor,applicationId),pending=application.Submissions.find(s=>s.Status!=='submitted');
      if(!pending&&application.CurrentSubmissionId)return itApplicationDto(application);
      if(!pending||!canEdit(application.Status))throw new AppError('Hồ sơ không thể nộp thêm.',409);
      const {ID,...data}=pending.Certificate;
      validateItData(data);
      const reference={actor,applicationId,submissionId:pending.Id,expected:application.VersionToken,claimToken:randomUUID()};
      const claimed=await repository.claimSubmission(reference);
      if(claimed?.VersionToken)reference.expected=claimed.VersionToken;
      try{
        const files=await inspectEvidenceFiles(pending.Files,{storage,inspectImage,config,inspectionQueue});
        const result=await repository.finishSubmission({...reference,files});
        notifyCertificateChanged(events,'it',result);
        return itApplicationDto(result);
      }catch(error){
        // Valid objects remain available if a DB response or an R2 read is lost.
        await repository.releaseSubmission(reference).catch(()=>{});throw error;
      }
    },
    async review(actor,applicationId,expected,input){
      if(actor.role!=='reviewer')throw new AppError('Không có quyền xét duyệt.',403);
      const application=await load(actor,applicationId);
      if(application.Status!=='submitted'||application.VersionToken!==expected)throw new AppError('Hồ sơ đã thay đổi hoặc không còn chờ duyệt.',409);
      const result=await repository.review({actor,applicationId,expected,...input,reviewId:randomUUID()});
      notifyCertificateChanged(events,'it',result);
      return itApplicationDto(result);
    },
    async download(actor,applicationId,fileId){
      const application=await load(actor,applicationId);
      const file=application.Submissions.filter(s=>s.Status==='submitted').flatMap(s=>s.Files)
        .find(f=>f.Id.toLowerCase()===fileId.toLowerCase()&&f.Status==='completed');
      if(!file)throw new AppError('Không tìm thấy minh chứng đã nhận.',404);
      return{url:await storage.download(file.ObjectKey,config.downloadTtlSeconds),expiresIn:config.downloadTtlSeconds};
    },
  });
}
