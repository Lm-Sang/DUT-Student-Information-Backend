import { Router } from 'express';

import { createJsonApiClient } from '../../infrastructure/http/json-api.client.js';
import { asyncHandler } from '../utils/async-handler.js';
import { sendSuccess } from '../utils/response.js';
import { createReadApiService } from './read-api.service.js';

// Reusable transport for allowlisted, read-only upstream APIs.
// Each feature owns its endpoint paths and validation schemas.
export function createReadApiModule({ basePath, endpoints, clientOptions }) {
  const service = createReadApiService(createJsonApiClient(clientOptions));
  const router = Router();

  for (const endpoint of endpoints) {
    router.get(endpoint.path, asyncHandler(async (req, res) => {
      const data = await service.get(endpoint, req.params, req.query);
      res.set('Cache-Control', 'no-store');
      return sendSuccess(res, data);
    }));
  }

  return { basePath, router };
}
