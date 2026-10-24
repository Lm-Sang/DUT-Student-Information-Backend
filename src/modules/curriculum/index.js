import { createCurriculumController } from './controllers/curriculum.controller.js';
import { createCurriculumRepository } from './repositories/curriculum.repository.js';
import { createCurriculumRouter } from './routes/curriculum.routes.js';
import { createCurriculumService } from './services/curriculum.service.js';

export function createCurriculumModule({ repository = createCurriculumRepository() } = {}) {
  const service = createCurriculumService(repository);
  const controller = createCurriculumController(service);
  return { basePath: '/api/public', router: createCurriculumRouter(controller) };
}

export default createCurriculumModule();
