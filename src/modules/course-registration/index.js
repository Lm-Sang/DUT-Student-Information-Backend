import { createReadApiModule } from '../../shared/http/create-read-api-module.js';
import { courseRegistrationEndpoints } from './course-registration.endpoints.js';

export function createCourseRegistrationModule(clientOptions) {
  return createReadApiModule({
    basePath: '/api/public/course-registration',
    endpoints: courseRegistrationEndpoints,
    clientOptions,
  });
}

export default createCourseRegistrationModule();
