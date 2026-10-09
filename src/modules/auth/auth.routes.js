import { Router, json } from 'express';
import { authenticate } from '../../shared/middlewares/auth.middleware.js';
import { asyncHandler } from '../../shared/utils/async-handler.js';

export function createAuthRouter(channel, controller, service) {
  const router = Router();
  router.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    res.set('Referrer-Policy', 'no-referrer');
    next();
  });
  router.get('/microsoft/login', controller.login);
  router.get('/microsoft/callback', asyncHandler(controller.callback));
  router.post('/session', json({ limit: '2kb' }), controller.session);
  router.get('/me', authenticate(channel, service), controller.me);
  router.post('/logout', authenticate(channel, service), controller.logout);
  router.post('/microsoft/logout', authenticate(channel, service), controller.logout);
  return router;
}
