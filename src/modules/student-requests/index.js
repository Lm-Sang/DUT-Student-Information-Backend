import { env } from '../../config/env.js';
import { createRequestsController } from './controllers/requests.controller.js';
import { createRequestsRepository } from './repositories/requests.repository.js';
import { createRequestsRouter } from './routes/requests.routes.js';
import { createRequestsService } from './services/requests.service.js';

export function createRequestsModule({ repository = createRequestsRepository(), enabled = env.features.requestsDemoEnabled } = {}) {
  if (!enabled) return null;
  if (env.nodeEnv === 'production') throw new Error('Request demo must not run in production.');
  const service = createRequestsService(repository);
  return { basePath: '/api/demo/student-requests', router: createRequestsRouter(createRequestsController(service), service) };
}

export default createRequestsModule();
