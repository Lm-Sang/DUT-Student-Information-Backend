import { AppError } from '../../../shared/errors/app-error.js';
import { authService } from '../services/auth.service.js';

export function createSsoTokenResolver(service = authService) {
  return async req => {
    const match = /^Bearer ([^\s]+)$/i.exec(req.headers.authorization ?? '');
    if (!match || match[1].length > 16384) throw new AppError('DUT SSO Bearer token required', 401);
    req.ssoClaims = await service.verifyToken(match[1], 'student');
    const token = match[1];
    // Server-only request context; never include this in a response or logs.
    req.ssoAccessToken = token;
    return token;
  };
}

export const resolveSsoAccessToken = createSsoTokenResolver();

export function createLocalPermissionContext(permission, service = authService, taskId) {
  return async req => {
    const match = /^Bearer ([^\s]+)$/i.exec(req.headers.authorization ?? '');
    if (!match) throw new AppError('Local account Bearer authentication required', 401);
    const claims = await service.verifyToken(match[1], 'admin');
    const profile = claims.organization ?? claims.identity?.organization;
    const scoped = profile?.active && profile.fieldActive && profile.accessLevel === 'specialist' && profile.taskIds.includes(taskId);
    const monitoring = profile?.accessLevel === 'department_admin' && profile.fieldCode === 'DT'
      && ['GET', 'HEAD'].includes(req.method) && permission.endsWith(':review');
    if (claims.authMethod !== 'password' || !(monitoring || scoped && claims.permissions.includes(permission))) throw new AppError('Permission denied', 403);
    return { role: 'reviewer', source: 'auth', reference: `local-user:${claims.localUserId}`,
      name: claims.identity.displayName, permissions: [...claims.permissions] };
  };
}

export function authenticate(channel, service = authService) {
  return async (req, _res, next) => {
    try {
      const match = /^Bearer ([^\s]+)$/i.exec(req.headers.authorization ?? '');
      if (!match || match[1].length > (channel === 'student' ? 16384 : 8192)) throw new AppError('Bearer authentication required', 401);
      req.user = await service.verifyToken(match[1], channel);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireAuth(req, _res, next) {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  return next();
}

// TODO AUTH-02: Attach this guard to business routes once permissions are defined.
export function requirePermissions(...permissions) {
  return (req, _res, next) => {
    if (!req.user) return next(new AppError('Authentication required', 401));
    if (req.user.authorizationStatus !== 'active' || !permissions.length
      || !Array.isArray(req.user.permissions)
      || !permissions.every((permission) => req.user.permissions.includes(permission))) {
      return next(new AppError('Permission denied', 403));
    }
    return next();
  };
}
