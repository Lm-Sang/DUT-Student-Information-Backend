import { asyncHandler } from '../../utils/async-handler.js';
import { sendSuccess } from '../../utils/response.js';

export function createReadApiController(service) {
  return (endpoint) => asyncHandler(async (req, res) => {
    const data = await service.get(endpoint, req.params, req.query);
    res.set('Cache-Control', 'no-store');
    return sendSuccess(res, data);
  });
}
