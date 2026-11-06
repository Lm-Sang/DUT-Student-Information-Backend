import express from 'express';
import helmet from 'helmet';

import { corsMiddleware } from './config/cors.js';
import { createModules } from './modules/index.js';
import { errorHandler } from './shared/middlewares/error-handler.middleware.js';
import { notFoundHandler } from './shared/middlewares/not-found.middleware.js';

export function createApp(moduleOverrides = {}) {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(corsMiddleware);
  app.use(express.json());

  for (const module of createModules(moduleOverrides)) {
    app.use(module.basePath, module.router);
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
