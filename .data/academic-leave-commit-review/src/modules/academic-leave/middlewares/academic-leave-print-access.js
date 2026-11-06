import {createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
import {AppError} from '../../../shared/errors/app-error.js';
import {pdfConfig} from '../../../config/pdf.js';

// Short-lived, single-document access. No DUT bearer token is stored in cookies or URLs.
export function createAcademicLeavePrintAccess({secret=pdfConfig.printCookieSecret||randomBytes(32),now=Date.now,secure=pdfConfig.secureCookies}={}) {
  if(Buffer.byteLength(secret)<32)throw new TypeError('LEAVE_PRINT_COOKIE_SECRET must be at least 32 bytes');
  const name='academic_leave_print',path='/api/academic-leave/print',ttlMs=5*60000;
  const sign=value=>createHmac('sha256',secret).update(value).digest();
  return Object.freeze({
    issue(res,actor,row){
      const value=Buffer.from(JSON.stringify({requestCode:row.requestCode,confirmedAt:row.studentConfirmedAt,expiresAt:now()+ttlMs,
        actor:{role:actor.role,source:actor.source,reference:actor.reference,studentCode:actor.studentCode}})).toString('base64url');
      res.cookie(name,value+'.'+sign(value).toString('base64url'),{httpOnly:true,sameSite:'strict',secure,path,maxAge:ttlMs});
    },
    read(req){
      const cookies=(req.headers.cookie??'').split(';').map(value=>value.trim()).filter(value=>value.startsWith(name+'='));
      if(cookies.length!==1)throw new AppError('Mở nút In đơn trong phiên đăng nhập để cấp quyền xem PDF.',401);
      const encoded=cookies[0].slice(name.length+1);
      if(encoded.length>2048)throw new AppError('Phiên in không hợp lệ.',401);
      try{
        const [value,signature,...rest]=encoded.split('.'),actual=Buffer.from(signature??'','base64url'),expected=sign(value??'');
        if(rest.length||actual.length!==expected.length||!timingSafeEqual(actual,expected))throw new Error();
        const payload=JSON.parse(Buffer.from(value,'base64url').toString('utf8'));
        if(!Number.isFinite(payload.expiresAt)||payload.expiresAt<=now()||payload.requestCode!==req.query.MADN||
          !['student','reviewer'].includes(payload.actor?.role))throw new Error();
        return payload;
      }catch{throw new AppError('Phiên in đã hết hạn hoặc không khớp mã đơn. Bấm In đơn để mở lại.',401);}
    },
  });
}
