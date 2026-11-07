import { readFileSync } from 'node:fs';
import PizZip from 'pizzip';
import { AppError } from '../../../../shared/errors/app-error.js';

import {NS,xml,nodes,serialize,cell} from '../../../../infrastructure/spreadsheets/xlsx.js';
export {readWorkbook} from '../../../../infrastructure/spreadsheets/xlsx.js';
export const statusLabels = ['Chờ tiếp nhận','Đã tiếp nhận','Đã in','Đã xử lý','Đã hủy'];
export function workbookStatus(r) { return r.status==='CANCELLED'?statusLabels[4]:r.status==='COMPLETED'||r.typeCode==='CONFIRMATION'&&r.status==='READY'?statusLabels[3]:r.status==='SUBMITTED'?statusLabels[0]:r.typeCode==='CONFIRMATION'&&r.printedAt?statusLabels[2]:statusLabels[1]; }
export const excelDate = date => date ? new Date(date).getTime()/86400000+25569+7/24 : '';
export function parsePrintDate(value) {
  let ms;
  if(typeof value==='number') ms=(value-25569-7/24)*86400000;
  else {
    const m=/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})(?::(\d{2}))?$/.exec(String(value));
    if(!m) throw new AppError('Thời gian in phải có dạng dd/mm/yyyy hh:mm.',400);
    const [,d,mo,y,h,mi,se='0']=m; ms=Date.UTC(+y,+mo-1,+d,+h-7,+mi,+se);
    const check=new Date(ms+7*3600000);
    if(check.getUTCFullYear()!==+y||check.getUTCMonth()!==+mo-1||check.getUTCDate()!==+d||check.getUTCHours()!==+h||check.getUTCMinutes()!==+mi||check.getUTCSeconds()!==+se) throw new AppError('Ngày giờ in không hợp lệ.',400);
  }
  if(!Number.isFinite(ms)||ms<0) throw new AppError('Ngày giờ in không hợp lệ.',400);
  return new Date(Math.round(ms)).toISOString();
}
export function makeWorkbook(rows,{typeCodes=[]}={}) {
  const zip=new PizZip(readFileSync(new URL('../../../../../assets/request-workbooks/processing.xlsx',import.meta.url)));
  const doc=xml(zip.file('xl/worksheets/sheet1.xml').asText()),data=nodes(doc,'sheetData')[0],sample=nodes(data,'row')[1];
  const styles={};for(const c of nodes(sample,'c'))styles[c.getAttribute('r').replace(/\d/g,'')]=c.getAttribute('s');
  while(data.childNodes.length>1)data.removeChild(data.lastChild);
  for(const [i,values]of rows.entries()){
    const n=i+2,row=doc.createElementNS(NS,'row');row.setAttribute('r',String(n));row.setAttribute('ht','40');row.setAttribute('customHeight','1');
    values.forEach((v,j)=>row.appendChild(cell(doc,String.fromCharCode(65+j),n,v,styles[String.fromCharCode(65+j)])));data.appendChild(row);
  }
  nodes(doc,'dimension')[0]?.setAttribute('ref',`A1:L${Math.max(2,rows.length+1)}`);
  for(const n of nodes(doc,'dataValidations'))n.parentNode.removeChild(n);
  const validation=doc.createElementNS(NS,'dataValidations'),groups=new Map();
  for(let i=0;i<Math.max(1,rows.length);i++){
    const labels=typeCodes[i]&&typeCodes[i]!=='CONFIRMATION'?statusLabels.filter(s=>s!=='Đã in'):statusLabels,key=labels.join(',');
    if(!groups.has(key))groups.set(key,[]);groups.get(key).push('F'+(i+2));
  }
  validation.setAttribute('count',String(groups.size));
  for(const [labels,refs] of groups){
    const dv=doc.createElementNS(NS,'dataValidation');for(const[k,v]of Object.entries({type:'list',allowBlank:'0',showErrorMessage:'1',errorTitle:'Chọn trạng thái',error:'Chỉ chọn trong danh sách.',sqref:refs.join(' ')}))dv.setAttribute(k,v);
    const f=doc.createElementNS(NS,'formula1');f.textContent='"'+labels+'"';dv.appendChild(f);validation.appendChild(dv);
  }
  const anchor=Array.from(doc.documentElement.childNodes).find(n=>['pageMargins','pageSetup','headerFooter','drawing','extLst'].includes(n.localName));doc.documentElement.insertBefore(validation,anchor||null);
  for(const c of nodes(doc,'col'))if(+c.getAttribute('min')>=10)c.setAttribute('hidden','1');
  if(typeCodes.length&&!typeCodes.includes('CONFIRMATION'))for(const c of nodes(doc,'col'))if(+c.getAttribute('min')>=7&&+c.getAttribute('max')<=8)c.setAttribute('hidden','1');
  const guidePath='xl/worksheets/sheet2.xml';
  if(zip.file(guidePath)){
    const guide=xml(zip.file(guidePath).asText()),petitionOnly=typeCodes.length&&!typeCodes.includes('CONFIRMATION');
    const replacements=new Map([
      ['Chỉ sửa Status, In lúc và Ghi chú / lý do hủy. Thời gian theo giờ Việt Nam.',petitionOnly?'Chỉ sửa Status và Ghi chú / lý do hủy. Đơn đề nghị không có bước in của chuyên viên.':'Chỉ sửa Status và Ghi chú / lý do hủy. In lúc chỉ dùng cho văn bản xác nhận, theo giờ Việt Nam.'],
      ['In giấy',petitionOnly?'Đơn đề nghị':'In văn bản xác nhận'],
      ['Đã tiếp nhận → Đã in. Nhập thời gian in thực tế dd/mm/yyyy hh:mm.',petitionOnly?'Đã tiếp nhận → Đã xử lý. Không nhập ngày in.':'Chỉ văn bản xác nhận: Đã tiếp nhận → Đã in. Nhập thời gian in thực tế dd/mm/yyyy hh:mm.'],
      ['Đã in → Đã xử lý sau khi in và ký ngoài hệ thống.',petitionOnly?'Đã tiếp nhận → Đã xử lý khi hoàn tất công việc.':'Đơn đề nghị: Đã tiếp nhận → Đã xử lý. Văn bản xác nhận: Đã in → Đã xử lý sau khi in và ký.'],
      ['Văn bản xác nhận: lần in đầu + 3 ngày. In lại không đổi lịch nhận.',petitionOnly?'Đơn đề nghị không tạo lịch nhận giấy từ thời gian in.':'Văn bản xác nhận: lần in đầu + 3 ngày. In lại không đổi lịch nhận.'],
    ]);
    for(const text of [...nodes(guide,'t'),...nodes(guide,'v')])if(replacements.has(text.textContent))text.textContent=replacements.get(text.textContent);
    zip.file(guidePath,serialize(guide));
  }
  zip.file('xl/worksheets/sheet1.xml',serialize(doc));return zip.generate({type:'nodebuffer',compression:'DEFLATE'});
}
