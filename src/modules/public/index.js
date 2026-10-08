import { createPublicApiClient } from './public.client.js';
import { createPublicController } from './public.controller.js';
import { createPublicRouter } from './public.routes.js';
import { createPublicService } from './public.service.js';

export function createPublicModule(clientOptions) {
  const client = createPublicApiClient(clientOptions);
  const service = createPublicService(client);
  const controller = createPublicController(service);
  return { basePath: '/api/public', router: createPublicRouter(controller) };
}

export default createPublicModule();
