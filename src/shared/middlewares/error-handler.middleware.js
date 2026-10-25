import { AppError } from '../errors/app-error.js';
import { sendError } from '../utils/response.js';

export function errorHandler(error, _req, res, _next) {
  if (error.type === 'entity.too.large') return sendError(res, 'Request body is too large.', 413);
  if (error.type === 'entity.parse.failed') return sendError(res, 'Invalid JSON request body.', 400);
  if (['encoding.unsupported', 'charset.unsupported'].includes(error.type)) return sendError(res, 'Unsupported request encoding.', 415);
  const isOperationalError = error instanceof AppError;
  const statusCode = isOperationalError ? error.statusCode : 500;
  const message = isOperationalError ? error.message : 'Internal server error';

  sendError(res, message, statusCode, isOperationalError ? error.details : undefined);
}
