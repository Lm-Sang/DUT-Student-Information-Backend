import {legacyFunctions} from '../domain/rbac.js';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import PizZip from 'pizzip';
import {makeWorkbook,readWorkbook,parsePrintDate,excelDate} from '../services/request-workbook.js';
import {createWorkbookWorkflowService} from '../services/workbook-workflow.service.js';
import {validatePermissionChange,canWork} from '../domain/work-permissions.js';
import {createSchoolStudentService} from '../services/school-student.service.js';

const actor={id:'cv',role:'STAFF',permissions:[...legacyFunctions],workPermissions:['CONFIRMATION:01']};
const record={id:'00000000-0000-0000-0000-000000000001',number:'DN-000001',typeCode:'CONFIRMATION',typeName:'Xác nhận',studentNumber:'000001',studentName:'QA',version:1,status:'SUBMITTED',payload:{documentCode:'01'},createdAt:'2026-10-26T00:00:00Z'};
function fixtures(){let r=structuredClone(record),writes=0;const requests={list:async()=>[r],detail:async()=>r},repo={workbookSecret:async()=> 'unit-test-only-secret',batchUpdate:async()=>{writes++;}};return{service:createWorkbookWorkflowService(repo,requests,{now:()=>new Date('2026-10-26T12:00:00Z')}),set:v=>r={...r,...v},writes:()=>writes};}
function edit(bytes,change){const rows=readWorkbook(bytes);return makeWorkbook(rows.map(row=>{const values='ABCDEFGHIJKL'.split('').map(k=>row[k]);change(values);return values;}));}
test('Excel preserves text student IDs, dates and dropdown validation',()=>{const b=makeWorkbook([['DN-1','Xác nhận','000123','QA','Chờ tiếp nhận','Chờ tiếp nhận','','','','id',1,'signature']]);assert.equal(readWorkbook(b)[0].C,'000123');assert.match(new PizZip(b).file('xl/worksheets/sheet1.xml').asText(),/dataValidation/);const time='2026-12-31T11:45:00.000Z';assert.equal(parsePrintDate(excelDate(time)),time);assert.equal(parsePrintDate('31/12/2026 18:45'),time);assert.throws(()=>parsePrintDate('31/02/2026 12:00'));});
test('preview does not write and commit rechecks versions; repeated commit is idempotent',async()=>{const f=fixtures(),b=await f.service.export(actor,{ids:[record.id]}),input=edit(b,v=>v[5]='Đã tiếp nhận'),p=await f.service.preview(actor,input);assert.equal(p.errors,0);assert.equal(p.changes,1);assert.equal(f.writes(),0);await f.service.commit(actor,{batchId:p.batchId});await f.service.commit(actor,{batchId:p.batchId});assert.equal(f.writes(),1);});
test('Excel rejects a stale preview, another specialist signature, reassigned owner and revoked rights',async()=>{
 const f=fixtures(),b=await f.service.export(actor,{ids:[record.id]}),input=edit(b,v=>v[5]='Đã tiếp nhận');
 const p=await f.service.preview(actor,input);f.set({version:2});await assert.rejects(()=>f.service.commit(actor,{batchId:p.batchId}));assert.equal(f.writes(),0);
 f.set({version:1});assert.equal((await f.service.preview({...actor,id:'other'},input)).errors,1);
 f.set({assignedStaffId:'other'});assert.equal((await f.service.preview(actor,input)).errors,1);
 f.set({assignedStaffId:null});assert.equal((await f.service.preview({...actor,permissions:[...legacyFunctions],workPermissions:[]},input)).errors,1);
});
test('cancelled requests cannot be confirmed and skipped steps are rejected',async()=>{const f=fixtures();let b=await f.service.export(actor,{ids:[record.id]});assert.equal((await f.service.preview(actor,edit(b,v=>v[5]='Đã xử lý'))).errors,1);f.set({status:'CANCELLED'});b=await f.service.export(actor,{ids:[record.id]});assert.equal((await f.service.preview(actor,edit(b,v=>v[5]='Đã xử lý'))).errors,1);});
test('Excel requires cancellation feedback and valid actual printing time',async()=>{const f=fixtures();let b=await f.service.export(actor,{ids:[record.id]});assert.equal((await f.service.preview(actor,edit(b,v=>v[5]='Đã hủy'))).errors,1);assert.equal((await f.service.preview(actor,edit(b,v=>{v[5]='Đã hủy';v[8]='Không đủ điều kiện';}))).errors,0);f.set({status:'RECEIVED',assignedStaffId:'cv',receivedAt:'2026-10-26T01:00:00Z'});b=await f.service.export(actor,{ids:[record.id]});assert.equal((await f.service.preview(actor,edit(b,v=>{v[5]='Đã in';v[6]='27/10/2026 10:00';}))).errors,1);assert.equal((await f.service.preview(actor,edit(b,v=>{v[5]='Đã in';v[6]='26/10/2026 10:00';}))).errors,0);});
test('Excel rejects formulas and macro packages without evaluating them',()=>{let zip=new PizZip(makeWorkbook([['x','','','','','','','','','id',1,'x']]));zip.file('xl/worksheets/sheet1.xml',zip.file('xl/worksheets/sheet1.xml').asText().replace(/<x:c r="F2"[^>]*>.*?<\/x:c>/,'<x:c r="F2"><x:f>1+1</x:f><x:v>2</x:v></x:c>'));assert.throws(()=>readWorkbook(zip.generate({type:'nodebuffer'})));zip=new PizZip(makeWorkbook([['x']]));zip.file('xl/vbaProject.bin','test');assert.throws(()=>readWorkbook(zip.generate({type:'nodebuffer'})));});
test('petition Excel completes directly after reception and rejects print dates or the printed status',async()=>{
 const f=fixtures(),staff={...actor,permissions:actor.permissions.filter(p=>p!=='requests.print'),workPermissions:['DonSV01']};
 f.set({typeCode:'DonSV01',typeName:'Cấp lại thẻ',status:'RECEIVED',assignedStaffId:'cv',printedAt:null,payload:{reasonCode:'LOST_OR_DAMAGED'}});
 const file=await f.service.export(staff,{ids:[record.id]}),xml=new PizZip(file).file('xl/worksheets/sheet1.xml').asText();
 assert(!xml.match(/<[^>]*formula1[^>]*>[^<]*Đã in/));assert(new PizZip(file).file('xl/worksheets/sheet2.xml').asText().includes('Đơn đề nghị không có bước in'));
 const result=await f.service.preview(staff,edit(file,v=>v[5]='Đã xử lý'));assert.equal(result.errors,0);assert.equal(result.rows[0].action,'complete');
 await f.service.commit(staff,{batchId:result.batchId});assert.equal(f.writes(),1);
 assert.equal((await f.service.preview(staff,edit(file,v=>v[5]='Đã in'))).errors,1);
 assert.equal((await f.service.preview(staff,edit(file,v=>{v[5]='Đã xử lý';v[6]='26/10/2026 10:00';}))).errors,1);
 f.set({printedAt:'2026-10-26T01:00:00Z'});const legacy=await f.service.export(staff,{ids:[record.id]});assert.equal(readWorkbook(legacy)[0].E,'Đã tiếp nhận');assert.equal(readWorkbook(legacy)[0].G,'');
});
test('mixed Excel exports offer the printed status only on confirmation rows',()=>{
 const rows=[['1'],['2']],zip=new PizZip(makeWorkbook(rows,{typeCodes:['DonSV01','CONFIRMATION']})),xml=zip.file('xl/worksheets/sheet1.xml').asText();
 const validations=[...xml.matchAll(/<(?:\w+:)?dataValidation\s[^>]*>[\s\S]*?<\/(?:\w+:)?dataValidation>/g)].map(m=>m[0]);
 assert.equal(validations.length,2);assert(!validations.find(v=>v.includes('sqref="F2"')).includes('Đã in'));assert(validations.find(v=>v.includes('sqref="F3"')).includes('Đã in'));
});
test('permission keys are explicit and admin checkbox changes validate all keys',()=>{assert(canWork(actor,record));assert(!canWork({...actor,permissions:[...legacyFunctions],workPermissions:[]},record));assert.throws(()=>validatePermissionChange({version:1,keys:['ADMIN']},[{key:'DonSV01'}]));assert.throws(()=>validatePermissionChange({version:1,keys:['DonSV01','DonSV01']},[{key:'DonSV01'}]));assert.deepEqual(validatePermissionChange({version:1,keys:[]},[]),{version:1,keys:[]});});
test('school adapter selects the student number from verified school identity; duplicate or missing profiles fail closed',async()=>{
 let count=1,synced=0;const adapter=createSchoolStudentService({syncSchoolStudent:async()=>{synced++;return 'sso:test';}},{readProfile:async number=>{assert.equal(number,'000000001');return Array.from({length:count},()=>({MaHS:'test',SoTheSV:'000000001'}));}});
 await assert.rejects(()=>adapter.signIn({studentId:'forged'}));assert.equal(synced,0);const claims={identity:{microsoftId:'000000001@sv1.dut.udn.vn'}};assert.equal(await adapter.signIn(claims),'sso:test');count=2;await assert.rejects(()=>adapter.signIn(claims));count=0;await assert.rejects(()=>adapter.signIn(claims));assert.equal(synced,1);
});
