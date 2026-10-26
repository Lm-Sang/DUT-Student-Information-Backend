import { certificationConfig } from '../../config/certifications.js';
import { createR2Storage } from '../../infrastructure/storage/r2-storage.js';
import { createDocumentImageInspector } from '../../infrastructure/images/document-image.js';
import { createCertificationsRepository } from './repositories/certifications.repository.js';
import { createCertificationsService } from './services/certifications.service.js';
import { createCertificationMiddleware } from './middlewares/certifications.middleware.js';
import { createDutStudentContext } from './middlewares/dut-student-context.js';
import { createCertificationsController } from './controllers/certifications.controller.js';
import { createCertificationsRouter } from './routes/certifications.routes.js';
import { createItCertificationsRepository } from './repositories/it-certifications.repository.js';
import { createItCertificationsService } from './services/it-certifications.service.js';
import { createItCertificationsController } from './controllers/it-certifications.controller.js';
import { createItCertificationsRouter } from './routes/it-certifications.routes.js';
import {certificationEvents} from './events/certification-events.js';
import {certificationImageQueue} from './queues/image-inspection-queue.js';
import {createCertificationEventsController} from './controllers/certification-events.controller.js';

export function createCertificationsModule({
  config = certificationConfig,
  repository = createCertificationsRepository(),
  storage = createR2Storage({ config: config.r2 }),
  inspectImage = createDocumentImageInspector(config),
  contextProvider,
  studentContextProvider = createDutStudentContext(),
  reviewerAuthentication,
  clock,
  events=certificationEvents,
  inspectionQueue=certificationImageQueue,
} = {}) {
  config = Object.freeze({ ...config, maxFiles: 1 });
  const service = createCertificationsService({ repository, storage, inspectImage, config, clock, events, inspectionQueue });
  const controller = createCertificationsController(service, config);
  return {
    basePath: '/api/certifications',
    router: createCertificationsRouter(
      controller,
      createCertificationMiddleware(config, contextProvider, studentContextProvider, reviewerAuthentication?.actor),
      reviewerAuthentication?.router,
      createCertificationEventsController(events,config),
    ),
    service,
  };
}

export default createCertificationsModule();

export function createItCertificationsModule({
  config=certificationConfig,repository=createItCertificationsRepository(),
  storage=createR2Storage({config:config.r2}),inspectImage=createDocumentImageInspector(config),
  contextProvider,studentContextProvider=createDutStudentContext(),reviewerAuthentication,clock,
  events=certificationEvents,inspectionQueue=certificationImageQueue,
}={}){
  const service=createItCertificationsService({repository,storage,inspectImage,config,clock,events,inspectionQueue});
  return{basePath:'/api/it-certifications',service,router:createItCertificationsRouter(
    createItCertificationsController(service,config),
    createCertificationMiddleware(config,contextProvider,studentContextProvider,reviewerAuthentication?.actor))};
}

export const itCertificationsModule=createItCertificationsModule();
export const closeCertificationConnections=()=>certificationEvents.closeAll();
