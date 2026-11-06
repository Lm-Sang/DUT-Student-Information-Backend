import { organizationRepository } from '../../../common/auth/index.js';
import { createOrganizationService } from './services/organization.service.js';
import { createOrganizationController } from './controllers/organization.controller.js';
import { createOrganizationRouter } from './routes/organization.routes.js';
import { createProgressRepository } from './repositories/progress.repository.js';

export function createOrganizationModule({ repository = organizationRepository, progressRepository = createProgressRepository(), authService } = {}) {
  const service = createOrganizationService(repository, progressRepository);
  return { basePath: '/api/admin/organization', service,
    router: createOrganizationRouter(createOrganizationController(service), authService) };
}
