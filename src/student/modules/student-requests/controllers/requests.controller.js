import { createRequestsController } from '../../../../common/student-requests/controllers/requests.controller.js';
import { parseCreate } from '../../../../common/student-requests/dto/requests.dto.js';

export function createStudentRequestsController(service) {
  return {
    ...createRequestsController(service),
    create: async (req, res) => res.status(201).json({ data: await service.create(req.requestActor, parseCreate(req.body)) }),
  };
}
