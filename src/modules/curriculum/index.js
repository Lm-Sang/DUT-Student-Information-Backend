import { createCurriculumController } from './curriculum.controller.js';
import { createCurriculumRepository } from './curriculum.repository.js';
import { createCurriculumRouter } from './curriculum.routes.js';
import { createCurriculumService } from './curriculum.service.js';

export function createCurriculumModule({ repository = createCurriculumRepository() } = {}) {
  const service = createCurriculumService(repository);
  const controller = createCurriculumController(service);
  return { basePath: '/api/public', router: createCurriculumRouter(controller) };
}

export default createCurriculumModule();
