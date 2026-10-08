import { asyncHandler } from '../../shared/utils/async-handler.js';
import { sendSuccess } from '../../shared/utils/response.js';

export function createPublicController(service) {
  return (endpoint) => asyncHandler(async (req, res) => {
    const data = await service.get(endpoint, req.params, req.query);
    res.set('Cache-Control', 'no-store');
    return sendSuccess(res, data);
  });
}
