import {AppError} from '../src/shared/errors/app-error.js';
import {createCertificationsModule,createItCertificationsModule} from '../src/modules/certifications/index.js';
import {createDutStudentContext} from '../src/modules/certifications/middlewares/dut-student-context.js';
import {createReviewerTestAuth} from './reviewer-auth.js';

// Kept outside the certification feature commit, together with the local FE.
export function createLocalCertificationsModules({language={},it={},studentContextProvider=createDutStudentContext(),authConfig={},events,inspectionQueue}={}) {
  const config={nodeEnv:process.env.NODE_ENV??'development',devMode:process.env.CERTIFICATIONS_DEV_MODE==='true',
    reviewerOrigin:process.env.ADMIN_FRONTEND_URL||'http://localhost:5174',
    reviewerReference:process.env.CERTIFICATIONS_DEV_REVIEWER_REF||'development-reviewer',...authConfig};
  const reviewerAuthentication=createReviewerTestAuth(config);
  const contextProvider=async(req,role)=>{
    if(!config.devMode||!['development','test'].includes(config.nodeEnv)||
      !['127.0.0.1','::1','::ffff:127.0.0.1'].includes(req.socket.remoteAddress))
      throw new AppError('Ngữ cảnh thử nghiệm chỉ nhận kết nối local.',403);
    if(req.headers.authorization){
      if(role!=='student')throw new AppError('Token sinh viên không cấp quyền xét duyệt hoặc quản lý danh mục.',403);
      return studentContextProvider(req);
    }
    if(role==='reviewer')return reviewerAuthentication.actor(req);
    if(role==='catalog')return{role:'reviewer',source:'development',
      reference:process.env.CERTIFICATIONS_DEV_MANAGER_REF||'development-catalog-manager',
      name:'Chuyên viên thử nghiệm',permissions:['certifications:catalog:manage']};
    const studentCode=process.env.CERTIFICATIONS_DEV_STUDENT_CODE||'102240377';
    return{role:'student',source:'development',reference:process.env.CERTIFICATIONS_DEV_STUDENT_REF||'development-student',
      name:'Sinh viên thử nghiệm',permissions:[],studentCode,
      cohortYear:Number(process.env.CERTIFICATIONS_DEV_COHORT_YEAR??2000+Number(studentCode.slice(3,5)))};
  };
  return{
    certificationsModule:createCertificationsModule({...language,reviewerAuthentication,contextProvider,events,inspectionQueue}),
    itCertificationsModule:createItCertificationsModule({...it,reviewerAuthentication,contextProvider,events,inspectionQueue}),
  };
}

export function createLocalCertificationsModule(){return createLocalCertificationsModules().certificationsModule;}
