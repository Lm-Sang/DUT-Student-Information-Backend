import { Router } from 'express';

export function createCertificationReviewRouter(controller, context, eventHandler) {
  const router = Router();
  router.use(context('reviewer'));
  if (eventHandler) router.get('/events', eventHandler);
  router.get('/applications', controller.queue);
  router.get('/applications/:applicationId', controller.get);
  router.get('/applications/:applicationId/files/:fileId/download', controller.download);
  router.post('/applications/:applicationId/review', controller.review);
  return router;
}

export function createCertificationCatalogRouter(controller, context) {
  const router = Router();
  router.use(context('catalog'));
  router.get('/catalog', controller.managementCatalog);
  for (const kind of ['languages', 'types', 'policies', 'issuers']) {
    router.post('/' + kind, controller['create_' + kind]);
    router.patch('/' + kind + '/:catalogId', controller['update_' + kind]);
  }
  return router;
}

export function createAdminCertificationsRouter(controller, context, eventHandler) {
  const router = Router();
  router.use('/management', createCertificationCatalogRouter(controller, context));
  router.use(createCertificationReviewRouter(controller, context, eventHandler));
  return router;
}
