import { Router } from 'express';
import { authenticate } from '../../../../common/auth/index.js';

export function createOrganizationRouter(controller, authService) {
  const router = Router();
  router.use(authenticate('admin', authService));
  router.get('/catalog', controller.catalog);
  router.post('/catalog/sync',controller.syncPermissionCatalog);
  router.get('/accounts', controller.accounts);
  router.post('/roles',controller.createRole);
  router.put('/roles/:id',controller.updateRole);
  router.put('/permissions/:key',controller.updatePermissionTag);
  router.get('/progress/:taskId', controller.progress);
  router.post('/accounts', controller.create);
  router.put('/accounts/:id', controller.update);
  router.delete('/accounts/:id', controller.remove);
  router.put('/fields/:code', controller.saveField);
  router.delete('/fields/:code', controller.removeField);
  return router;
}
