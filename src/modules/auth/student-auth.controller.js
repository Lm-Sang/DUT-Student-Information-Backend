import { env } from '../../config/env.js';
import { createAuthController } from './auth.controller.js';
import { authService } from './auth.service.js';

export const studentAuthController = createAuthController('student', authService, {
  secureCookies: env.nodeEnv === 'production',
});
