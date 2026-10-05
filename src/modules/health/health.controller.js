import { sendSuccess } from '../../shared/utils/response.js';

export function getHealth(_req, res) {
  res.set('Cache-Control', 'no-store');
  return sendSuccess(res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}
