import {cleanupRbacFixtures} from './lib/cleanup-rbac-fixtures.js';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {queryLocalDatabase as query,disconnectLocalDatabase} from '../src/infrastructure/database/local-sql-server.js';
import {localDatabaseGuardSql,assertLocalDemoTarget} from '../src/infrastructure/database/local-write-guard.js';
import {cleanupRequests} from './lib/cleanup-requests.js';
import {makeWorkbook,readWorkbook} from '../src/modules/student-requests/services/request-workbook.js';
import {createRequestsRepository} from '../src/modules/student-requests/repositories/requests.repository.js';
const base='http://127.0.0.1:3003/api/demo/student-requests',suffix=randomUUID().slice(0,8),people=['s','a','b'].map(x=>'qa-wf-'+suffix+'-'+x),ids=[];
let checks=0;
async function call(path,token,body,method=body?'POST':'GET',expected=200){const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});const json=await r.json();assert.equal(r.status,expected,path+': '+JSON.stringify(json));checks++;return json.data;}
async function session(id){return(await call('/session',null,{actorId:id})).token;}
async function create(s,typeCode='CONFIRMATION'){const r=await call('/requests',s,{typeCode,payload:typeCode==='CONFIRMATION'?{documentCode:'01',quantity:1,feeMode:'PAID',serviceSpeed:'NORMAL',additionalInfo:'QA workflow only'}:{reasonCode:'LOST_OR_DAMAGED'},idempotencyKey:randomUUID()},'POST',201);ids.push(r.id);return r;}
const act=(token,r,action,extra={})=>call('/requests/'+r.id+'/actions',token,{action,version:r.version,idempotencyKey:randomUUID(),...extra});
async function excel(token,list){const r=await fetch(base+'/workbook/export',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({ids:list.map(r=>r.id)})});assert.equal(r.status,200);return Buffer.from(await r.arrayBuffer());}
function edit(bytes,status,extra=()=>{}){return makeWorkbook(readWorkbook(bytes).map(row=>{const v='ABCDEFGHIJKL'.split('').map(k=>row[k]);v[5]=status;extra(v);return v;}));}
async function preview(token,bytes){const r=await fetch(base+'/workbook/preview',{method:'POST',headers:{'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',Authorization:'Bearer '+token},body:bytes});const j=await r.json();assert.equal(r.status,200,JSON.stringify(j));checks++;return j.data;}
async function print(token,r){const start=performance.now();const response=await fetch(base+'/requests/'+r.id+'/print',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({version:r.version,idempotencyKey:randomUUID()})});assert.equal(response.status,200,await(response.status===200?Promise.resolve(''):response.text()));await response.arrayBuffer();checks++;return{r:await call('/requests/'+r.id,token),ms:Math.round(performance.now()-start)};}
try{
 assertLocalDemoTarget();for(const[i,id]of people.entries())await query(`${localDatabaseGuardSql}INSERT svc_demo.TaiKhoan(MaHS,Hoten,VaiTro,MaDV,SoThe) VALUES(?,?,?,N'120',?);`,[id,'QA workflow '+i,i===0?'STUDENT':'STAFF',i===0?'QA00001':null]);
 const[s,a,b,admin]=await Promise.all([...people,'admin-demo'].map(session));
 for(const id of people.slice(1))await call('/admin/staff/'+id+'/permissions',admin,{version:1,keys:['CONFIRMATION:01','DonSV01']},'PUT');
 await call('/admin/staff/'+people[1]+'/permissions',a,{version:2,keys:[]},'PUT',403);
 let first=await create(s);const race=await Promise.all([a,b].map(token=>fetch(base+'/requests/'+first.id+'/actions',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({action:'receive',version:first.version,idempotencyKey:randomUUID()})})));
 assert.equal(race.filter(r=>r.status===200).length,1);assert(race.every(r=>[200,403,409].includes(r.status)));checks++;
 first=await call('/requests/'+first.id,admin);const owner=first.assignedStaffId===people[1]?a:b,other=owner===a?b:a,target=owner===a?people[2]:people[1];
 const {r:printed,ms}=await print(owner,first);assert.equal(new Date(printed.pickupAt)-new Date(printed.printedAt),3*86400000);assert.equal(printed.status,'RECEIVED');
 const reprinted=(await print(owner,printed)).r;assert.equal(reprinted.pickupAt,printed.pickupAt);assert.equal(reprinted.printedAt,printed.printedAt);
 const staleFile=edit(await excel(owner,[reprinted]),'Đã xử lý'),oldPreview=await preview(owner,staleFile);assert.equal(oldPreview.errors,0);
 first=await call('/requests/'+first.id+'/reassign',admin,{staffId:target,reason:'QA bàn giao công việc',version:reprinted.version,idempotencyKey:randomUUID()});assert.equal(first.assignedStaffId,target);assert(first.events.some(e=>e.type==='REASSIGN'));
 await call('/workbook/commit',owner,{batchId:oldPreview.batchId},'POST',403);assert.equal((await preview(owner,staleFile)).errors,1);
 first=await act(other,first,'result');assert.equal(first.status,'COMPLETED');assert.equal(first.pickupAt,printed.pickupAt);
 assert.equal((await preview(other,edit(await excel(other,[first]),'Đã tiếp nhận'))).errors,1);
 const x=await create(s),y=await create(s);let p=await preview(a,edit(await excel(a,[x,y]),'Đã tiếp nhận'));assert.equal(p.errors,0);assert.equal(p.changes,2);
 await call('/workbook/commit',a,{batchId:p.batchId});await call('/workbook/commit',a,{batchId:p.batchId});let xr=await call('/requests/'+x.id,a),yr=await call('/requests/'+y.id,a);assert.equal(xr.version,2);assert.equal(yr.version,2);
 // Actual Excel printing creates the same appointment immediately.
 const stamp=new Date().toISOString();p=await preview(a,edit(await excel(a,[xr]),'Đã in',v=>v[6]=(new Date(stamp).getTime()/86400000+25569+7/24)));assert.equal(p.errors,0,JSON.stringify(p));await call('/workbook/commit',a,{batchId:p.batchId});xr=await call('/requests/'+x.id,a);assert.equal(new Date(xr.pickupAt)-new Date(xr.printedAt),259200000);
 // Revoke live permission and require it even for a request already owned.
 const staff=(await call('/admin/staff',admin)).staff.find(v=>v.id===people[1]);await call('/admin/staff/'+people[1]+'/permissions',admin,{version:staff.permissionVersion,keys:['DonSV01']},'PUT');assert.deepEqual((await call('/requests/'+x.id,a)).actions,[]);
 await call('/requests/'+x.id+'/actions',a,{action:'result',version:xr.version,idempotencyKey:randomUUID()},'POST',403);
 // Repository batch is all-or-nothing if a later version is stale, independent of preview.
 const repo=createRequestsRepository();const fresh=await create(s,'DonSV01'),fresh2=await create(s,'DonSV01');const cmd=r=>({id:r.id,actorId:people[1],role:'STAFF',version:r.version,action:'receive',key:randomUUID(),hash:'a'.repeat(64),typeCode:r.typeCode,payload:r.payload,status:'RECEIVED',eventType:'RECEIVE',message:'QA atomic'});
 await assert.rejects(()=>repo.batchUpdate([cmd(fresh),{...cmd(fresh2),version:999}]));assert.equal((await call('/requests/'+fresh.id,admin)).status,'SUBMITTED');checks++;
 // Petitions have no specialist print step, including Excel batch processing.
 let paper=await act(a,fresh,'receive');assert.equal(paper.printedAt,null);assert(paper.actions.includes('complete'));assert.equal(paper.formFile.canPrint,false);
 await call('/requests/'+paper.id+'/print',a,{version:paper.version,idempotencyKey:randomUUID()},'POST',403);
 const paperPreview=await preview(a,edit(await excel(a,[paper]),'Đã xử lý'));assert.equal(paperPreview.errors,0);assert.equal(paperPreview.rows[0].action,'complete');
 await call('/workbook/commit',a,{batchId:paperPreview.batchId});paper=await call('/requests/'+paper.id,a);
 assert.equal(paper.status,'COMPLETED');assert.equal(paper.printedAt,null);assert.equal(paper.events.filter(e=>e.type==='PRINT').length,0);
 console.log(JSON.stringify({passed:true,httpChecks:checks,isolatedRequests:ids.length,pdfMilliseconds:ms,sshWrites:0}));
}finally{
 await cleanupRequests(ids);
 await cleanupRbacFixtures(people);
 await disconnectLocalDatabase();
}
