import { adminAuthRouter } from './admin-auth.routes.js';

// Optional entry point. Student authentication does not import this module.
export const adminAuthModule = {
  basePath: '/api/admin/auth',
  router: adminAuthRouter,
};
