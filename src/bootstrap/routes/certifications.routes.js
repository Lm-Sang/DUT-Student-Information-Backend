import { Router } from 'express';
import { createStudentCertificationsRouter } from '../../student/modules/certifications/routes/certifications.routes.js';
import { createCertificationReviewRouter, createCertificationCatalogRouter } from '../../admin/modules/certifications/routes/certifications.routes.js';

// Compatibility URLs; endpoint definitions live in the owning frontend modules.
export function createCertificationsRouter(controller, context, reviewerAuthRouter, eventHandler) {
  const router = Router();
  if (reviewerAuthRouter) router.use('/reviewer/auth', reviewerAuthRouter);
  router.use('/management', createCertificationCatalogRouter(controller, context));
  router.use('/reviewer', createCertificationReviewRouter(controller, context, eventHandler));
  router.use(createStudentCertificationsRouter(controller, context, eventHandler));
  return router;
}
