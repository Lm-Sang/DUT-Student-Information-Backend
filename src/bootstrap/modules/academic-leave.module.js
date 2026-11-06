import {
  createDutStudentContext,
  createStudentApplicationDataService,
} from "../../common/students/index.js";
import { createLocalPermissionContext } from "../../common/auth/index.js";
import { createAcademicLeaveRepository } from "../../common/academic-leave/repositories/academic-leave.repository.js";
import { createAcademicLeaveService } from "../../common/academic-leave/services/academic-leave.service.js";
import {
  createAcademicLeaveMiddleware,
  createAcademicLeavePrintMiddleware,
} from "../../common/academic-leave/middlewares/academic-leave.middleware.js";
import { createAcademicLeavePrintAccess } from "../../common/academic-leave/middlewares/academic-leave-print-access.js";
import { pdfRenderer } from "../../infrastructure/pdf/chromium-pdf.js";
import { createStudentAcademicLeaveController } from "../../student/modules/academic-leave/controllers/academic-leave.controller.js";
import { createAdminAcademicLeaveController } from "../../admin/modules/academic-leave/controllers/academic-leave.controller.js";
import { createAcademicLeaveRouter } from "../routes/academic-leave.routes.js";
import { createStudentAcademicLeaveRouter } from "../../student/modules/academic-leave/routes/academic-leave.routes.js";
import { createAdminAcademicLeaveRouter } from "../../admin/modules/academic-leave/routes/academic-leave.routes.js";
const applicationData = createStudentApplicationDataService();

export function createAcademicLeaveModule({
  repository = createAcademicLeaveRepository(),
  snapshotProvider = (actor, token) => applicationData.snapshot(actor, token),
  prefillProvider = (actor) => applicationData.prefill(actor),
  studentContextProvider = createDutStudentContext(),
  reviewerContextProvider = createLocalPermissionContext(
    "academic-leave:review",
  ),
  clock,
  renderPdf = (html) => pdfRenderer.render(html),
  printAccess = createAcademicLeavePrintAccess(),
} = {}) {
  const service = createAcademicLeaveService({
    repository,
    snapshotProvider,
    prefillProvider,
    clock,
  });
  const context = createAcademicLeaveMiddleware({
    studentContextProvider,
    reviewerContextProvider,
  });
  const options = { renderPdf, printAccess };
  const studentController = createStudentAcademicLeaveController(
    service,
    options,
  );
  const adminController = createAdminAcademicLeaveController(service, options);
  const controller = { ...studentController, ...adminController };
  const printContext = createAcademicLeavePrintMiddleware({
    studentContext: context("student"),
    printAccess,
  });
  return {
    basePath: "/api/academic-leave",
    service,
    router: createAcademicLeaveRouter(controller, context, printContext),
    studentRouter: createStudentAcademicLeaveRouter(studentController, context, printContext),
    adminRouter: createAdminAcademicLeaveRouter(adminController, context),
  };
}
export default createAcademicLeaveModule();
