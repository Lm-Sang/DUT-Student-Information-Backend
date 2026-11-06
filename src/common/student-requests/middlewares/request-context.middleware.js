import { AppError } from '../../../shared/errors/app-error.js';

export function createRequestContextMiddleware(resolveActor) {
  return async (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (!resolveActor) throw new AppError('Cần xác thực bằng JWT ứng dụng.', 401);
    req.requestActor = await resolveActor(req);
    next();
  };
}
