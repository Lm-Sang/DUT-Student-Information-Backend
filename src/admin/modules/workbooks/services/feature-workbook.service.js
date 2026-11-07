import {createHmac,randomUUID,timingSafeEqual} from 'node:crypto';
import {AppError} from '../../../../shared/errors/app-error.js';
import {makeGridWorkbook} from '../../../../infrastructure/spreadsheets/grid-workbook.js';
import {readWorkbook} from '../../../../infrastructure/spreadsheets/xlsx.js';
import {withLocalTransaction} from '../../../../database.js';
const actionNames={processing:'Tiếp nhận',received:'Tiếp nhận online',receive_paper:'Đã nhận bản giấy',verified:'Chấp nhận chứng chỉ',approved:'Đã xử lý',rejected:'Từ chối',needs_changes:'Yêu cầu bổ sung'};
const statusNames={draft:'Bản nháp',uploading:'Chưa nộp',submitted:'Chờ tiếp nhận',received:'Chờ bản giấy',processing:'Đang xử lý',needs_changes:'Cần bổ sung',verified:'Đã xác minh',approved:'Đã chấp nhận',rejected:'Đã từ chối',cancelled:'Đã hủy'};
const methods={'Đối chiếu minh chứng':'document_comparison','Tra cứu đơn vị cấp':'issuer_lookup','Phương pháp khác':'other'};
export function createFeatureWorkbookService({module,service,secret,atomic=withLocalTransaction,clock=Date.now}){
 const batches=new Map();
 function requireAccess(actor,operation){if(actor.monitoring&&operation==='export')return;if(actor.monitoring||!actor.permissions?.includes(`${module}:workbook:${operation}`))throw new AppError('Bạn chưa có quyền '+(operation==='export'?'xuất':'nhập')+' Excel cho chức năng này.',403);}
 const normalize=r=>({id:String(r.id),version:r.rowVersion,studentCode:r.studentCode??'',name:r.fullName??r.snapshot?.student?.fullName??'',type:module==='academic-leave'?({leave:'Ngừng học',extension:'Gia hạn ngừng học',return:'Trở lại học'})[r.kind]:module==='certifications'?r.catalogSnapshot?.type?.displayName:r.currentSubmission?.certificateTypeName??r.pendingSubmission?.certificateTypeName??'',status:r.status,submitted:r.submittedAt??r.studentConfirmedAt??r.createdAt??'',actions:module==='academic-leave'&&r.status==='received'?['receive_paper']:r.allowedActions??[]});
 const signature=(actor,row)=>createHmac('sha256',secret()).update(JSON.stringify([module,actor.reference,row])).digest('hex');
 async function plan(actor,line){
  const row=normalize(await service.get(actor,line.A));
  if(String(line.H)!==row.version||line.J!==module)throw new AppError('Hồ sơ đã thay đổi hoặc file sai chức năng. Hãy xuất lại.',409);
  const sig=signature(actor,row);if(typeof line.I!=='string'||!/^[a-f0-9]{64}$/.test(line.I)||!timingSafeEqual(Buffer.from(sig),Buffer.from(line.I)))throw new AppError('File không thuộc chuyên viên / phiên bản này.',400);
  if(String(line.B)!==row.studentCode||line.C!==row.name||line.D!==row.type||line.E!==statusNames[row.status]||line.L!==row.submitted)throw new AppError('Không sửa thông tin gốc trong Excel.',400);
  const action=!line.F||line.F==='Giữ nguyên'?null:Object.keys(actionNames).find(a=>actionNames[a]===line.F);
  if(line.F&&line.F!=='Giữ nguyên'&&(!action||!row.actions.includes(action)))throw new AppError('Thao tác không đúng giai đoạn hồ sơ.',409);
  const note=String(line.G??'').trim();if(note.length>2000||/[\u0000-\u0008]/.test(note))throw new AppError('Ghi chú không hợp lệ.',400);
  if(['rejected','needs_changes'].includes(action)&&!note)throw new AppError('Phải ghi lý do từ chối / yêu cầu bổ sung.',400);
  const verificationMethod=methods[line.K];if(action==='verified'&&!verificationMethod)throw new AppError('Chọn cách xác minh chứng chỉ.',400);
  return {line:line.line,id:row.id,number:row.id,from:statusNames[row.status],to:line.F,action,note,verificationMethod,version:row.version};
 }
 return {
  async export(actor,ids){requireAccess(actor,'export');if(!Array.isArray(ids)||!ids.length||ids.length>500||new Set(ids).size!==ids.length)throw new AppError('Chọn từ 1 đến 500 hồ sơ khác nhau.',400);
   const rows=[],actions=[];for(const id of ids){const row=normalize(await service.get(actor,id));rows.push([row.id,row.studentCode,row.name,row.type,statusNames[row.status],'Giữ nguyên','',row.version,signature(actor,row),module,'Đối chiếu minh chứng',row.submitted]);actions.push(row.actions.map(a=>actionNames[a]));}
   return makeGridWorkbook(['Mã hồ sơ','MSSV','Họ tên','Loại hồ sơ','Trạng thái hiện tại','Thao tác','Ghi chú / lý do','Phiên bản','Mã xác thực','Chức năng','Cách xác minh','Ngày lập / gửi'],rows,{actions});
  },
  async preview(actor,bytes){requireAccess(actor,'import');for(const[id,b]of batches)if(b.expires<clock())batches.delete(id);if(batches.size>=100)throw new AppError('Quá nhiều bản xem trước. Thử lại sau.',429);
   const rows=readWorkbook(bytes),seen=new Set(),results=[];for(const line of rows){try{if(seen.has(line.A))throw new AppError('Hồ sơ bị trùng dòng.',400);seen.add(line.A);results.push(await plan(actor,line));}catch(error){if(!(error instanceof AppError))throw error;results.push({line:line.line,number:line.A,error:error.message});}}
   const errors=results.filter(r=>r.error).length,changes=results.filter(r=>r.action).length,id=randomUUID();if(!errors)batches.set(id,{actor:actor.reference,rows,expires:clock()+900000});return {batchId:errors?null:id,errors,changes,rows:results.map(({note,verificationMethod,version,...r})=>r)};
  },
  async commit(actor,id,revalidate=async()=>actor){requireAccess(actor,'import');const b=batches.get(id);if(!b||b.actor!==actor.reference||b.expires<clock())throw new AppError('Bản xem trước hết hạn hoặc thuộc tài khoản khác.',409);if(b.result)return b.result;if(b.busy)throw new AppError('Đang lưu file này.',409);b.busy=true;
   try{const result=await atomic(async()=>{const commands=[];const current=await revalidate();requireAccess(current,'import');for(const line of b.rows){const p=await plan(current,line);if(p.action)commands.push(p);}for(const p of commands){if(module==='academic-leave'){if(p.action==='receive_paper')await service.receivePaper(current,Number(p.id),p.version);else await service.review(current,Number(p.id),p.version,{decision:p.action,note:p.note||null});}else await service.review(current,p.id,p.version,{decision:p.action,reason:p.note||null,verificationMethod:p.verificationMethod??null});}return {updated:commands.length};});b.result=result;return result;}finally{b.busy=false;}
  },
 };
}
