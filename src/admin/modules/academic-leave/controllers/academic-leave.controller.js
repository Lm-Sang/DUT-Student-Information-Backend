import { createAcademicLeaveController, createAcademicLeaveHandlers } from '../../../../common/academic-leave/controllers/academic-leave.controller.js';
import { object, id, version, review } from '../../../../common/academic-leave/dto/academic-leave.request.dto.js';

export function createAdminAcademicLeaveController(service, options) {
  const { handler, empty } = createAcademicLeaveHandlers();
  return {
    ...createAcademicLeaveController(service, options),
    review: handler(req => {
      object(req.query, []);
      return service.review(req.leaveActor, id(req.params.id), version(req.headers['if-match']), review(req.body));
    }),
    receivePaper: handler(req => {
      empty(req);
      return service.receivePaper(req.leaveActor, id(req.params.id), version(req.headers['if-match']));
    }),
  };
}
