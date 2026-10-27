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

export function createRequestsModule({ repository = createRequestsRepository(), enabled = env.features.requestsDemoEnabled } = {}) {
  if (!enabled) return null;
  if (env.nodeEnv === 'production') throw new Error('Request demo must not run in production.');
  const school=createSchoolStudentService(repository);
  const profile=createStudentProfileService(repository,school);
  const loadProfile=id=>profile.get(id);
  const paperFiles=createPaperFilesService(repository,{loadProfile});
  const confirmationFiles=createConfirmationFilesService(repository,{loadProfile});
  const service = createRequestsService(repository,{loadProfile,paperFiles,confirmationFiles});
  const rbac=createRbacService(createRbacRepository(),repository);
  const admin = createAdminWorkflowService(repository, service, {rbac});
  const workbook = createWorkbookWorkflowService(repository, service);

  return { basePath: '/api/demo/student-requests', router: createRequestsRouter(createRequestsController(service), service, { admin, workbook, school, rbac }) };
}

export default createRequestsModule();
