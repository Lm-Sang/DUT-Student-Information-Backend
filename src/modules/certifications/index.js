import { certificationConfig } from '../../config/certifications.js';
import { createR2Storage } from '../../infrastructure/storage/r2-storage.js';
import { createDocumentImageInspector } from '../../infrastructure/images/document-image.js';
import { createCertificationsRepository } from './repositories/certifications.repository.js';
import { createCertificationsService } from './services/certifications.service.js';
import { createCertificationMiddleware } from './middlewares/certifications.middleware.js';
import { createDutStudentContext } from './middlewares/dut-student-context.js';
import { createCertificationsController } from './controllers/certifications.controller.js';
import { createCertificationsRouter } from './routes/certifications.routes.js';

export function createCertificationsModule({
  config = certificationConfig,
  repository = createCertificationsRepository(),
  storage = createR2Storage({ config: config.r2 }),
  inspectImage = createDocumentImageInspector(config),
  contextProvider,
  studentContextProvider = createDutStudentContext(),
  reviewerAuthentication,
  clock,
} = {}) {
  const service = createCertificationsService({ repository, storage, inspectImage, config, clock });
  const controller = createCertificationsController(service, config);
  return {
    basePath: '/api/certifications',
    router: createCertificationsRouter(
      controller,
      createCertificationMiddleware(config, contextProvider, studentContextProvider, reviewerAuthentication?.actor),
      reviewerAuthentication?.router
    ),
    service,
  };
}

export default createCertificationsModule();
