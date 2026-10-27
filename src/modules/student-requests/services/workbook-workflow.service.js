import {requirePermission} from '../domain/rbac.js';
import { createHash,createHmac,randomUUID,timingSafeEqual } from 'node:crypto';
import { AppError } from '../../../shared/errors/app-error.js';
import { canWork } from '../domain/work-permissions.js';
import { transition } from '../domain/request-rules.js';
import { makeWorkbook,readWorkbook,workbookStatus,statusLabels,excelDate,parsePrintDate } from './request-workbook.js';

const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const eligible=(a,r)=>canWork(a,r)&&r.typeCode!=='LMS_SUPPORT'&&(!r.assignedStaffId||r.assignedStaffId===a.id);
export function createWorkbookWorkflowService(repository,requests,{now=()=>new Date()}={}) {
  const batches=new Map();
  function staff(actor){if(actor.role!=='STAFF')throw new AppError('Chỉ chuyên viên được xử lý Excel.',403);}
  async function signature(actor,r){const secret=await repository.workbookSecret();if(!secret)throw new AppError('Chưa khởi tạo mẫu Excel.',503);return createHmac('sha256',secret).update(JSON.stringify([actor.id,r.id,r.version,workbookStatus(r)])).digest('hex');}
  async function plan(actor,row,batchId){
    if(!/^[a-f0-9-]{36}$/i.test(String(row.J))||!Number.isInteger(row.K)||typeof row.L!=='string'||!/^[a-f0-9]{64}$/.test(row.L))throw new AppError('Thiếu hoặc sai mã kiểm tra dòng; hãy xuất lại file.',400);
    const r=await requests.detail(actor,row.J);if(!eligible(actor,r))throw new AppError('Hồ sơ đã đổi người phụ trách hoặc bạn không còn quyền.',403);
    if(r.version!==row.K)throw new AppError('Hồ sơ đã thay đổi; cần xuất lại file.',409);
    const sign=await signature(actor,r);if(!timingSafeEqual(Buffer.from(sign),Buffer.from(row.L)))throw new AppError('File thuộc phiên bản hoặc chuyên viên khác.',400);
    if(String(row.A)!==String(r.number)||row.B!==(r.catalogSnapshot?.name||r.typeName)||String(row.C)!==String(r.studentNumber)||row.D!==r.studentName||row.E!==workbookStatus(r)
      ||Math.abs((Number(row.H)||0)-(excelDate(r.appointment?.pickupAt)||0))>0.00002)throw new AppError('Thông tin gốc đã bị sửa; hãy xuất lại file.',400);
    const target=row.F,current=workbookStatus(r),message=String(row.I??'').trim(),confirmation=r.typeCode==='CONFIRMATION',originalPrint=confirmation?excelDate(r.printedAt):'';
    if(!confirmation&&row.G!=='')throw new AppError('Đơn đề nghị không có bước in của chuyên viên; để trống ngày in.',400);
    if(message.length>2000)throw new AppError('Ghi chú tối đa 2000 ký tự.',400);
    if(target===current){if(message||Math.abs((Number(row.G)||0)-(originalPrint||0))>0.00002)throw new AppError('Chọn bước tiếp theo trước khi thay đổi ngày in hoặc ghi chú.',400);return{line:row.line,id:r.id,number:r.number,from:current,to:target,action:null};}
    let action;
    if(target===statusLabels[4])action='cancel';
    else if(current===statusLabels[0]&&target===statusLabels[1])action='receive';
    else if(!confirmation&&current===statusLabels[1]&&target===statusLabels[3])action='complete';
    else if(confirmation&&current===statusLabels[1]&&target===statusLabels[2])action='print';
    else if(confirmation&&current===statusLabels[2]&&target===statusLabels[3])action='result';
    else throw new AppError('Không được bỏ bước, quay lùi hoặc đổi đơn đã hủy / đã xử lý.',400);
    if([statusLabels[3],statusLabels[4]].includes(current))throw new AppError('Đơn đã kết thúc, không được thay đổi.',400);
    let change,printedAt;
    if(action==='print'){
      if(!row.G)throw new AppError('Nhập ngày giờ in thực tế.',400);
      printedAt=parsePrintDate(row.G);if(new Date(printedAt)<new Date(r.receivedAt||r.createdAt)||new Date(printedAt)>new Date(now().getTime()+300000))throw new AppError('Ngày in phải sau tiếp nhận và không ở tương lai.',400);
      change={message:message||'Chuyên viên ghi nhận đã in và ký giấy qua Excel.'};
    }else{
      if(Math.abs((Number(row.G)||0)-(originalPrint||0))>0.00002)throw new AppError('Chỉ được nhập ngày in khi chọn Đã in.',400);
      change=transition(actor,r,{action,message});
    }
    const command={id:r.id,actorId:actor.id,role:actor.role,version:r.version,key:`xlsx:${batchId}:${r.id}`,hash:hash(row),action,...change,
      typeCode:r.typeCode,payload:r.payload,catalogSnapshot:r.catalogSnapshot,requiredFields:[],
      ...(printedAt?{printedAt}:{}),...(action==='result'?{processedAt:now().toISOString()}:{}),eventDetails:{source:'EXCEL'}};
    return{line:row.line,id:r.id,number:r.number,from:current,to:target,action,printedAt,command};
  }
  return{
    async export(actor,input){staff(actor);requirePermission(actor,'workbook.export');if(!input||!Array.isArray(input.ids)||!input.ids.length||input.ids.length>500||input.ids.some(x=>typeof x!=='string')||new Set(input.ids).size!==input.ids.length)throw new AppError('Chọn từ 1 đến 500 hồ sơ.',400);
      const all=await requests.list(actor),rows=[],typeCodes=[];
      for(const id of input.ids){const r=all.find(r=>r.id===id);if(!r||!eligible(actor,r))throw new AppError('Có hồ sơ ngoài phạm vi xuất Excel.',403);
        typeCodes.push(r.typeCode);rows.push([String(r.number),r.catalogSnapshot?.name||r.typeName,String(r.studentNumber??''),r.studentName,workbookStatus(r),workbookStatus(r),r.typeCode==='CONFIRMATION'?excelDate(r.printedAt):'',excelDate(r.appointment?.pickupAt),'',r.id,r.version,await signature(actor,r)]);}
      return makeWorkbook(rows,{typeCodes});
    },
    async preview(actor,bytes){staff(actor);requirePermission(actor,'workbook.import');for(const[id,b]of batches)if(b.expiresAt<Date.now())batches.delete(id);if(batches.size>=200)throw new AppError('Đang có quá nhiều file chờ xử lý.',429);
      const rows=readWorkbook(bytes),batchId=randomUUID(),results=[],seen=new Set();
      for(const row of rows){try{if(seen.has(row.J))throw new AppError('Một hồ sơ xuất hiện nhiều lần.',400);seen.add(row.J);results.push(await plan(actor,row,batchId));}catch(error){if(!(error instanceof AppError))throw error;results.push({line:row.line,number:row.A,error:error.message});}}
      const errors=results.filter(r=>r.error).length,changes=results.filter(r=>r.action).length;
      if(!errors)batches.set(batchId,{actorId:actor.id,rows,expiresAt:Date.now()+15*60*1000,busy:false});
      return{batchId:errors?null:batchId,errors,changes,rows:results.map(({command,...r})=>r)};
    },
    async commit(actor,input){staff(actor);requirePermission(actor,'workbook.import');const b=batches.get(input?.batchId);if(!b||b.actorId!==actor.id||b.expiresAt<Date.now())throw new AppError('Bản xem trước đã hết hạn; hãy nhập lại file.',409);
      if(b.result)return b.result;if(b.busy)throw new AppError('File này đang được lưu.',409);b.busy=true;
      try{const commands=[];for(const row of b.rows){const p=await plan(actor,row,input.batchId);if(p.command)commands.push(p.command);}
        if(commands.length)await repository.batchUpdate(commands);b.result={updated:commands.length};return b.result;
      }finally{b.busy=false;}
    },
  };
}
