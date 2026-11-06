import { Router } from 'express';

export function createStudentCertificationsRouter(controller, context, eventHandler) {
  const router = Router();
  router.use(context('student'));
  router.get('/catalog', controller.catalog);
  if (eventHandler) router.get('/events', eventHandler);
  router.post('/applications', controller.prepare);
  router.post('/applications/:applicationId/complete', controller.complete);
  router.get('/applications', controller.list);
  router.get('/applications/:applicationId', controller.get);
  router.get('/applications/:applicationId/files/:fileId/download', controller.download);
  return router;
}
