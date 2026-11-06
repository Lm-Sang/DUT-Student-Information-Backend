import { Router } from 'express';

export function createAdminAcademicLeaveRouter(controller, context) {
  const router = Router();
  const reviewer = context('reviewer');
  router.post('/print-session', reviewer, controller.printSession);
  router.get('/applications', reviewer, controller.list);
  router.get('/applications/:id/history', reviewer, controller.applicationHistory);
  router.get('/applications/:id', reviewer, controller.get);
  router.get('/applications/:id/print', reviewer, controller.print);
  router.post('/applications/:id/review', reviewer, controller.review);
  router.post('/applications/:id/receive-paper', reviewer, controller.receivePaper);
  return router;
}
