import { Router } from 'express';

export function createCurriculumRouter(controller) {
  const router = Router();
  router.get('/academic-programs', controller.listPrograms);
  router.get('/academic-programs/:programId/curriculum', controller.getCurriculum);
  return router;
}
