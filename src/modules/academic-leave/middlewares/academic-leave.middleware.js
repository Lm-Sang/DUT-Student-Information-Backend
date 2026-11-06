import {AppError} from '../../../shared/errors/app-error.js';

export function createAcademicLeaveMiddleware({studentContextProvider,reviewerContextProvider}={}) {
  return role=>async(req,res,next)=>{
    try{
      res.set({'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','Access-Control-Expose-Headers':'ETag'});
      const provider=role==='student'?studentContextProvider:reviewerContextProvider;
      if(!provider)throw new AppError('Chưa cấu hình xác thực chuyên viên cho ngừng học.',503);
      const actor=await provider(req);
      if(actor?.role!==role||typeof actor.reference!=='string'||!actor.reference.trim()||actor.reference.length>128||
        !['auth','development','manual'].includes(actor.source)||
        (role==='student'&&(typeof actor.studentCode!=='string'||!/^\d{9}$/.test(actor.studentCode)))||
        (role==='reviewer'&&(typeof actor.name!=='string'||!actor.name.trim()||actor.name.length>150)))
        throw new AppError('Không có ngữ cảnh tài khoản phù hợp.',403);
      if(['POST','PUT','PATCH'].includes(req.method)&&!req.is('application/json'))throw new AppError('Cần Content-Type application/json.',415);
      if(req.body&&Buffer.byteLength(JSON.stringify(req.body),'utf8')>16384)throw new AppError('Dữ liệu đơn quá lớn.',413);
      req.leaveActor=Object.freeze({...actor});
      req.leaveAccessToken=req.ssoAccessToken;
      next();
    }catch(error){next(error);}
  };
}

export function createAcademicLeavePrintMiddleware({studentContext,printAccess}) {
  return (req,res,next)=>{
    if(req.headers.authorization)return studentContext(req,res,next);
    try{
      res.set({'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer'});
      req.leavePrintAccess=printAccess.read(req);req.leaveActor=req.leavePrintAccess.actor;next();
    }catch(error){next(error);}
  };
}
