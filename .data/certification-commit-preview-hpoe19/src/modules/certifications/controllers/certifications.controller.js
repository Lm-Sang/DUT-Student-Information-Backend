import { asyncHandler } from '../../../shared/utils/async-handler.js';
import { sendSuccess } from '../../../shared/utils/response.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { uuid,integer,rowVersion,parsePreparation,parseReview,parseLanguage,parseType,parsePolicy,parseList,empty,object } from '../dto/certifications.request.dto.js';

export function createCertificationsController(service,config) {
  function handler(action,status = 200) {
    return asyncHandler(async (req,res) => {
      const ids = Object.fromEntries(Object.entries(req.params).map(([key,value]) =>
        [key,key === 'catalogId' ? (/^[1-9]\d*$/.test(value) ? integer(Number(value),key) : integer(NaN,key)) : uuid(value,key)]));
      const result = await action(req,ids);
      if (result?.rowVersion) res.set('ETag','"'+result.rowVersion+'"');
      return sendSuccess(res,result,status);
    });
  }
  const controller = {
    catalog:handler(req => { empty(req.body,req.query); return service.catalog(req.certificationActor); }),
    managementCatalog:handler(req => { empty(req.body,req.query); return service.managementCatalog(req.certificationActor); }),
    prepare:handler(req => {
      if (!req.is('application/json')) throw new AppError('Cần gửi Content-Type application/json.',415);
      object(req.query,[]);
      return service.prepare(req.certificationActor,parsePreparation(req.body,config));
    },201),
    complete:handler((req,p) => { empty(req.body,req.query); return service.complete(req.certificationActor,p.applicationId); }),
    list:handler(req => service.list(req.certificationActor,parseList(req.query))),
    queue:handler(req => service.list(req.certificationActor,parseList(req.query,'submitted'))),
    get:handler((req,p) => { empty(req.body,req.query); return service.get(req.certificationActor,p.applicationId); }),
    review:handler((req,p) => {
      object(req.query,[]);
      return service.review(req.certificationActor,p.applicationId,rowVersion(req.headers['if-match']),parseReview(req.body));
    }),
    download:handler((req,p) => {
      empty(req.body,req.query);
      return service.download(req.certificationActor,p.applicationId,p.fileId);
    }),
  };
  for (const [kind,parser] of Object.entries({languages:parseLanguage,types:parseType,policies:parsePolicy})) {
    controller['create_'+kind] = handler(req => {
      object(req.query,[]);
      return service.saveCatalog(req.certificationActor,kind,parser(req.body));
    },201);
    controller['update_'+kind] = handler((req,p) => {
      object(req.query,[]);
      return service.saveCatalog(req.certificationActor,kind,parser(req.body),p.catalogId,rowVersion(req.headers['if-match']));
    });
  }
  return controller;
}