import { env } from "../../config/env.js";
import { createRequestsRepository } from "../../common/student-requests/repositories/requests.repository.js";
import { createRbacRepository } from "../../common/student-requests/repositories/rbac.repository.js";
import { createRequestsService } from "../../common/student-requests/services/requests.service.js";
import { createRbacService } from "../../common/student-requests/services/rbac.service.js";
import { createSchoolStudentService } from "../../common/student-requests/services/school-student.service.js";
import { createStudentProfileService } from "../../common/student-requests/services/student-profile.service.js";
import { createPaperFilesService } from "../../common/student-requests/services/paper-files.service.js";
import { createConfirmationFilesService } from "../../common/student-requests/services/confirmation-files.service.js";
import { createAdminWorkflowService } from "../../admin/modules/student-requests/services/admin-workflow.service.js";
import { createWorkbookWorkflowService } from "../../admin/modules/student-requests/services/workbook-workflow.service.js";
import { createDemoRequestsController } from "./controllers/requests.controller.js";
import { createRequestsRouter } from "./routes/requests.routes.js";

export function createRequestsModule({
  repository = createRequestsRepository(),
  enabled = env.features.requestsDemoEnabled,
} = {}) {
  if (!enabled) return null;
  if (env.nodeEnv === "production")
    throw new Error("Request demo must not run in production.");
  const school = createSchoolStudentService(repository);
  const profile = createStudentProfileService(repository, school);
  const loadProfile = (id, options) => profile.get(id, options);
  const service = createRequestsService(repository, {
    loadProfile,
    paperFiles: createPaperFilesService(repository, { loadProfile }),
    confirmationFiles: createConfirmationFilesService(repository, {
      loadProfile,
    }),
  });
  const rbac = createRbacService(createRbacRepository(), repository);
  const admin = createAdminWorkflowService(repository, service, { rbac });
  const workbook = createWorkbookWorkflowService(repository, service);
  return {
    basePath: "/api/demo/student-requests",
    router: createRequestsRouter(
      createDemoRequestsController(service),
      service,
      { admin, workbook, school, rbac },
    ),
  };
}
