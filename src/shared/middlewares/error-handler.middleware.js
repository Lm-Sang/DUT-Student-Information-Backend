import { AppError } from '../errors/app-error.js';
import { sendError } from '../utils/response.js';

export function errorHandler(error, _req, res, _next) {
  const isOperationalError = error instanceof AppError;
  const statusCode = isOperationalError ? error.statusCode : 500;
  const message = isOperationalError ? error.message : 'Internal server error';

  sendError(res, message, statusCode, isOperationalError ? error.details : undefined);
}
