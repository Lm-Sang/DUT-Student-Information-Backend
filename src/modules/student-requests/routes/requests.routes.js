import { randomBytes } from 'node:crypto';
import { Router } from 'express';
import { AppError } from '../../../shared/errors/app-error.js';

export function createRequestsRouter(controller, service) {
  const router = Router();
  const sessions = new Map();
  router.use((req, res, next) => {
    const address = req.socket.remoteAddress;
    if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(address)) throw new AppError('Bản thử chỉ truy cập từ máy local.', 403);
    if (req.headers.origin) {
      let host;
      try { host = new URL(req.headers.origin).hostname; } catch { throw new AppError('Origin không hợp lệ.', 403); }
      if (!['localhost', '127.0.0.1', '[::1]'].includes(host)) throw new AppError('Bản thử chỉ chấp nhận Origin local.', 403);
    }
    res.set('Cache-Control', 'no-store');
    next();
  });
  router.get('/actors', controller.actors);
  router.post('/session', async (req, res) => {
    if (!req.body || typeof req.body.actorId !== 'string' || Object.keys(req.body).some(key => key !== 'actorId')) throw new AppError('Chỉ nhận actorId đã cấu hình trên server.', 400);
    const actor = await service.actor(req.body.actorId);
    for (const [key, session] of sessions) if (session.expiresAt < Date.now()) sessions.delete(key);
    if (sessions.size >= 1000) throw new AppError('Đã đạt giới hạn phiên thử nghiệm.', 429);
    const token = randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 2 * 60 * 60 * 1000;
    sessions.set(token, { actorId: actor.id, expiresAt });
    res.json({ data: { token, actor, expiresAt } });
  });
  router.use(async (req, _res, next) => {
    const token = /^Bearer ([a-f0-9]{64})$/.exec(req.headers.authorization || '')?.[1];
    const session = sessions.get(token);
    if (!session || session.expiresAt < Date.now()) { sessions.delete(token); throw new AppError('Hãy chọn lại nhân vật để mở phiên thử nghiệm.', 401); }
    req.demoActor = await service.actor(session.actorId);
    next();
  });
  router.delete('/session', (req, res) => { sessions.delete(req.headers.authorization.slice(7)); res.status(204).end(); });
  router.get('/me', controller.me);
  router.get('/profile', controller.profile);
  router.get('/catalogs', controller.catalogs);
  router.get('/requests', controller.list);
  router.post('/requests', controller.create);
  router.get('/requests/:id', controller.detail);
  router.get('/requests/:id/file', controller.download);
  router.post('/requests/:id/print', controller.printConfirmation);
  router.post('/requests/:id/actions', controller.command);
  return router;
}
