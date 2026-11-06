import { createStudentRequestsController } from '../../../student/modules/student-requests/controllers/requests.controller.js';

export function createDemoRequestsController(service) {
  return {
    ...createStudentRequestsController(service),
    actors: async (_req, res) => res.json({ data: await service.actors() }),
  };
}
