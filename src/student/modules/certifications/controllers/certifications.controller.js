import { createCertificationsController, createCertificationHandler } from '../../../../common/certifications/controllers/certifications.controller.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import { empty, object, parsePreparation } from '../../../../common/certifications/dto/certifications.request.dto.js';

export function createStudentCertificationsController(service, config) {
  const handler = createCertificationHandler();
  return {
    ...createCertificationsController(service),
    catalog: handler(req => { empty(req.body, req.query); return service.catalog(req.certificationActor); }),
    prepare: handler(req => {
      if (!req.is('application/json')) throw new AppError('Cần gửi Content-Type application/json.', 415);
      object(req.query, []);
      return service.prepare(req.certificationActor, parsePreparation(req.body, config));
    }, 201),
    complete: handler((req, p) => { empty(req.body, req.query); return service.complete(req.certificationActor, p.applicationId); }),
  };
}
