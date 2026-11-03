// Public API for other features. Keep auth internals inside this module.
export { studentAuthModule } from './student/index.js';
export { authenticate, requireAuth, requirePermissions } from './middlewares/auth.middleware.js';
export { authService } from './services/auth.service.js';
export { closeAuthStore } from './stores/auth.store.js';
export { createSsoTokenResolver, resolveSsoAccessToken, createLocalPermissionContext } from './middlewares/auth.middleware.js';

import { env } from '../../config/env.js';
import { authService } from './services/auth.service.js';
import { createAuthController } from './controllers/auth.controller.js';
import { createAuthRouter } from './routes/auth.routes.js';

export function createAuthModule({ channel = 'student', service = authService,
  secureCookies = env.nodeEnv === 'production', frontendOrigin,
} = {}) {
  const controller = createAuthController(channel, service, { secureCookies, frontendOrigin });
  const router = createAuthRouter(channel, controller, service);
  if (env.nodeEnv !== 'production') router.get('/configuration', (_req,res) => {
    const missing = [];
    if (!env.microsoftSso.jwtSecret) missing.push('MICROSOFT_SSO_JWT_SECRET');
    if (!env.microsoftSso.jwtIssuer) missing.push('MICROSOFT_SSO_JWT_ISSUER');
    if (!env.microsoftSso.jwtAudience && !env.microsoftSso.allowMissingAudience) missing.push('MICROSOFT_SSO_JWT_AUDIENCE');
    res.set('Cache-Control','no-store').json({data:{ready:missing.length===0,missing}});
  });
  return { basePath: `/api/${channel}/auth`, router };
}

export function createStaffAuthModule(options = {}) {
  return createAuthModule({ channel: 'staff', frontendOrigin: env.app.staffFrontendUrl ?? env.app.adminFrontendUrl, ...options });
}
