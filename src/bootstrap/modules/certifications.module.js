import { certificationConfig } from "../../config/certifications.js";
import { createR2Storage } from "../../infrastructure/storage/r2-storage.js";
import { createDocumentImageInspector } from "../../infrastructure/images/document-image.js";
import { createCertificationsRepository } from "../../common/certifications/repositories/certifications.repository.js";
import { createCertificationsService } from "../../common/certifications/services/certifications.service.js";
import { createCertificationMiddleware } from "../../common/certifications/middlewares/certifications.middleware.js";
import { createDutStudentContext } from "../../common/students/index.js";
import { createStudentCertificationsController } from "../../student/modules/certifications/controllers/certifications.controller.js";
import { createAdminCertificationsController } from "../../admin/modules/certifications/controllers/certifications.controller.js";
import { createCertificationsRouter } from "../routes/certifications.routes.js";
import { createItCertificationsRepository } from "../../common/certifications/repositories/it-certifications.repository.js";
import { createItCertificationsService } from "../../common/certifications/services/it-certifications.service.js";
import { createStudentItCertificationsController } from "../../student/modules/certifications/controllers/it-certifications.controller.js";
import { createAdminItCertificationsController } from "../../admin/modules/certifications/controllers/it-certifications.controller.js";
import { createItCertificationsRouter } from "../routes/it-certifications.routes.js";
import { certificationEvents } from "../../common/certifications/events/certification-events.js";
import { certificationImageQueue } from "../../common/certifications/queues/image-inspection-queue.js";
import { createCertificationEventsController } from "../../common/certifications/controllers/certification-events.controller.js";
import { createLocalPermissionContext } from "../../common/auth/index.js";
import { createStudentCertificationsRouter } from "../../student/modules/certifications/routes/certifications.routes.js";
import { createAdminCertificationsRouter } from "../../admin/modules/certifications/routes/certifications.routes.js";
import { createStudentItCertificationsRouter } from "../../student/modules/certifications/routes/it-certifications.routes.js";
import { createAdminItCertificationsRouter } from "../../admin/modules/certifications/routes/it-certifications.routes.js";

const reviewerContext = createLocalPermissionContext("certifications:review", undefined, 1);
const catalogContext = createLocalPermissionContext(
  "certifications:catalog:manage",
  undefined, 1,
);
const localReviewerAuthentication = {
  actor: (req, role) =>
    (role === "catalog" ? catalogContext : reviewerContext)(req),
};
const localItReviewerAuthentication = {
  actor: (req, role) => createLocalPermissionContext(
    role === 'catalog' ? 'certifications:catalog:manage' : 'certifications:review', undefined, 2,
  )(req),
};

export function createCertificationsModule({
  config = certificationConfig,
  repository = createCertificationsRepository(),
  storage = createR2Storage({ config: config.r2 }),
  inspectImage = createDocumentImageInspector(config),
  contextProvider,
  studentContextProvider = createDutStudentContext(),
  reviewerAuthentication = localReviewerAuthentication,
  clock,
  events = certificationEvents,
  inspectionQueue = certificationImageQueue,
} = {}) {
  config = Object.freeze({ ...config, maxFiles: 1 });
  const service = createCertificationsService({
    repository,
    storage,
    inspectImage,
    config,
    clock,
    events,
    inspectionQueue,
  });
  const studentController = createStudentCertificationsController(
    service,
    config,
  );
  const adminController = createAdminCertificationsController(service);
  const controller = { ...studentController, ...adminController };
  const context = createCertificationMiddleware(
    config,
    contextProvider,
    studentContextProvider,
    reviewerAuthentication?.actor,
  );
  const eventHandler = createCertificationEventsController(events, config, 'language');
  return {
    basePath: "/api/certifications",
    router: createCertificationsRouter(
      controller,
      context,
      reviewerAuthentication?.router,
      eventHandler,
    ),
    studentRouter: createStudentCertificationsRouter(studentController, context, eventHandler),
    adminRouter: createAdminCertificationsRouter(adminController, context, eventHandler),
    service,
  };
}

export default createCertificationsModule();

export function createItCertificationsModule({
  config = certificationConfig,
  repository = createItCertificationsRepository(),
  storage = createR2Storage({ config: config.r2 }),
  inspectImage = createDocumentImageInspector(config),
  contextProvider,
  studentContextProvider = createDutStudentContext(),
  reviewerAuthentication = localItReviewerAuthentication,
  clock,
  events = certificationEvents,
  inspectionQueue = certificationImageQueue,
} = {}) {
  const service = createItCertificationsService({
    repository,
    storage,
    inspectImage,
    config,
    clock,
    events,
    inspectionQueue,
  });
  const studentController = createStudentItCertificationsController(
    service,
    config,
  );
  const adminController = createAdminItCertificationsController(service);
  const controller = { ...studentController, ...adminController };
  const context = createCertificationMiddleware(
    config,
    contextProvider,
    studentContextProvider,
    reviewerAuthentication?.actor,
  );
  const eventHandler = createCertificationEventsController(events, config, 'it');
  return {
    basePath: "/api/it-certifications",
    service,
    router: createItCertificationsRouter(controller, context, eventHandler),
    studentRouter: createStudentItCertificationsRouter(studentController, context, eventHandler),
    adminRouter: createAdminItCertificationsRouter(adminController, context, eventHandler),
  };
}

export const itCertificationsModule = createItCertificationsModule();
export const closeCertificationConnections = () =>
  certificationEvents.closeAll();
