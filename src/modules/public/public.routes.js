import { Router } from 'express';

import { publicEndpoints } from './public.endpoints.js';

export function createPublicRouter(controller) {
  const router = Router();
  for (const endpoint of publicEndpoints) {
    router.get(endpoint.path, controller(endpoint));
  }
  return router;
}
