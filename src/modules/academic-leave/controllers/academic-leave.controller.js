import {asyncHandler} from '../../../shared/utils/async-handler.js';
import {sendSuccess} from '../../../shared/utils/response.js';
import {object,id,version,draft,review,list,printQuery} from '../dto/academic-leave.request.dto.js';
import {renderAcademicLeavePrint} from '../mappers/academic-leave-print.mapper.js';
import {AppError} from '../../../shared/errors/app-error.js';

export function createAcademicLeaveController(service,{renderPdf,printAccess}) {
  const handler=(action,status=200)=>asyncHandler(async(req,res)=>{
    const result=await action(req,res);if(result?.rowVersion)res.set('ETag','"'+result.rowVersion+'"');
    sendSuccess(res,result,status);
  });
  const empty=req=>{object(req.query,[]);object(req.body??{},[]);};
  return{
    form:handler(req=>{empty(req);return service.form(req.leaveActor,req.leaveAccessToken);}),
    list:handler(req=>{object(req.body??{},[]);return service.list(req.leaveActor,list(req.query));}),
    get:handler(req=>{empty(req);return service.get(req.leaveActor,id(req.params.id));}),
    create:handler(req=>{object(req.query,[]);return service.save(req.leaveActor,draft(req.body));},201),
    update:handler(req=>{object(req.query,[]);return service.save(req.leaveActor,draft(req.body),id(req.params.id),version(req.headers['if-match']));}),
    confirm:handler(req=>{empty(req);return service.confirm(req.leaveActor,id(req.params.id),version(req.headers['if-match']),req.leaveAccessToken);}),
    review:handler(req=>{object(req.query,[]);return service.review(req.leaveActor,id(req.params.id),version(req.headers['if-match']),review(req.body));}),
    receivePaper:handler(req=>{empty(req);return service.receivePaper(req.leaveActor,id(req.params.id),version(req.headers['if-match']));}),
    cancel:handler(req=>{empty(req);return service.cancel(req.leaveActor,id(req.params.id),version(req.headers['if-match']));}),
    print:asyncHandler(async(req,res)=>{empty(req);const row=await service.printable(req.leaveActor,id(req.params.id));
      res.type('html').send(renderAcademicLeavePrint(row));}),
    printSession:handler(async(req,res)=>{
      object(req.query,[]);const code=printQuery(req.body),row=await service.printableByCode(req.leaveActor,code);
      printAccess.issue(res,req.leaveActor,row);
      return{url:row.printUrl,expiresInSeconds:300};
    }),
    pdf:asyncHandler(async(req,res)=>{
      object(req.body??{},[]);const code=printQuery(req.query),row=await service.printableByCode(req.leaveActor,code);
      if(req.leavePrintAccess&&req.leavePrintAccess.confirmedAt!==row.studentConfirmedAt)
        throw new AppError('Đơn đã được xác nhận lại. Bấm In đơn để tải bản hiện tại.',401);
      const bytes=await renderPdf(renderAcademicLeavePrint(row));
      res.set({'Content-Type':'application/pdf','Content-Disposition':`inline; filename="${code}.pdf"`,'Cache-Control':'private, no-store'}).send(bytes);
    }),
  };
}
