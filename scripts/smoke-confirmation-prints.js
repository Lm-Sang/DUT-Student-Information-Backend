import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { cleanupRequests } from './lib/cleanup-requests.js';
import { queryLocalDatabase, disconnectLocalDatabase } from '../src/infrastructure/database/local-sql-server.js';
import { assertLocalDemoTarget } from '../src/infrastructure/database/local-write-guard.js';

const port=Number(process.env.DEMO_API_PORT||3003);
if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Invalid port');
const base=`http://127.0.0.1:${port}/api/demo/student-requests`,ids=[];let checks=0;
async function api(path,token,body,status=200){
  const response=await fetch(base+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});
  const data=await response.json();assert.equal(response.status,status,JSON.stringify(data));checks++;return data.data;
}
async function print(id,token,body,status=200){
  const response=await fetch(base+'/requests/'+id+'/print',{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});
  assert.equal(response.status,status);checks++;
  if(status!==200){await response.arrayBuffer();return;}
  assert.equal(response.headers.get('content-type'),'application/pdf');assert.equal(response.headers.get('cache-control'),'private, no-store');
  const bytes=Buffer.from(await response.arrayBuffer());assert.equal(bytes.subarray(0,5).toString(),'%PDF-');return bytes;
}
async function command(token,request,action,status=200){return api('/requests/'+request.id+'/actions',token,{action,version:request.version,idempotencyKey:randomUUID()},status);}
try{
  assertLocalDemoTarget();
  await mkdir('.data/research/confirmation-print-qa',{recursive:true});
  const [sv,other,ctsv,ctsvB,dt]=await Promise.all(['student-a','student-b','staff-ctsv','staff-ctsv-b','staff-dt'].map(async actorId=>(await api('/session',null,{actorId})).token));
  const catalog=await api('/catalogs',sv);
  for(const document of catalog.documents){
    let r=await api('/requests',sv,{typeCode:'CONFIRMATION',payload:{documentCode:document.code,quantity:1,feeMode:'PAID',additionalInfo:'Hồ sơ QA mẫu in xác nhận. Học kỳ 1, năm học 2026-2027.',serviceSpeed:'NORMAL'},idempotencyKey:randomUUID()},201);ids.push(r.id);
    const staff=r.department==='CTSV'?ctsv:dt,wrong=r.department==='CTSV'?dt:ctsv;
    assert.equal(r.confirmationFile.canPrint,false);
    await print(r.id,staff,{version:r.version,idempotencyKey:randomUUID()},403);
    r=await command(staff,r,'receive');assert.equal(r.confirmationFile.canPrint,true);
    await command(staff,r,'result',403);
    await print(r.id,sv,{version:r.version,idempotencyKey:randomUUID()},403);
    await print(r.id,wrong,{version:r.version,idempotencyKey:randomUUID()},403);
    if(r.department==='CTSV')await print(r.id,ctsvB,{version:r.version,idempotencyKey:randomUUID()},403);
    await print(r.id,staff,{version:r.version,idempotencyKey:randomUUID(),printedAt:'client'},400);
    const body={version:r.version,idempotencyKey:randomUUID()},bytes=await print(r.id,staff,body);
    await writeFile(`.data/research/confirmation-print-qa/XacNhan-${document.code}.pdf`,bytes);
    const task=getDocument({data:new Uint8Array(bytes),useSystemFonts:true});
    try{const pdf=await task.promise;const text=(await(await pdf.getPage(1)).getTextContent()).items.map(i=>i.str).join(' ');
      assert(text.includes('MẪU TƯỢNG TRƯNG'));assert(text.includes(document.name));assert(text.includes('DEMO0001'));assert(text.includes(r.number));
    }finally{await task.destroy();}
    let detail=await api('/requests/'+r.id,sv);assert(detail.printedAt);assert.equal(detail.status,'RECEIVED');assert.equal(detail.pickupAt,null);
    assert.equal(detail.events.filter(e=>e.type==='PRINT').length,1);
    const version=detail.version;await print(r.id,staff,body);
    detail=await api('/requests/'+r.id,sv);assert.equal(detail.version,version);assert.equal(detail.events.filter(e=>e.type==='PRINT').length,1);
    for(const legacy of ['start','requestInfo','external'])await command(staff,detail,legacy,403);
    detail=await command(staff,detail,'result');assert.equal(detail.status,'COMPLETED');assert.deepEqual(detail.actions,[]);assert.equal(detail.deliveredAt,null);assert(detail.completedAt);assert(detail.processedAt);
    assert.equal(new Date(detail.pickupAt)-new Date(detail.processedAt),2*86400000);
    const rows=(await queryLocalDatabase('SELECT NgayIn FROM svc_demo.DonDeNghi WHERE ID=?',[r.id])).first;assert(rows[0].NgayIn);
    await api('/requests/'+r.id+'/actions',staff,{action:'cancel',version:detail.version,message:'Không đổi hồ sơ đã hoàn tất.',idempotencyKey:randomUUID()},403);
    await api('/requests/'+r.id,other,undefined,404);
  }
  console.log(`Confirmation print workflow passed: ${checks} HTTP checks, ${catalog.documents.length} types; reception, assignment, PDF export, unchanged processing state, retry, appointment and cancellation.`);
}finally{try{await cleanupRequests(ids);}finally{await disconnectLocalDatabase();}}
