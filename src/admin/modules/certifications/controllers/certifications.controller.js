import { createCertificationsController, createCertificationHandler } from '../../../../common/certifications/controllers/certifications.controller.js';
import { empty, object, parseList, rowVersion, parseReview, parseLanguage, parseType, parsePolicy, parseIssuer } from '../../../../common/certifications/dto/certifications.request.dto.js';

export function createAdminCertificationsController(service) {
  const handler = createCertificationHandler();
  const controller = {
    ...createCertificationsController(service),
    managementCatalog: handler(req => { empty(req.body, req.query); return service.managementCatalog(req.certificationActor); }),
    queue: handler(req => service.list(req.certificationActor, parseList(req.query, 'submitted'))),
    review: handler((req, p) => {
      object(req.query, []);
      return service.review(req.certificationActor, p.applicationId, rowVersion(req.headers['if-match']), parseReview(req.body));
    }),
  };
  for (const [kind, parser] of Object.entries({ languages: parseLanguage, types: parseType, policies: parsePolicy, issuers: parseIssuer })) {
    controller['create_' + kind] = handler(req => {
      object(req.query, []);
      return service.saveCatalog(req.certificationActor, kind, parser(req.body));
    }, 201);
    controller['update_' + kind] = handler((req, p) => {
      object(req.query, []);
      return service.saveCatalog(req.certificationActor, kind, parser(req.body), p.catalogId, rowVersion(req.headers['if-match']));
    });
  }
  return controller;
}
