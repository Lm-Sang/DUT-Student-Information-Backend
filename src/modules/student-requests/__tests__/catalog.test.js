import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequestCatalogRepository } from '../repositories/catalog.repository.js';
import { createRequestsService } from '../services/requests.service.js';
import { createPaperFilesService } from '../services/paper-files.service.js';
import { parseCreate } from '../dto/requests.dto.js';
import { payloadFromColumns } from '../domain/request-fields.js';

const type = { code:'THE_MOI',name:'Cấp thẻ mới theo danh mục',department:'CTSV',group:'PETITION',submissionMode:'PAPER_FORM',
  validationProfile:'DonSV01',templateCode:'DonSV01',active:true };
const actor = { id:'sv-a', role:'STUDENT' };
const row = { Id:'test',TypeCode:type.code,StudentId:actor.id,StudentNumber:'0001',Department:'CTSV',Status:'SUBMITTED',Version:1,
  Number:1,CreatedAt:'2026-11-03T00:00:00Z',Payload:{reasonCode:'CHANGE_INFO',changeDescription:'Sửa tên'} };

test('catalog repository returns typed DB metadata and ordered form fields',async()=>{
  const sql=[];
  const repo=createRequestCatalogRepository({guard:()=>{},query:async statement=>{
    sql.push(statement);return{first:statement.includes('FROM svc_demo.LoaiDon')?[{...type,active:1}]:[{MaLoaiDon:type.code,TenTruong:'reasonCode',BatBuoc:1}]};
  }});
  const [result]=await repo.list();assert.equal(result.code,type.code);assert.equal(result.fields[0].key,'reasonCode');assert(result.fields[0].required);
  assert(sql[0].includes('WHERE HieuLuc=1'));assert(!sql.some(q=>/INSERT|UPDATE|DELETE/.test(q)));
});

test('new DB type is created through known validation profile and mapped without hardcoded type list',async()=>{
  let saved;
  const repo={receipt:async()=>null,create:async d=>{saved=d;return row.Id;},get:async()=>row,
    catalogs:async()=>({types:[type],settings:[{SettingKey:'currentTerm',SettingValue:'2610'}],terms:[{code:'2610',sortOrder:1}],programs:[],documents:[],supportSystems:[]})};
  const service=createRequestsService(repo,{loadTypes:async()=>[type]});
  const result=await service.create(actor,parseCreate({typeCode:type.code,payload:row.Payload,idempotencyKey:'key'}));
  assert.equal(saved.typeCode,type.code);assert.equal(saved.department,'CTSV');assert.equal(result.typeName,type.name);assert.equal(result.formFile.generation,'ON_DOWNLOAD');
  assert.equal(result.validationProfile,'DonSV01');
  type.active=false;
  await assert.rejects(()=>service.create(actor,{typeCode:type.code,payload:row.Payload,idempotencyKey:'next'}),e=>e.statusCode===400);
  type.active=true;
});

test('dynamic alias reads typed columns and uses an allowlisted PDF renderer profile',async()=>{
  assert.equal(payloadFromColumns({...row,ValidationProfile:'DonSV01',LyDoDeNghi:'CHANGE_INFO',ThongTinThayDoiThe:'Sửa tên'}).changeDescription,'Sửa tên');
  let rendererCode;
  const service=createPaperFilesService({get:async()=>row,profile:async()=>({name:'QA',studentNumber:'0001'}),catalogs:async()=>({types:[type],terms:[],programs:[]})},
    {renderer:async({template})=>{rendererCode=template.code;return{bytes:Buffer.from('%PDF-QA')};}});
  const file=await service.download(actor,row.Id);assert.equal(rendererCode,'DonSV01');assert.equal(file.filename,`${type.code}-${row.Id}.pdf`);
});
