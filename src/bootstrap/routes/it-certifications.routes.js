import { Router } from 'express';
import { createStudentItCertificationsRouter } from '../../student/modules/certifications/routes/it-certifications.routes.js';
import { createAdminItCertificationsRouter } from '../../admin/modules/certifications/routes/it-certifications.routes.js';

export function createItCertificationsRouter(controller, context) {
  const router = Router();
  router.use('/reviewer', createAdminItCertificationsRouter(controller, context));
  router.use(createStudentItCertificationsRouter(controller, context));
  return router;
}
