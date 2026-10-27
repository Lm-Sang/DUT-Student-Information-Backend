import { readFileSync } from 'node:fs';
import { inflateRawSync } from 'node:zlib';
import PizZip from 'pizzip';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { AppError } from '../../../shared/errors/app-error.js';

const NS='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
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
function xml(text) {
  if(!text||text.length>20000000||/<!DOCTYPE|<!ENTITY/i.test(text)) throw new AppError('XML trong file không hợp lệ.',400);
  const errors=[];
  const doc=new DOMParser({onError:(level,message)=>{if(level!=='warning')errors.push(message);}}).parseFromString(text,'application/xml');
  if(errors.length||!doc.documentElement) throw new AppError('Không đọc được cấu trúc Excel.',400);
  return doc;
}
function zipped(bytes) {
  if(!Buffer.isBuffer(bytes)||bytes.length>5*1024*1024||bytes.length<22)throw new AppError('Chỉ nhận XLSX tối đa 5 MB.',400);
  // Inspect ZIP central-directory sizes before decompression.
  let eocd=-1; for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(bytes.readUInt32LE(i)===0x06054b50){eocd=i;break;}
  if(eocd<0||bytes.readUInt16LE(eocd+4)||bytes.readUInt16LE(eocd+6))throw new AppError('ZIP không hợp lệ.',400);
  const count=bytes.readUInt16LE(eocd+10);let at=bytes.readUInt32LE(eocd+16),total=0;
  if(count>1000)throw new AppError('File có quá nhiều thành phần.',400);
  for(let i=0;i<count;i++){
    if(at+46>eocd||bytes.readUInt32LE(at)!==0x02014b50)throw new AppError('ZIP không hợp lệ.',400);
    const size=bytes.readUInt32LE(at+24),compressed=bytes.readUInt32LE(at+20),offset=bytes.readUInt32LE(at+42),method=bytes.readUInt16LE(at+10);
    total+=size;if(total>20*1024*1024||bytes.readUInt16LE(at+8)&1||![0,8].includes(method))throw new AppError('File giải nén quá lớn hoặc không được hỗ trợ.',400);
    if(offset+30>bytes.length||bytes.readUInt32LE(offset)!==0x04034b50)throw new AppError('ZIP không hợp lệ.',400);
    const start=offset+30+bytes.readUInt16LE(offset+26)+bytes.readUInt16LE(offset+28);
    if(start+compressed>bytes.length)throw new AppError('ZIP không hợp lệ.',400);
    try{const data=method===8?inflateRawSync(bytes.subarray(start,start+compressed),{maxOutputLength:Math.max(1,size)}):bytes.subarray(start,start+compressed);if(data.length!==size)throw new Error();}catch{throw new AppError('Kích thước ZIP không hợp lệ.',400);}
    at+=46+bytes.readUInt16LE(at+28)+bytes.readUInt16LE(at+30)+bytes.readUInt16LE(at+32);
  }
  let zip;try{zip=new PizZip(bytes);}catch{throw new AppError('Không đọc được XLSX.',400);}
  if(Object.keys(zip.files).some(n=>/vbaProject|externalLinks|embeddings|connections\.xml/i.test(n)))throw new AppError('Không nhận file có macro hoặc liên kết ngoài.',400);
  return zip;
}
const nodes=(doc,name)=>Array.from(doc.getElementsByTagNameNS(NS,name));
const serialize=doc=>new XMLSerializer().serializeToString(doc);
function cell(doc,col,row,value,style) {
  const c=doc.createElementNS(NS,'c');c.setAttribute('r',col+row);if(style)c.setAttribute('s',style);
  if(typeof value==='number'){const v=doc.createElementNS(NS,'v');v.textContent=String(value);c.appendChild(v);}
  else{c.setAttribute('t','inlineStr');const s=doc.createElementNS(NS,'is'),t=doc.createElementNS(NS,'t');t.textContent=String(value??'');s.appendChild(t);c.appendChild(s);}return c;
}
export function makeWorkbook(rows,{typeCodes=[]}={}) {
  const zip=new PizZip(readFileSync(new URL('../../../../assets/request-workbooks/processing.xlsx',import.meta.url)));
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
export function readWorkbook(bytes) {
  const zip=zipped(bytes),book=xml(zip.file('xl/workbook.xml')?.asText());
  if(!nodes(book,'sheet').some(s=>s.getAttribute('name')==='Xử lý hồ sơ'&&s.getAttribute('sheetId')==='1'))throw new AppError('Dùng file được xuất từ hệ thống.',400);
  const strings=zip.file('xl/sharedStrings.xml')?nodes(xml(zip.file('xl/sharedStrings.xml').asText()),'si').map(si=>nodes(si,'t').map(t=>t.textContent).join('')):[];
  const doc=xml(zip.file('xl/worksheets/sheet1.xml')?.asText()),result=[];
  for(const row of nodes(doc,'row')){
    const n=+row.getAttribute('r');if(n===1)continue;if(n>501||result.length>=500)throw new AppError('Chỉ nhận tối đa 500 dòng.',400);
    const values={};for(const c of nodes(row,'c')){
      const address=c.getAttribute('r');if(!/^[A-L]\d+$/.test(address))continue;
      if(nodes(c,'f').length)throw new AppError(`Dòng ${n}: không nhận công thức.`,400);
      const type=c.getAttribute('t'),value=nodes(c,'v')[0]?.textContent??'';
      values[address.replace(/\d/g,'')]=type==='s'?(strings[+value]??''):type==='inlineStr'?nodes(c,'t').map(t=>t.textContent).join(''):type==='str'?value:value===''?'':Number(value);
    }
    if(Object.values(values).some(v=>v!==''))result.push({line:n,...values});
  }
  if(!result.length)throw new AppError('File không có hồ sơ.',400);return result;
}
