import {legacyFunctions} from '../domain/rbac.js';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createConfirmationFilesService } from '../services/confirmation-files.service.js';
import { renderConfirmationPdf } from '../services/confirmation-pdf.renderer.js';
import { canPrintConfirmation, actionsFor } from '../domain/request-rules.js';
import { parsePrintCommand } from '../dto/requests.dto.js';

const actor={id:'cv',role:'STAFF',department:'CTSV',permissions:[...legacyFunctions],workPermissions:['DonSV01','DonSV03','DonSV04','DonSV05','DonSV06','DonSV07','CONFIRMATION:01']};
const row={Id:'test',Number:123,TypeCode:'CONFIRMATION',Department:'CTSV',AssignedStaffId:'cv',AssignedStaffName:'Chuyên viên thử',Status:'RECEIVED',Version:2,
  StudentId:'sv',StudentName:'Nguyễn Minh Anh',StudentNumber:'DEMO0001',CreatedAt:'2026-10-25T06:00:00Z',
  Payload:{documentCode:'01',quantity:1,feeMode:'PAID',additionalInfo:'Đề nghị xác nhận để thử quy trình.'},CatalogSnapshot:{name:'Xác nhận sinh viên',unitFee:0,totalFee:0}};
const input={version:2,idempotencyKey:'print-test'};

test('only assigned specialists print accepted confirmations; completing processing requires a print export first',()=>{
  assert(canPrintConfirmation(actor,row));
  for(const patch of [{Status:'SUBMITTED'},{Status:'CANCELLED'},{AssignedStaffId:'other'},{Payload:{documentCode:'99'}},{TypeCode:'DonSV01'}])assert(!canPrintConfirmation(actor,{...row,...patch}));
  assert(!canPrintConfirmation({id:'sv',role:'STUDENT'},row));
  const request={typeCode:'CONFIRMATION',payload:{documentCode:'01'},studentId:'sv',department:'CTSV',assignedStaffId:'cv',status:'RECEIVED'};
  assert(!actionsFor(actor,request).includes('result'));
  assert(actionsFor(actor,{...request,printedAt:'server-time'}).includes('result'));
  for(const patch of [{printedAt:'client-time'},{processedAt:'client-time'},{pickupAt:'client-time'},{payload:{}}])assert.throws(()=>parsePrintCommand({...input,...patch}));
  assert.deepEqual(parsePrintCommand(input),input);
});

test('printing records one export after successful rendering and idempotent retries do not add history',async()=>{
  let current={...row},writes=0,recorded=false;
  const repo={get:async()=>current,profile:async()=>({name:'Nguyễn Minh Anh'}),receipt:async()=>recorded?'test':null,
    recordPrint:async data=>{writes++;recorded=true;current={...current,Version:3,PrintedAt:data.printedAt};}};
  const service=createConfirmationFilesService(repo,{renderer:async()=>({bytes:Buffer.from('%PDF-test')}),now:()=>new Date('2026-10-25T06:30:00Z')});
  const file=await service.print(actor,'test',input);assert.equal(file.filename,'XacNhan-01-test.pdf');assert.equal(writes,1);
  assert.equal(current.Status,'RECEIVED');assert.equal(current.PrintedAt,'2026-10-25T06:30:00.000Z');
  await service.print(actor,'test',input);assert.equal(writes,1);
});

test('failed render, stale request and cancellation during rendering never record an export',async()=>{
  let writes=0,current={...row};
  const repo={get:async()=>current,profile:async()=>null,receipt:async()=>null,recordPrint:async()=>{writes++;}};
  const failed=createConfirmationFilesService(repo,{renderer:async()=>{throw new Error('RENDER_FAILED');}});
  await assert.rejects(()=>failed.print(actor,'test',input),/RENDER_FAILED/);
  await assert.rejects(()=>failed.print(actor,'test',{...input,version:1}),e=>e.statusCode===409);
  const cancelled=createConfirmationFilesService(repo,{renderer:async()=>{current={...row,Status:'CANCELLED',Version:3};return{bytes:Buffer.from('%PDF-test')};}});
  await assert.rejects(()=>cancelled.print(actor,'test',input),e=>e.statusCode===403);assert.equal(writes,0);
});

test('specialists cannot print paper petitions, including requests printed under the old workflow',async()=>{
 for(const code of ['DonSV01','DonSV03','DonSV04','DonSV05','DonSV06','DonSV07'])for(const printedAt of [null,'2026-10-25T06:30:00Z']){
  let writes=0,renders=0;
  const repo={get:async()=>({...row,TypeCode:code,PrintedAt:printedAt}),recordPrint:async()=>{writes++;}};
  const service=createConfirmationFilesService(repo,{renderer:async()=>{renders++;return{bytes:Buffer.from('%PDF-test')};}});
  await assert.rejects(()=>service.print(actor,'test',input),e=>e.statusCode===403);assert.equal(writes,0);assert.equal(renders,0);
 }
});

test('placeholder PDF has Vietnamese data, blank signature areas and bounded text on every page',async()=>{
  for(const additionalInfo of [row.Payload.additionalInfo,'Thông tin bổ sung tiếng Việt. '.repeat(65)]){
    const {bytes}=await renderConfirmationPdf({row:{...row,Payload:{...row.Payload,additionalInfo}},profile:{name:'Nguyễn Minh Anh',className:'23DEMO1',dateOfBirth:'15/02/2004'},printedAt:'2026-10-25T06:30:00Z'});
    const task=getDocument({data:new Uint8Array(bytes),useSystemFonts:true});
    try{const pdf=await task.promise,text=[];
      for(let n=1;n<=pdf.numPages;n++){
        const page=await pdf.getPage(n),items=(await page.getTextContent()).items;
        text.push(items.map(i=>i.str).join(' '));
        assert(items.every(i=>i.transform[4]>=0&&i.transform[4]+i.width<=596),'text stays inside page');
        assert(items.map(i=>i.str).join(' ').includes('MẪU TƯỢNG TRƯNG'));
        assert(items.map(i=>i.str).join(' ').includes('DN-000123'));
      }
      const all=text.join(' ');assert(all.includes('Nguyễn Minh Anh'));assert(all.includes('DEMO0001'));
      assert(all.includes('NGƯỜI KÝ XÁC NHẬN'));assert(all.includes('Xác nhận sinh viên'));
    }finally{await task.destroy();}
  }
});
