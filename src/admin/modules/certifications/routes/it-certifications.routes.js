import { Router } from 'express';

export function createAdminItCertificationsRouter(controller, context) {
  const router = Router();
  router.use(context('reviewer'));
  router.get('/records', controller.records);
  router.get('/applications', controller.queue);
  router.get('/applications/:applicationId', controller.get);
  router.get('/applications/:applicationId/files/:fileId/download', controller.download);
  router.post('/applications/:applicationId/review', controller.review);
  return router;
}
