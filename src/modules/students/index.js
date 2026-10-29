import { studentRouter } from './routes/student.routes.js';
export {normalizeAcademicRows} from './validators/academic-statistics.validator.js';
export {createDutStudentContext} from './middlewares/dut-student-context.js';
export {createStudentApplicationDataService} from './services/student-application-data.service.js';
export {createStudentService, studentService} from './services/student.service.js';

export default {
  basePath: '/api/students',
  router: studentRouter,
};
