import { createJsonApiClient } from '../../infrastructure/http/json-api.client.js';
import { createReadApiController } from './controllers/read-api.controller.js';
import { createReadApiRepository } from './repositories/read-api.repository.js';
import { createReadApiRouter } from './routes/read-api.routes.js';
import { createReadApiService } from './services/read-api.service.js';

// Reusable transport for allowlisted, read-only upstream APIs.
// Each feature owns its endpoint paths and validation schemas.
export function createReadApiModule({ basePath, endpoints, clientOptions }) {
  const client = createJsonApiClient(clientOptions);
  const repository = createReadApiRepository(client);
  const service = createReadApiService(repository);
  const controller = createReadApiController(service);
  return { basePath, router: createReadApiRouter(endpoints, controller) };
}
