import {createDutStudentContext,createStudentApplicationDataService} from '../students/index.js';
import {createLocalPermissionContext} from '../auth/index.js';
import {createAcademicLeaveRepository} from './repositories/academic-leave.repository.js';
import {createAcademicLeaveService} from './services/academic-leave.service.js';
import {createAcademicLeaveMiddleware,createAcademicLeavePrintMiddleware} from './middlewares/academic-leave.middleware.js';
import {createAcademicLeavePrintAccess} from './middlewares/academic-leave-print-access.js';
import {pdfRenderer} from '../../infrastructure/pdf/chromium-pdf.js';
import {createAcademicLeaveController} from './controllers/academic-leave.controller.js';
import {createAcademicLeaveRouter} from './routes/academic-leave.routes.js';
const applicationData=createStudentApplicationDataService();

export function createAcademicLeaveModule({repository=createAcademicLeaveRepository(),
  snapshotProvider=(actor,token)=>applicationData.snapshot(actor,token),
  prefillProvider=actor=>applicationData.prefill(actor),
  studentContextProvider=createDutStudentContext(),reviewerContextProvider=createLocalPermissionContext('academic-leave:review'),clock,
  renderPdf=html=>pdfRenderer.render(html),printAccess=createAcademicLeavePrintAccess()}={}) {
  const service=createAcademicLeaveService({repository,snapshotProvider,prefillProvider,clock});
  const context=createAcademicLeaveMiddleware({studentContextProvider,reviewerContextProvider});
  return{basePath:'/api/academic-leave',service,router:createAcademicLeaveRouter(createAcademicLeaveController(service,{renderPdf,printAccess}),
    context,createAcademicLeavePrintMiddleware({studentContext:context('student'),printAccess}))};
}
export default createAcademicLeaveModule();
