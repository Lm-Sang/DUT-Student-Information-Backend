import {Router} from 'express';
export function createAcademicLeaveRouter(controller,context,printContext) {
  const router=Router();
  router.get('/print',printContext,controller.pdf);
  router.post('/print-session',context('student'),controller.printSession);
  router.post('/reviewer/print-session',context('reviewer'),controller.printSession);
  router.get('/reviewer/applications',context('reviewer'),controller.list);
  router.get('/reviewer/applications/:id/history',context('reviewer'),controller.applicationHistory);
  router.get('/reviewer/applications/:id',context('reviewer'),controller.get);
  router.get('/reviewer/applications/:id/print',context('reviewer'),controller.print);
  router.post('/reviewer/applications/:id/review',context('reviewer'),controller.review);
  router.post('/reviewer/applications/:id/receive-paper',context('reviewer'),controller.receivePaper);
  router.get('/form',context('student'),controller.form);
  router.get('/history',context('student'),controller.history);
  router.get('/applications',context('student'),controller.list);
  router.post('/applications',context('student'),controller.create);
  router.get('/applications/:id',context('student'),controller.get);
  router.get('/applications/:id/history',context('student'),controller.applicationHistory);
  router.put('/applications/:id',context('student'),controller.update);
  router.post('/applications/:id/confirm',context('student'),controller.confirm);
  router.post('/applications/:id/cancel',context('student'),controller.cancel);
  router.get('/applications/:id/print',context('student'),controller.print);
  return router;
}
