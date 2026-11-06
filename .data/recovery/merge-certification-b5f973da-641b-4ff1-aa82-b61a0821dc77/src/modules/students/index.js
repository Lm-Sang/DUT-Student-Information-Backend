import { studentRouter } from './routes/student.routes.js';
<<<<<<< HEAD
export {normalizeAcademicRows} from './validators/academic-statistics.validator.js';
export {createDutStudentContext} from './middlewares/dut-student-context.js';
export {createStudentApplicationDataService} from './services/student-application-data.service.js';
export {createStudentService, studentService} from './services/student.service.js';
=======
export { studentService, createStudentService, citizenId } from './services/student.service.js';
>>>>>>> feat/certification

export default {
  basePath: '/api/students',
  router: studentRouter,
};
