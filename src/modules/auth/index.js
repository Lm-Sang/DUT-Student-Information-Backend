import { adminAuthRouter } from './admin-auth.routes.js';
import { studentAuthRouter } from './student-auth.routes.js';

export const studentAuthModule = {
  basePath: '/api/student/auth',
  router: studentAuthRouter,
};

export const adminAuthModule = {
  basePath: '/api/admin/auth',
  router: adminAuthRouter,
};
