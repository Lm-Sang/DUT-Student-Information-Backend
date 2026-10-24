// Public API for other features. Keep auth internals inside this module.
export { studentAuthModule } from './student/index.js';
export { authenticate, requireAuth, requirePermissions } from './middlewares/auth.middleware.js';
export { authService } from './services/auth.service.js';
