import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import { createServer } from 'node:http';
import { createStudentRequestsRouter } from '../../../src/student/modules/student-requests/routes/requests.routes.js';
import { createAdminRequestsRouter } from '../../../src/admin/modules/student-requests/routes/requests.routes.js';
import { createRequestActorResolver } from '../../../src/common/student-requests/middlewares/request-actor.js';
import { createStudentRequestsController } from '../../../src/student/modules/student-requests/controllers/requests.controller.js';
import { createAdminRequestsController } from '../../../src/admin/modules/student-requests/controllers/requests.controller.js';
import { createRequestsService } from '../../../src/common/student-requests/services/requests.service.js';
import { createRbacRepository } from '../../../src/common/student-requests/repositories/rbac.repository.js';
import { AppError } from '../../../src/shared/errors/app-error.js';

const id='00000000-0000-4000-8000-000000000001';
const dynamicType={code:'DB_NEW',name:'Đơn thêm từ DB',department:'CTSV',group:'PETITION',submissionMode:'PAPER_FORM',validationProfile:'DonSV01',templateCode:'DonSV01',active:true};
const student={id:'sv:sso',name:'Sinh viên SSO',studentNumber:'000000001',role:'STUDENT',identitySource:'SSO'};
const staff={id:'cv:local',name:'Chuyên viên local',role:'STAFF',permissions:[],workPermissions:[]};
const row={Id:id,Number:1,TypeCode:dynamicType.code,StudentId:student.id,StudentName:student.name,StudentNumber:student.studentNumber,Department:'CTSV',Status:'SUBMITTED',Version:1,Payload:{reasonCode:'LOST_OR_DAMAGED',changeDescription:''}};

async function fixture(t) {
  const verified=[],linked=[];
  const repository={get:async()=>row,list:async()=>[row],events:async()=>[],revisions:async()=>[],
    actor:async key=>key===student.id?{Id:student.id,DisplayName:student.name,Role:'STUDENT',StudentNumber:student.studentNumber,IdentitySource:'SSO'}:
      {Id:staff.id,DisplayName:staff.name,Role:'STAFF',Permissions:staff.permissions,WorkPermissions:staff.workPermissions,IdentitySource:'LOCAL'},
    catalogs:async()=>({types:[dynamicType],settings:[{SettingKey:'currentTerm',SettingValue:'2610'}],terms:[{code:'2610',sortOrder:1}],programs:[],documents:[],supportSystems:[]})};
  const service=createRequestsService(repository,{loadTypes:async()=>[dynamicType]});
  const auth={verifyToken:async(token,channel)=>{
    verified.push({token,channel});
    if(token==='student.jwt'&&channel==='student')return{authMethod:'sso',identity:{microsoftId:'000000001@sv1.dut.udn.vn'}};
    if(token==='staff.jwt'&&channel==='staff')return{authMethod:'password',identity:{requestActorId:staff.id},permissions:staff.permissions,
      organization:{active:true,fieldActive:true,accessLevel:'specialist',taskIds:[4]}};
    if(token==='staff-sso.jwt')return{authMethod:'sso',identity:{requestActorId:staff.id}};
    throw new AppError('JWT không hợp lệ hoặc sai audience.',401);
  }};
  const school={signIn:async claims=>{linked.push(claims.identity);return student.id;}};
  const app=express();app.use(express.json());
  for(const channel of ['student','staff']) {
    const studentChannel = channel === 'student';
    const controller = studentChannel ? createStudentRequestsController(service) : createAdminRequestsController(service);
    const router = studentChannel ? createStudentRequestsRouter : createAdminRequestsRouter;
    app.use(`/api/${channel}/requests`,router(controller,createRequestActorResolver({channel,service,school,auth}),{collectionPath:'/requests'}));
  }
  app.use((_req,res)=>res.status(404).json({message:'Not found'}));
  app.use((error,_req,res,_next)=>res.status(error.statusCode||500).json({message:error.message}));
  const server=createServer(app);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>{server.close(resolve);server.closeAllConnections();}));
  const base=`http://127.0.0.1:${server.address().port}`;
  return{verified,linked,call:(path,token,body)=>fetch(base+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:body?JSON.stringify(body):undefined})};
}

test('request APIs require channel JWT, use verified SSO identity directly and expose no demo login',async t=>{
  const f=await fixture(t);
  assert.equal((await f.call('/api/student/requests/me')).status,401);
  assert.equal((await f.call('/api/student/requests/me','staff.jwt')).status,401);
  const me=await f.call('/api/student/requests/me','student.jwt');assert.equal(me.status,200);assert.equal((await me.json()).data.id,student.id);
  assert.deepEqual(f.linked,[{microsoftId:'000000001@sv1.dut.udn.vn'}]);assert(f.verified.some(v=>v.channel==='student'));
  for(const path of ['/actors','/session','/sso/session','/staff/session']){
    const response=await f.call('/api/student/requests'+path,'student.jwt',path==='/actors'?undefined:{actorId:'admin-demo'});
    assert.equal(response.status,404);
  }
});

test('staff needs password-authenticated JWT plus current SQL permissions; DB catalog stays dynamic',async t=>{
  const f=await fixture(t);
  assert.equal((await f.call('/api/staff/requests/me','staff-sso.jwt')).status,403);
  const list=await f.call('/api/staff/requests/requests','staff.jwt');assert.equal(list.status,200);assert.deepEqual((await list.json()).data,[]);
  assert.equal((await f.call('/api/staff/requests/requests/'+id,'staff.jwt')).status,404);
  assert.equal((await f.call('/api/staff/requests/requests/'+id+'/actions','staff.jwt',{action:'receive',version:1,idempotencyKey:'receive'})).status,404);
  const catalog=await f.call('/api/student/requests/catalogs','student.jwt');assert.equal((await catalog.json()).data.types[0].code,'DB_NEW');
  const own=await f.call('/api/student/requests/requests/'+id,'student.jwt');assert.equal(own.status,200);assert.equal((await own.json()).data.typeName,dynamicType.name);
});

test('role mutations require SQL grants even for ADMIN and cannot delegate unheld permissions',async()=>{
  let statement;
  const repo=createRbacRepository({guard:()=>{},query:async(sql)=>{statement=sql;return{first:[]};}});
  await repo.saveRole('admin','role',{name:'QA',description:'',active:true,permissions:['requests.print']},false);
  assert(statement.includes('MaQuyen=?'));
  assert(!statement.includes("VaiTro='ADMIN'"));
  assert(statement.includes('NOT EXISTS(SELECT 1 FROM @grantable'));
  assert(statement.includes("MaQuyen='rbac.permissions.delegate'"));
});
