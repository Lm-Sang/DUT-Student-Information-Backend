import {AppError} from '../../../shared/errors/app-error.js';
import {reasons,semester} from '../domain/academic-leave.rules.js';
const fail=(message,field)=>{throw new AppError(message,400,{field});};
export function object(value,keys) {
  if(!value||typeof value!=='object'||Array.isArray(value))fail('Dữ liệu phải là object.');
  for(const key of Object.keys(value))if(!keys.includes(key))fail('Trường không được phép: '+key,key);
}
export function id(value) {
  if(!/^[1-9]\d{0,9}$/.test(String(value))||Number(value)>2147483647)fail('Mã đơn không hợp lệ.','id');
  return Number(value);
}
export function version(value) {
  const match=/^"?([0-9a-f]{16})"?$/i.exec(value??'');
  if(!match)throw new AppError('Cần If-Match từ phiên bản đơn vừa tải.',428);
  return match[1].toUpperCase();
}
export function printQuery(value) {
  object(value,['MADN']);
  if(typeof value.MADN!=='string'||!/^NH\d{9}[1-9]\d{0,9}$/.test(value.MADN)||Number(value.MADN.slice(11))>2147483647)
    fail('Mã đề nghị phải có dạng NH + MSSV + số thứ tự.','MADN');
  return value.MADN;
}
export function draft(value) {
  object(value,['kind','parentApplicationId','reasonCode','startSemesterCode','semesterCount','content']);
  if(!['leave','extension'].includes(value.kind))fail('Loại đơn không hợp lệ.','kind');
  if(!reasons.some(item=>item.code===value.reasonCode))fail('Chọn một trong bốn lý do.','reasonCode');
  if(typeof value.startSemesterCode!=='string')fail('Chọn học kỳ bắt đầu.','startSemesterCode');
  semester(value.startSemesterCode);
  if(!Number.isInteger(value.semesterCount)||value.semesterCount<1||value.semesterCount>4)fail('Số kỳ mỗi lần phải từ 1 đến 4.','semesterCount');
  const parentApplicationId=value.parentApplicationId==null?null:id(value.parentApplicationId);
  if((value.kind==='extension')!==(parentApplicationId!==null))fail('Chọn đơn trước cho đơn gia hạn.','parentApplicationId');
  if(value.content!==undefined&&(typeof value.content!=='string'||value.content.trim().length>2000))fail('Nội dung tối đa 2000 ký tự.','content');
  return {...value,parentApplicationId,content:value.content?.trim()??''};
}
export function review(value) {
  object(value,['decision','note']);
  if(!['approved','rejected','needs_changes'].includes(value.decision))fail('Kết quả xét duyệt không hợp lệ.','decision');
  if(value.note!==undefined&&(typeof value.note!=='string'||value.note.trim().length>1000))fail('Ghi chú tối đa 1000 ký tự.','note');
  const note=value.note?.trim()??'';
  if(value.decision!=='approved'&&!note)fail('Cần ghi rõ lý do không duyệt hoặc yêu cầu bổ sung.','note');
  return{decision:value.decision,note};
}
export function list(value) {
  object(value,['page','status']);
  const page=value.page===undefined?1:Number(value.page);
  if(!Number.isInteger(page)||page<1||page>10000)fail('Trang không hợp lệ.','page');
  if(value.status!==undefined&&!['draft','submitted','needs_changes','approved','rejected','paper_received','cancelled'].includes(value.status))fail('Trạng thái không hợp lệ.','status');
  return{page,status:value.status??null};
}
