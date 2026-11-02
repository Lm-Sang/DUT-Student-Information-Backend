import { studentRouter } from './routes/student.routes.js';
export { studentService, createStudentService, citizenId } from './services/student.service.js';

export default {
  basePath: '/api/students',
  router: studentRouter,
};
