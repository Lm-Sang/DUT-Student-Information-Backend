import { studentAuthRouter } from './routes/student-auth.routes.js';

export const studentAuthModule = {
  basePath: '/api/student/auth',
  router: studentAuthRouter,
};
