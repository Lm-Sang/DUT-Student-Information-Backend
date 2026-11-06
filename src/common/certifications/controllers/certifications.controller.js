import { asyncHandler } from '../../../shared/utils/async-handler.js';
import { sendSuccess } from '../../../shared/utils/response.js';
import { uuid, integer, parseList, empty } from '../dto/certifications.request.dto.js';

// Shared transport parsing and read endpoints for both frontend modules.
export function createCertificationHandler() {
  return (action, status = 200) => asyncHandler(async (req, res) => {
    const ids = Object.fromEntries(Object.entries(req.params).map(([key, value]) => [
      key, key === 'catalogId'
        ? (/^[1-9]\d*$/.test(value) ? integer(Number(value), key) : integer(NaN, key))
        : uuid(value, key),
    ]));
    const result = await action(req, ids);
    if (result?.rowVersion) res.set('ETag', '"' + result.rowVersion + '"');
    return sendSuccess(res, result, status);
  });
}

export function createCertificationsController(service) {
  const handler = createCertificationHandler();
  return {
    list: handler(req => service.list(req.certificationActor, parseList(req.query))),
    get: handler((req, p) => { empty(req.body, req.query); return service.get(req.certificationActor, p.applicationId); }),
    download: handler((req, p) => { empty(req.body, req.query); return service.download(req.certificationActor, p.applicationId, p.fileId); }),
  };
}
