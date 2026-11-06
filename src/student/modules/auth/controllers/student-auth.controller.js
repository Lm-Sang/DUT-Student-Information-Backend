import { env } from '../../../../config/env.js';
import { createAuthController } from '../../../../common/auth/controllers/auth.controller.js';
import { authService } from '../../../../common/auth/services/auth.service.js';

export const studentAuthController = createAuthController('student', authService, {
  secureCookies: env.nodeEnv === 'production',
});
