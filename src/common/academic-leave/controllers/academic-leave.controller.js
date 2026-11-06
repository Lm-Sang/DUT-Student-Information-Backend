import { asyncHandler } from "../../../shared/utils/async-handler.js";
import { sendSuccess } from "../../../shared/utils/response.js";
import {
  object,
  id,
  list,
  printQuery,
} from "../dto/academic-leave.request.dto.js";
import { renderAcademicLeavePrint } from "../mappers/academic-leave-print.mapper.js";
import { AppError } from "../../../shared/errors/app-error.js";

export function createAcademicLeaveHandlers() {
  const handler = (action, status = 200) =>
    asyncHandler(async (req, res) => {
      const result = await action(req, res);
      if (result?.rowVersion) res.set("ETag", '"' + result.rowVersion + '"');
      sendSuccess(res, result, status);
    });
  const empty = (req) => {
    object(req.query, []);
    object(req.body ?? {}, []);
  };
  return { handler, empty };
}

export function createAcademicLeaveController(service, { renderPdf, printAccess }) {
  const { handler, empty } = createAcademicLeaveHandlers();
  return {
    list: handler((req) => {
      object(req.body ?? {}, []);
      return service.list(req.leaveActor, list(req.query));
    }),
    get: handler((req) => {
      empty(req);
      return service.get(req.leaveActor, id(req.params.id));
    }),
    applicationHistory: handler((req) => {
      object(req.body ?? {}, []);
      object(req.query, ["page"]);
      return service.applicationHistory(
        req.leaveActor,
        id(req.params.id),
        list(req.query),
      );
    }),
    print: asyncHandler(async (req, res) => {
      empty(req);
      const row = await service.printable(req.leaveActor, id(req.params.id));
      res.type("html").send(renderAcademicLeavePrint(row));
    }),
    printSession: handler(async (req, res) => {
      object(req.query, []);
      const code = printQuery(req.body),
        row = await service.printableByCode(req.leaveActor, code);
      printAccess.issue(res, req.leaveActor, row);
      return { url: row.printUrl, expiresInSeconds: 300 };
    }),
    pdf: asyncHandler(async (req, res) => {
      object(req.body ?? {}, []);
      const code = printQuery(req.query),
        row = await service.printableByCode(req.leaveActor, code);
      if (
        req.leavePrintAccess &&
        req.leavePrintAccess.confirmedAt !== row.studentConfirmedAt
      )
        throw new AppError(
          "Đơn đã được xác nhận lại. Bấm In đơn để tải bản hiện tại.",
          401,
        );
      const bytes = await renderPdf(renderAcademicLeavePrint(row));
      res
        .set({
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${code}.pdf"`,
          "Cache-Control": "private, no-store",
        })
        .send(bytes);
    }),
  };
}
