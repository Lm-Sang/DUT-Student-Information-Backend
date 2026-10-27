import assert from 'node:assert/strict';
import {test} from 'node:test';
import {studentNumberFromIdentity} from '../domain/student-identity.js';
import {createSchoolStudentService} from '../services/school-student.service.js';
import {createSchoolStudentReader} from '../repositories/school-student.repository.js';

const identity={microsoftId:'000000001@sv1.dut.udn.vn'};
test('student number comes only from verified institutional account and preserves leading zeroes',()=>{
  assert.equal(studentNumberFromIdentity(identity),'000000001');
  assert.equal(studentNumberFromIdentity({microsoftId:' 000000001@SV1.DUT.UDN.VN '}),'000000001');
  for(const microsoftId of ['000000001@gmail.com','000000001@sv1.dut.udn.vn.evil.test','000000001@evil.sv1.dut.udn.vn','12345678@sv1.dut.udn.vn','staff@dut.udn.vn','000000001',''])assert.throws(()=>studentNumberFromIdentity({microsoftId}),e=>e.statusCode===403);
  assert.throws(()=>studentNumberFromIdentity({studentNumber:'000000001',email:identity.microsoftId}));
});
test('profile lookup uses SoTheSV in the comprehensive source and never a personal contact email',async()=>{
  const calls=[];
  const read=createSchoolStudentReader({connect:async(account,database)=>{
    assert.equal(account,'secondary');assert(['DATA_GVien1','DATA_SV1','tmProxDUT'].includes(database));
    const request={input:(key,type,value)=>{calls.push({key,value});return request;},query:async sql=>{
      assert.match(sql,/^\s*SELECT/);assert.match(sql,/(?:SoTheSV|SoThe)=@(?:studentNumber|number)/);assert(!/EMail|\b(INSERT|UPDATE|DELETE|MERGE|EXEC)\b/i.test(sql));
      if(database==='tmProxDUT')return{recordsets:[[{MaHS:'qa',SoTheSV:'000000001',MaNganh:'CURRENT',ProgramName:'CTĐT đã đăng ký'}],[],[],[]]};
      return{recordset:database==='DATA_GVien1'?[{MaHS:'qa',SoTheSV:'000000001'}]:[]};
    }};return{request:()=>request};
  }});
  const rows=await read('000000001');assert.deepEqual(calls,[{key:'studentNumber',value:'000000001'},{key:'studentNumber',value:'000000001'},{key:'id',value:'qa'},{key:'number',value:'000000001'}]);assert.equal(rows[0].Source,'DATA_SV1/DATA_GVien1/tmProxDUT');assert.equal(rows[0].ProgramName,'CTĐT đã đăng ký');
});
test('verified number takes priority over arbitrary client fields; linking waits for an exact unique match',async()=>{
  let current=[{MaHS:'qa',SoTheSV:'000000001',Source:'DATA_GVien1.tmHoSoSV'}],writes=0;
  const service=createSchoolStudentService({syncSchoolStudent:async p=>{assert.equal(p.SoTheSV,'000000001');writes++;return'sso:qa';}},{readProfile:async number=>{assert.equal(number,'000000001');return current;}});
  assert.equal(await service.signIn({identity,studentNumber:'999999999',MaHS:'forged'}),'sso:qa');assert.equal(writes,1);
  for(const [rows,code]of [[[],'STUDENT_PROFILE_NOT_FOUND'],[[...current,...current],'STUDENT_PROFILE_AMBIGUOUS'],[[{MaHS:'other',SoTheSV:'999999999'}],'STUDENT_PROFILE_MISMATCH']]){
    current=rows;await assert.rejects(()=>service.signIn({identity}),e=>e.details?.code===code);
  }
  assert.equal(writes,1);
});
test('school database failures stay retriable and do not leak raw SQL or connection details',async()=>{
  const service=createSchoolStudentService({syncSchoolStudent:async()=>assert.fail('must not cache')},{readProfile:async()=>{throw Error('private SQL connection data');}});
  await assert.rejects(()=>service.signIn({identity}),e=>e.statusCode===503&&e.details.code==='STUDENT_PROFILE_UNAVAILABLE'&&!e.message.includes('private'));
});
