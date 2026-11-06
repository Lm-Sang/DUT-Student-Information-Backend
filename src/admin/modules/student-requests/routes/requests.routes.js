import { Router, raw } from 'express';
import { createRequestContextMiddleware } from '../../../../common/student-requests/middlewares/request-context.middleware.js';

export function createAdminRequestsRouter(controller, resolveActor, {
  collectionPath = '/', legacy = false, admin, rbac, workbook,
} = {}) {
  const router = Router();
  const item = collectionPath === '/' ? '' : collectionPath;
  const accounts = legacy ? '/admin/staff' : '/accounts';
  const roles = legacy ? '/admin/roles' : '/roles';
  router.use(createRequestContextMiddleware(resolveActor));
  router.get('/me', controller.me);
  router.get('/profile', controller.profile);
  router.get('/catalogs', controller.catalogs);
  if (admin) {
    router.get(accounts, controller.staff);
    router.put(accounts + '/:id/permissions', controller.permissions);
    router.post(item + '/:id/reassign', controller.reassign);
  }
  if (rbac) {
    router.post(roles, controller.createRole);
    router.put(roles + '/:id', controller.updateRole);
    router.get(roles + '/:id/history', controller.roleHistory);
    router.post(accounts, controller.createStaff);
    router.put(accounts + '/:id/roles', controller.assignRoles);
  }
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
