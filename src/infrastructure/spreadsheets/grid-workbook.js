import PizZip from 'pizzip';
const esc=s=>String(s??'').replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));
export function makeGridWorkbook(headers,rows,{actions=[]}={}){
 const zip=new PizZip(),ns='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
 const cell=(v,c,r)=>`<c r="${String.fromCharCode(65+c)}${r}" t="inlineStr"><is><t xml:space="preserve">${esc(v)}</t></is></c>`;
 const data=[headers,...rows].map((row,i)=>`<row r="${i+1}">${row.map((v,c)=>cell(v,c,i+1)).join('')}</row>`).join('');
 const validations=rows.map((_,i)=>`<dataValidation type="list" allowBlank="1" showErrorMessage="1" sqref="F${i+2}"><formula1>${esc('"'+['Giữ nguyên',...(actions[i]??[])].join(',')+'"')}</formula1></dataValidation>`).join('');
 zip.file('[Content_Types].xml','<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>');
 zip.file('_rels/.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
 zip.file('xl/workbook.xml',`<workbook xmlns="${ns}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Xử lý hồ sơ" sheetId="1" r:id="rId1"/></sheets></workbook>`);
 zip.file('xl/_rels/workbook.xml.rels','<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>');
 zip.file('xl/worksheets/sheet1.xml',`<worksheet xmlns="${ns}"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="1" width="38" customWidth="1"/><col min="2" max="6" width="28" customWidth="1"/><col min="7" max="7" width="50" customWidth="1"/><col min="8" max="10" hidden="1"/><col min="11" max="12" width="25" customWidth="1"/></cols><sheetData>${data}</sheetData><autoFilter ref="A1:L${Math.max(1,rows.length+1)}"/><dataValidations count="${rows.length}">${validations}</dataValidations></worksheet>`);
 return zip.generate({type:'nodebuffer',compression:'DEFLATE'});
}
