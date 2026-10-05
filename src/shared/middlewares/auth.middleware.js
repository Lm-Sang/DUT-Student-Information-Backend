import { AppError } from '../errors/app-error.js';

export function requireAuth(req, _res, next) {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  return next();
}
