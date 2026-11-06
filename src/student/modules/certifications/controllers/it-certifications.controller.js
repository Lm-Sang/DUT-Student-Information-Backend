import { createItCertificationsController } from '../../../../common/certifications/controllers/it-certifications.controller.js';
import { createCertificationHandler } from '../../../../common/certifications/controllers/certifications.controller.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import { empty, object } from '../../../../common/certifications/dto/certifications.request.dto.js';
import { parseItPreparation } from '../../../../common/certifications/dto/it-certifications.request.dto.js';

export function createStudentItCertificationsController(service, config) {
  const handler = createCertificationHandler();
  return {
    ...createItCertificationsController(service),
    form: handler(req => { empty(req.body, req.query); return service.form(req.certificationActor); }),
    prepare: handler(req => {
      if (!req.is('application/json')) throw new AppError('Cần gửi Content-Type application/json.', 415);
      object(req.query, []);
      return service.prepare(req.certificationActor, parseItPreparation(req.body, config, req.certificationActor.studentCode));
    }, 201),
    complete: handler((req, p) => { empty(req.body, req.query); return service.complete(req.certificationActor, p.applicationId); }),
  };
}
