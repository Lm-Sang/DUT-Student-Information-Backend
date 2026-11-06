import { createAuthRouter } from '../routes/auth.routes.js';
import { authService } from '../services/auth.service.js';
import { adminAuthController } from './admin-auth.controller.js';

export const adminAuthRouter = createAuthRouter('admin', adminAuthController, authService);
