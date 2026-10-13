import { Router } from 'express';

export function createAnnouncementsRouter(controller) {
  const router = Router();
  router.get('/announcements', controller.list);
  router.get('/announcements/:id', controller.getById);
  return router;
}
