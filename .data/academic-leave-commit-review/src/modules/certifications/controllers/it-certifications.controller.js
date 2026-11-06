import { asyncHandler } from "../../../shared/utils/async-handler.js";
import { sendSuccess } from "../../../shared/utils/response.js";
import { AppError } from "../../../shared/errors/app-error.js";
import {
  uuid,
  rowVersion,
  parseList,
  parseReview,
  empty,
  object,
} from "../dto/certifications.request.dto.js";
import { parseItPreparation } from "../dto/it-certifications.request.dto.js";

export function createItCertificationsController(service, config) {
  function handler(action, status = 200) {
    return asyncHandler(async (req, res) => {
      const ids = Object.fromEntries(
        Object.entries(req.params).map(([key, value]) => [
          key,
          uuid(value, key),
        ]),
      );
      const result = await action(req, ids);
      if (result?.rowVersion) res.set("ETag", '"' + result.rowVersion + '"');
      return sendSuccess(res, result, status);
    });
  }
  return {
    form: handler((req) => {
      empty(req.body, req.query);
      return service.form(req.certificationActor);
    }),
    records: handler((req) => {
      object(req.query, ["page", "pageSize"]);
      return service.records(req.certificationActor, parseList(req.query));
    }),
    prepare: handler((req) => {
      if (!req.is("application/json"))
        throw new AppError("Cần gửi Content-Type application/json.", 415);
      object(req.query, []);
      return service.prepare(
        req.certificationActor,
        parseItPreparation(
          req.body,
          config,
          req.certificationActor.studentCode,
        ),
      );
    }, 201),
    complete: handler((req, p) => {
      empty(req.body, req.query);
      return service.complete(req.certificationActor, p.applicationId);
    }),
    list: handler((req) =>
      service.list(req.certificationActor, parseList(req.query)),
    ),
    queue: handler((req) =>
      service.list(req.certificationActor, parseList(req.query, "submitted")),
    ),
    get: handler((req, p) => {
      empty(req.body, req.query);
      return service.get(req.certificationActor, p.applicationId);
    }),
    review: handler((req, p) => {
      object(req.query, []);
      return service.review(
        req.certificationActor,
        p.applicationId,
        rowVersion(req.headers["if-match"]),
        parseReview(req.body),
      );
    }),
    download: handler((req, p) => {
      empty(req.body, req.query);
      return service.download(
        req.certificationActor,
        p.applicationId,
        p.fileId,
      );
    }),
  };
}
