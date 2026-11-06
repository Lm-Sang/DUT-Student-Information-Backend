import { Router } from 'express';
import { createStudentItCertificationsRouter } from '../../student/modules/certifications/routes/it-certifications.routes.js';
import { createAdminItCertificationsRouter } from '../../admin/modules/certifications/routes/it-certifications.routes.js';

export function createItCertificationsRouter(controller, context, eventHandler) {
  const router = Router();
  router.use('/reviewer', createAdminItCertificationsRouter(controller, context, eventHandler));
  router.use(createStudentItCertificationsRouter(controller, context, eventHandler));
  return router;
}
