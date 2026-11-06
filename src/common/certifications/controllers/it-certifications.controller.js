import { createCertificationHandler } from './certifications.controller.js';
import { parseList, empty, object } from '../dto/certifications.request.dto.js';

export function createItCertificationsController(service) {
  const handler = createCertificationHandler();
  return {
    records: handler(req => {
      object(req.query, ['page', 'pageSize']);
      return service.records(req.certificationActor, parseList(req.query));
    }),
    list: handler(req => service.list(req.certificationActor, parseList(req.query))),
    get: handler((req, p) => { empty(req.body, req.query); return service.get(req.certificationActor, p.applicationId); }),
    download: handler((req, p) => { empty(req.body, req.query); return service.download(req.certificationActor, p.applicationId, p.fileId); }),
  };
}
