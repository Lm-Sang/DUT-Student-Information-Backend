import assert from 'node:assert/strict';
import {test} from 'node:test';
import {legacyFunctions} from '../domain/rbac.js';
import {actionsFor,transition,paperRequestCodes,canPrintRequest} from '../domain/request-rules.js';
import {paperTemplates,renderPaperPdf} from '../services/paper-pdf.renderer.js';
import {getDocument} from 'pdfjs-dist/legacy/build/pdf.mjs';

test('every petition can be completed after reception without print permission or a print event',()=>{
 const actor={id:'cv',role:'STAFF',permissions:legacyFunctions.filter(p=>p!=='requests.print'),workPermissions:paperRequestCodes};
 for(const typeCode of paperRequestCodes){
  const request={typeCode,studentId:'sv',assignedStaffId:'cv',status:'RECEIVED',printedAt:null};
  assert.deepEqual(actionsFor(actor,request),['complete','cancel']);assert.equal(transition(actor,request,{action:'complete'}).status,'COMPLETED');
  assert(!canPrintRequest({...actor,permissions:legacyFunctions},{TypeCode:typeCode,AssignedStaffId:'cv',Status:'RECEIVED'}));
  assert.deepEqual(actionsFor({...actor,id:'other'},request),[]);
  assert.deepEqual(actionsFor(actor,{...request,status:'COMPLETED'}),[]);
 }
});

test('birth place uses the remaining right column and keeps the full province on one line',async()=>{
 for(const code of ['DonSV03','DonSV04']){
  const template=paperTemplates.find(t=>t.code===code),place='Tỉnh Thừa Thiên Huế';
  const result=await renderPaperPdf({template,snapshot:{createdAt:'2026-10-26T00:00:00Z',profile:{name:'Sinh viên kiểm thử',birthPlace:place,gender:'Nam',ethnicity:'Kinh'},values:{expectedTerm:'Học kỳ 1 năm học 2026-2027',targetTerm:'Học kỳ 2 năm học 2026-2027',reason:'Lý do kiểm thử'}}});
  const task=getDocument({data:new Uint8Array(result.bytes),useSystemFonts:true});
  try{const doc=await task.promise,page=await doc.getPage(1),items=(await page.getTextContent()).items,field=items.find(i=>i.str===place);assert(field,'Full province should be one line');assert(field.height>=12);assert(field.transform[4]+field.width<=553);}finally{await task.destroy();}
 }
});
