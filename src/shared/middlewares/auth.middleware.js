import { AppError } from '../errors/app-error.js';
import { authService } from '../../modules/auth/auth.service.js';

export function authenticate(channel, service = authService) {
  return (req, _res, next) => {
    try {
      const match = /^Bearer ([^\s]+)$/i.exec(req.headers.authorization ?? '');
      if (!match) throw new AppError('Bearer authentication required', 401);
      req.user = service.verifyToken(match[1], channel);
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
