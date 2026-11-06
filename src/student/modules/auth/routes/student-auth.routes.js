import { createAuthRouter } from "../../../../common/auth/routes/auth.routes.js";
import { authService } from "../../../../common/auth/services/auth.service.js";
import { studentAuthController } from "../controllers/student-auth.controller.js";

export const studentAuthRouter = createAuthRouter(
  "student",
  studentAuthController,
  authService,
);
