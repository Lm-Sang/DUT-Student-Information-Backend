import { Router } from 'express';

export function createReadApiRouter(endpoints, controller) {
  const router = Router();
  for (const endpoint of endpoints) router.get(endpoint.path, controller(endpoint));
  return router;
}
