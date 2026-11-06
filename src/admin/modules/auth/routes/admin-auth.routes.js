import { createAuthRouter } from "../../../../common/auth/routes/auth.routes.js";
import { authService } from "../../../../common/auth/services/auth.service.js";
import { adminAuthController } from "../controllers/admin-auth.controller.js";

export const adminAuthRouter = createAuthRouter(
  "admin",
  adminAuthController,
  authService,
);
