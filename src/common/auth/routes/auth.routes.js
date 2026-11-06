import { Router, json } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../../../shared/utils/async-handler.js';

export function createAuthRouter(channel, controller, service) {
  const router = Router();
  router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    res.set('Referrer-Policy', 'no-referrer');
    next();
  });
  router.use((req, _res, next) => {
    try {
      if (req.method !== 'OPTIONS') {
        service.rateLimit('ip', req.ip ?? req.socket.remoteAddress ?? 'unknown', 60, 60000);
        if (req.path === '/login' && req.method === 'POST') {
          service.rateLimit('password-ip', req.ip ?? req.socket.remoteAddress ?? 'unknown', 15, 900000);
        }
      }
      if (req.body && Buffer.byteLength(JSON.stringify(req.body)) > 2048) throw Object.assign(new Error(), { type: 'entity.too.large' });
      next();
    } catch (error) { next(error); }
  });
  router.get('/microsoft/login', controller.login);
  router.get('/microsoft/callback', asyncHandler(controller.callback));
  router.get('/microsoft/callback/:state', asyncHandler(controller.callback));
  router.post('/login', json({ limit: '2kb' }), asyncHandler(controller.passwordLogin));
  if(channel==='staff'||channel==='admin') {
    router.post('/change-password',authenticate(channel,service),json({limit:'2kb'}),asyncHandler(controller.changePassword));
    router.post('/accounts/:id/reset-password',authenticate(channel,service),json({limit:'2kb'}),asyncHandler(controller.resetStaffPassword));
  }
  router.post('/session', json({ limit: '2kb' }), controller.session);
  router.post('/refresh', json({ limit: '2kb' }), asyncHandler(controller.refresh));
  router.get('/me', authenticate(channel, service), controller.me);
  router.post('/logout', asyncHandler(controller.logout));
  router.post('/microsoft/logout', asyncHandler(controller.logout));
  return router;
}
