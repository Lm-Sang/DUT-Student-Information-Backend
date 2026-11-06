import { createStudentProfileService } from "../../common/student-requests/services/student-profile.service.js";
import { createPaperFilesService } from "../../common/student-requests/services/paper-files.service.js";
import { createConfirmationFilesService } from "../../common/student-requests/services/confirmation-files.service.js";
import { env } from "../../config/env.js";
import { createStudentRequestsController } from "../../student/modules/student-requests/controllers/requests.controller.js";
import { createRequestsRepository } from "../../common/student-requests/repositories/requests.repository.js";
import { createRequestsService } from "../../common/student-requests/services/requests.service.js";
import { createWorkbookWorkflowService } from "../../admin/modules/student-requests/services/workbook-workflow.service.js";
import { createSchoolStudentService } from "../../common/student-requests/services/school-student.service.js";
import { createRequestActorResolver } from "../../common/student-requests/middlewares/request-actor.js";
import { createStudentRequestsRouter } from "../../student/modules/student-requests/routes/requests.routes.js";
import { createAdminRequestsRouter } from "../../admin/modules/student-requests/routes/requests.routes.js";
import { createAdminRequestsController } from "../../admin/modules/student-requests/controllers/requests.controller.js";
import { AppError } from "../../shared/errors/app-error.js";

// Demo impersonation and demo RBAC are no longer part of application bootstrap.
export default null;

export function createRequestsApiModule({
  channel = "student",
  repository = createRequestsRepository(),
  enabled = env.features.requestsApiEnabled,
} = {}) {
  if (!enabled) return null;
  if (!["student", "staff"].includes(channel))
    throw new AppError("Unknown requests API channel", 400);
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
  const resolveActor = createRequestActorResolver({ channel, service, school });
  if (channel === "student") {
    const controller = createStudentRequestsController(service);
    return {
      basePath: "/api/student-services",
      router: createStudentRequestsRouter(controller, resolveActor, {
        collectionPath: "/requests",
      }),
      studentRouter: createStudentRequestsRouter(controller, resolveActor),
      service,
    };
  }
  const workbook = createWorkbookWorkflowService(repository, service);
  const options = { workbook };
  const controller = createAdminRequestsController(service, options);
  return {
    basePath: "/api/staff/student-services",
    router: createAdminRequestsRouter(controller, resolveActor, {
      ...options,
      legacy: true,
      collectionPath: "/requests",
    }),
    adminRouter: createAdminRequestsRouter(controller, resolveActor, options),
    service,
  };
}
