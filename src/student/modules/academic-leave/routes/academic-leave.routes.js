import { Router } from 'express';

export function createStudentAcademicLeaveRouter(controller, context, printContext) {
  const router = Router();
  const student = context('student');
  router.get('/print', printContext, controller.pdf);
  router.post('/print-session', student, controller.printSession);
  router.get('/form', student, controller.form);
  router.get('/history', student, controller.history);
  router.get('/applications', student, controller.list);
  router.post('/applications', student, controller.create);
  router.get('/applications/:id', student, controller.get);
  router.get('/applications/:id/history', student, controller.applicationHistory);
  router.put('/applications/:id', student, controller.update);
  router.post('/applications/:id/confirm', student, controller.confirm);
  router.post('/applications/:id/cancel', student, controller.cancel);
  router.get('/applications/:id/print', student, controller.print);
  return router;
}
