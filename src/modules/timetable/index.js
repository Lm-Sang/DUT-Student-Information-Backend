import { createReadApiModule } from '../../shared/http/create-read-api-module.js';
import { timetableEndpoints } from './timetable.endpoints.js';

export function createTimetableModule(clientOptions) {
  return createReadApiModule({
    basePath: '/api/public/tkb',
    endpoints: timetableEndpoints,
    clientOptions,
  });
}

export default createTimetableModule();
