import { createAcademicLeaveController, createAcademicLeaveHandlers } from '../../../../common/academic-leave/controllers/academic-leave.controller.js';
import { object, id, version, draft, list } from '../../../../common/academic-leave/dto/academic-leave.request.dto.js';

export function createStudentAcademicLeaveController(service, options) {
  const { handler, empty } = createAcademicLeaveHandlers();
  return {
    ...createAcademicLeaveController(service, options),
    form: handler(req => { empty(req); return service.form(req.leaveActor); }),
    history: handler(req => {
      object(req.body ?? {}, []);
      object(req.query, ['page']);
      return service.history(req.leaveActor, list(req.query));
    }),
    create: handler(req => { object(req.query, []); return service.save(req.leaveActor, draft(req.body)); }, 201),
    update: handler(req => {
      object(req.query, []);
      return service.save(req.leaveActor, draft(req.body), id(req.params.id), version(req.headers['if-match']));
    }),
    confirm: handler(req => {
      empty(req);
      return service.confirm(req.leaveActor, id(req.params.id), version(req.headers['if-match']), req.leaveAccessToken);
    }),
    cancel: handler(req => {
      empty(req);
      return service.cancel(req.leaveActor, id(req.params.id), version(req.headers['if-match']));
    }),
  };
}
