import { Router, raw } from 'express';
import { createRequestContextMiddleware } from '../../../../common/student-requests/middlewares/request-context.middleware.js';

export function createAdminRequestsRouter(controller, resolveActor, {
  collectionPath = '/', legacy = false, workbook,
} = {}) {
  const router = Router();
  const item = collectionPath === '/' ? '' : collectionPath;
  router.use(createRequestContextMiddleware(resolveActor));
  router.get('/me', controller.me);
  router.get('/profile', controller.profile);
  router.get('/catalogs', controller.catalogs);
  // Account creation/assignment belongs exclusively to auth organization APIs.
  if (workbook) {
    router.post('/workbook/export', controller.exportWorkbook);
    router.post('/workbook/preview', raw({ type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', limit: '5mb' }), controller.previewWorkbook);
    router.post('/workbook/commit', controller.commitWorkbook);
  }
  router.get(collectionPath, controller.list);
  if (legacy) router.post(collectionPath, controller.create);
  router.get(item + '/:id', controller.detail);
  router.get(item + '/:id/file', controller.download);
  router.post(item + '/:id/print', controller.printConfirmation);
  router.post(item + '/:id/actions', controller.command);
  return router;
}
