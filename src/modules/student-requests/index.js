import {createStudentProfileService} from './services/student-profile.service.js';
import {createPaperFilesService} from './services/paper-files.service.js';
import {createConfirmationFilesService} from './services/confirmation-files.service.js';
import {createRbacRepository} from './repositories/rbac.repository.js';
import {createRbacService} from './services/rbac.service.js';
import { env } from '../../config/env.js';
import { createRequestsController } from './controllers/requests.controller.js';
import { createRequestsRepository } from './repositories/requests.repository.js';
import { createRequestsRouter } from './routes/requests.routes.js';
import { createRequestsService } from './services/requests.service.js';
import { createAdminWorkflowService } from './services/admin-workflow.service.js';
import { createWorkbookWorkflowService } from './services/workbook-workflow.service.js';
import { createSchoolStudentService } from './services/school-student.service.js';
import { createRequestActorResolver } from './middlewares/request-actor.js';

export function createRequestsModule({ repository = createRequestsRepository(), enabled = env.features.requestsDemoEnabled } = {}) {
  if (!enabled) return null;
  if (env.nodeEnv === 'production') throw new Error('Request demo must not run in production.');
  const school=createSchoolStudentService(repository);
  const profile=createStudentProfileService(repository,school);
  const loadProfile=(id,options)=>profile.get(id,options);
  const paperFiles=createPaperFilesService(repository,{loadProfile});
  const confirmationFiles=createConfirmationFilesService(repository,{loadProfile});
  const service = createRequestsService(repository,{loadProfile,paperFiles,confirmationFiles});
  const rbac=createRbacService(createRbacRepository(),repository);
  const admin = createAdminWorkflowService(repository, service, {rbac});
  const workbook = createWorkbookWorkflowService(repository, service);

  return { basePath: '/api/demo/student-requests', router: createRequestsRouter(createRequestsController(service), service, { admin, workbook, school, rbac }) };
}

export default createRequestsModule();

export function createRequestsApiModule({ channel = 'student', repository = createRequestsRepository(), enabled = env.features.requestsApiEnabled } = {}) {
  if (!enabled) return null;
  const school = createSchoolStudentService(repository);
  const profile = createStudentProfileService(repository, school);
  const loadProfile = (id,options) => profile.get(id,options);
  const service = createRequestsService(repository, {
    loadProfile, paperFiles: createPaperFilesService(repository,{loadProfile}),
    confirmationFiles: createConfirmationFilesService(repository,{loadProfile}),
  });
  const rbac = createRbacService(createRbacRepository(),repository);
  const admin = createAdminWorkflowService(repository,service,{rbac});
  const workbook = createWorkbookWorkflowService(repository,service);
  return { basePath: channel === 'student' ? '/api/student-services' : '/api/staff/student-services',
    router: createRequestsRouter(createRequestsController(service),service,{admin,workbook,school,rbac,demo:false,
      resolveActor:createRequestActorResolver({channel,service,school})}) };
}
