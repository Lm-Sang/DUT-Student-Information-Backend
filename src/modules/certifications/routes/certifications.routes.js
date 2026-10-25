import { Router } from 'express';

export function createCertificationsRouter(controller,context,reviewerAuthRouter) {
  const router = Router(),student = Router(),reviewer = Router(),management = Router();
  student.get('/catalog',controller.catalog);
  student.post('/applications',controller.prepare);
  student.post('/applications/:applicationId/complete',controller.complete);
  student.get('/applications',controller.list);
  student.get('/applications/:applicationId',controller.get);
  student.get('/applications/:applicationId/files/:fileId/download',controller.download);
  reviewer.get('/applications',controller.queue);
  reviewer.get('/applications/:applicationId',controller.get);
  reviewer.get('/applications/:applicationId/files/:fileId/download',controller.download);
  reviewer.post('/applications/:applicationId/review',controller.review);
  management.get('/catalog',controller.managementCatalog);
  for (const kind of ['languages','types','policies']) {
    management.post('/'+kind,controller['create_'+kind]);
    management.patch('/'+kind+'/:catalogId',controller['update_'+kind]);
  }
  if (reviewerAuthRouter) router.use('/reviewer/auth',reviewerAuthRouter);
  router.use('/management',context('catalog'),management);
  router.use('/reviewer',context('reviewer'),reviewer);
  router.use(context('student'),student);
  return router;
}
