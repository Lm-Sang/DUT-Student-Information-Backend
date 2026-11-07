import {inflateRawSync} from 'node:zlib';
import PizZip from 'pizzip';
import {DOMParser,XMLSerializer} from '@xmldom/xmldom';
import {AppError} from '../../shared/errors/app-error.js';
export const NS='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
export function xml(text) {
  if(!text||text.length>20000000||/<!DOCTYPE|<!ENTITY/i.test(text)) throw new AppError('XML trong file không hợp lệ.',400);
  const errors=[];
  const doc=new DOMParser({onError:(level,message)=>{if(level!=='warning')errors.push(message);}}).parseFromString(text,'application/xml');
  if(errors.length||!doc.documentElement) throw new AppError('Không đọc được cấu trúc Excel.',400);
  return doc;
}
export function zipped(bytes) {
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
export const nodes=(doc,name)=>Array.from(doc.getElementsByTagNameNS(NS,name));
export const serialize=doc=>new XMLSerializer().serializeToString(doc);
export function cell(doc,col,row,value,style) {
  const c=doc.createElementNS(NS,'c');c.setAttribute('r',col+row);if(style)c.setAttribute('s',style);
  if(typeof value==='number'){const v=doc.createElementNS(NS,'v');v.textContent=String(value);c.appendChild(v);}
  else{c.setAttribute('t','inlineStr');const s=doc.createElementNS(NS,'is'),t=doc.createElementNS(NS,'t');t.textContent=String(value??'');s.appendChild(t);c.appendChild(s);}return c;
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
