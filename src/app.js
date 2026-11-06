import express from "express";
import helmet from "helmet";

import { corsMiddleware } from "./config/cors.js";
import { createModuleRegistry } from "./bootstrap/modules.js";
import { createStudentRouter } from "./student/student.routes.js";
import { createAdminRouter } from "./admin/admin.routes.js";
import { errorHandler } from "./shared/middlewares/error-handler.middleware.js";
import { notFoundHandler } from "./shared/middlewares/not-found.middleware.js";

export function createApp(moduleOverrides = {}) {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(corsMiddleware);
  app.use(express.json());

  const modules = createModuleRegistry(moduleOverrides);
  app.use("/api/student", createStudentRouter(modules));
  app.use("/api/admin", createAdminRouter(modules));

  for (const module of Object.values(modules).filter(Boolean)) {
    // Authentication is already mounted once by the frontend routers.
    if (module === modules.studentAuthModule || module === modules.adminAuthModule || module === modules.organizationModule) continue;
    app.use(module.basePath, module.router);
    for (const mount of module.mounts ?? []) {
      app.use(mount.basePath, mount.router);
    }
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
