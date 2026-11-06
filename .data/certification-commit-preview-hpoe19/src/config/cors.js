import cors from 'cors';

import { env } from './env.js';
import { AppError } from '../shared/errors/app-error.js';

export const corsMiddleware = cors({
  credentials: true,
  origin(origin, callback) {
    if (!origin || env.app.corsOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new AppError(`Origin ${origin} is not allowed by CORS.`, 403));
  },
});
