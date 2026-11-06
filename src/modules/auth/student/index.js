import { studentAuthRouter } from './student-auth.routes.js';

export const studentAuthModule = {
  basePath: '/api/student/auth',
  router: studentAuthRouter,
};
