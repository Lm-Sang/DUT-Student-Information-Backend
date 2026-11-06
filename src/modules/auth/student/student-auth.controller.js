import { env } from '../../../config/env.js';
import { createAuthController } from '../controllers/auth.controller.js';
import { authService } from '../services/auth.service.js';

export const studentAuthController = createAuthController('student', authService, {
  secureCookies: env.nodeEnv === 'production',
});
