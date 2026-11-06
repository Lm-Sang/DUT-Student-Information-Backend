import { createAnnouncementsController } from './controllers/announcements.controller.js';
import { createAnnouncementsRepository } from './repositories/announcements.repository.js';
import { createAnnouncementsRouter } from './routes/announcements.routes.js';
import { createAnnouncementsService } from './services/announcements.service.js';

export function createAnnouncementsModule({ repository = createAnnouncementsRepository() } = {}) {
  const service = createAnnouncementsService(repository);
  const controller = createAnnouncementsController(service);
  return { basePath: '/api/public', router: createAnnouncementsRouter(controller) };
}

export default createAnnouncementsModule();
