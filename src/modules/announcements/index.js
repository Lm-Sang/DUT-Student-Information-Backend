import { createAnnouncementsController } from './announcements.controller.js';
import { createAnnouncementsRepository } from './announcements.repository.js';
import { createAnnouncementsRouter } from './announcements.routes.js';
import { createAnnouncementsService } from './announcements.service.js';

export function createAnnouncementsModule({ repository = createAnnouncementsRepository() } = {}) {
  const service = createAnnouncementsService(repository);
  const controller = createAnnouncementsController(service);
  return { basePath: '/api/public', router: createAnnouncementsRouter(controller) };
}

export default createAnnouncementsModule();
