import { createStudentRouter } from './routes/student.routes.js';
import { createStudentPortalService } from './services/student-portal.service.js';
export {normalizeAcademicRows} from './validators/academic-statistics.validator.js';
export {createDutStudentContext} from './middlewares/dut-student-context.js';
export {createStudentApplicationDataService} from './services/student-application-data.service.js';
export { studentService, createStudentService, citizenId } from './services/student.service.js';

export function createStudentsModule(options={}) {
  return {basePath:'/api/students',router:createStudentRouter(createStudentPortalService(options),options.authService)};
}
export default createStudentsModule();
