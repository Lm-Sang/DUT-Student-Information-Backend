import { Router } from "express";
import { createStudentAcademicLeaveRouter } from "../../student/modules/academic-leave/routes/academic-leave.routes.js";
import { createAdminAcademicLeaveRouter } from "../../admin/modules/academic-leave/routes/academic-leave.routes.js";

export function createAcademicLeaveRouter(controller, context, printContext) {
  const router = Router();
  router.use("/reviewer", createAdminAcademicLeaveRouter(controller, context));
  router.use(
    createStudentAcademicLeaveRouter(controller, context, printContext),
  );
  return router;
}
