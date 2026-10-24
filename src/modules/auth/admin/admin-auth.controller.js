import { env } from '../../../config/env.js';
import { createAuthController } from '../controllers/auth.controller.js';
import { authService } from '../services/auth.service.js';

export const adminAuthController = createAuthController('admin', authService, {
  secureCookies: env.nodeEnv === 'production',
});
