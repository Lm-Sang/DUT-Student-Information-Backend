import { createItCertificationsController } from '../../../../common/certifications/controllers/it-certifications.controller.js';
import { createCertificationHandler } from '../../../../common/certifications/controllers/certifications.controller.js';
import { object, parseList, rowVersion, parseReview } from '../../../../common/certifications/dto/certifications.request.dto.js';

export function createAdminItCertificationsController(service) {
  const handler = createCertificationHandler();
  return {
    ...createItCertificationsController(service),
    queue: handler(req => service.list(req.certificationActor, parseList(req.query, 'submitted'))),
    review: handler((req, p) => {
      object(req.query, []);
      return service.review(req.certificationActor, p.applicationId, rowVersion(req.headers['if-match']), parseReview(req.body));
    }),
  };
}
