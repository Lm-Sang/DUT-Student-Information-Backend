import { createAuthRouter } from '../auth.routes.js';
import { authService } from '../auth.service.js';
import { adminAuthController } from './admin-auth.controller.js';

export const adminAuthRouter = createAuthRouter('admin', adminAuthController, authService);
