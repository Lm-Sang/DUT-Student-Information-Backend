import express from 'express';
import helmet from 'helmet';

import { corsMiddleware } from './config/cors.js';
import adminModule from './modules/admin/index.js';
import { studentAuthModule } from './modules/auth/index.js';
import defaultCurriculumModule from './modules/curriculum/index.js';
import healthModule from './modules/health/index.js';
import defaultPublicModule from './modules/public/index.js';
import studentsModule from './modules/students/index.js';
import usersModule from './modules/users/index.js';
import { errorHandler } from './shared/middlewares/error-handler.middleware.js';
import { notFoundHandler } from './shared/middlewares/not-found.middleware.js';

const modules = [
  healthModule,
  studentAuthModule,
  studentsModule,
  adminModule,
  usersModule,
];

export function createApp({
  publicModule = defaultPublicModule,
  curriculumModule = defaultCurriculumModule,
  adminAuthModule,
} = {}) {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(corsMiddleware);
  app.use(express.json());

  for (const module of [...modules, publicModule, curriculumModule]) {
    app.use(module.basePath, module.router);
  }

  if (adminAuthModule) app.use(adminAuthModule.basePath, adminAuthModule.router);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
