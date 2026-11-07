import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'node:http';
import express from 'express';
import { createStudentsModule } from '../index.js';
import { errorHandler } from '../../../shared/middlewares/error-handler.middleware.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { createStudentPortalRepository, parseSchoolSchedule } from '../repositories/student-portal.repository.js';

const claims={channel:'student',authMethod:'sso',identity:{microsoftId:'000000001@sv1.dut.udn.vn'}};
async function fixture(t,overrides={}) {
  const calls=[];
  const options={
    authService:{verifyToken:async(token,channel)=>{assert.equal(channel,'student');if(token!=='valid')throw new AppError('Invalid token',401);return claims;}},
    readProfile:async number=>{calls.push(['profile',number]);return[{MaHS:'school-id',SoTheSV:number,Hoten:'Họ tên từ trường',ProgramCode:'1024034',ProgramName:'Ngành hiện hành',academic:{earnedCredits:0,cumulativeGpa:null},semesterResults:[]}];},
    readGrades:async number=>{calls.push(['grades',number]);return{studentNumber:number,courses:[]};},
    repository:{currentProgram:async number=>{calls.push(['program',number]);return'1024034';},schedule:async number=>({studentNumber:number,classes:[],exams:[]})},
    curriculum:{getCurriculum:async(id,scope)=>{calls.push(['curriculum',id,scope]);return{program:{id},courses:[]};}},
    ...overrides,
  };
  const module=createStudentsModule(options),app=express();app.use(module.basePath,module.router);app.use(errorHandler);
  const server=createServer(app);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>{server.closeAllConnections();return new Promise(resolve=>server.close(resolve));});
  const get=(path,token='valid')=>fetch(`http://127.0.0.1:${server.address().port}/api/students/me/${path}`,{headers:{Authorization:'Bearer '+token}});
  return{get,calls};
}
test('profile, grades, curriculum and schedule work without creating a local service actor',async t=>{
  const {get,calls}=await fixture(t);
  const response=await get('profile');assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');
  const p=(await response.json()).data;assert.equal(p.programId,'1024034');assert.equal(p.studentNumber,'000000001');assert.equal(p.academic.earnedCredits,0);assert.equal(p.academic.cumulativeGpa,null);assert.equal(p.isSimulation,false);
  for(const kind of ['grades','curriculum','schedule'])assert.equal((await get(kind)).status,200);
  assert.deepEqual(calls.find(c=>c[0]==='curriculum'),['curriculum','1024034',{publicOnly:false}]);
  assert(calls.filter(c=>['profile','grades','program'].includes(c[0])).every(c=>c[1]==='000000001'));
});
test('query/path spoofing cannot select a different student or programme',async t=>{
  const {get,calls}=await fixture(t);
  for(const kind of ['profile','grades','curriculum','schedule'])assert.equal((await get(kind+'?studentNumber=000000002&programId=1010001')).status,400);
  assert.equal((await get('curriculum/1010001')).status,404);assert.equal(calls.length,0);
});
test('invalid sessions, password accounts and untrusted student identities fail before reading',async t=>{
  const {get,calls}=await fixture(t);assert.equal((await get('profile','bad')).status,401);assert.equal(calls.length,0);
  for(const user of [{...claims,authMethod:'password'},{...claims,channel:'staff'},{...claims,identity:{microsoftId:'staff@example.com'}}]){
    const f=await fixture(t,{authService:{verifyToken:async()=>user}});
    assert.equal((await f.get('profile')).status,403);assert.equal(f.calls.length,0);
  }
});
test('school failure remains an error and ambiguous/missing identity never returns another profile',async t=>{
  const f=await fixture(t,{readProfile:async()=>{throw new Error('SQL password=SECRET');}});
  const response=await f.get('profile');assert.equal(response.status,503);assert(!(await response.text()).includes('SECRET'));
  for(const rows of [[],[{MaHS:'other',SoTheSV:'000000002'}],[{MaHS:'a',SoTheSV:'000000001'},{MaHS:'b',SoTheSV:'000000001'}]]){
    const g=await fixture(t,{readProfile:async()=>rows});assert.equal((await g.get('profile')).status,409);
  }
});
test('missing registered programme does not fall back to an admission or arbitrary public programme',async t=>{
  const f=await fixture(t,{repository:{currentProgram:async()=>null}});assert.equal((await f.get('curriculum')).status,404);
  assert(!f.calls.some(c=>c[0]==='curriculum'));
});
test('timetable uses exact seven-day slots and keeps unknown rooms/invalid periods empty',()=>{
  assert.deepEqual(parseSchoolSchedule('2-4,A101;;;;;;'),[{dayIndex:0,startPeriod:2,endPeriod:4,room:'A101'}]);
  assert.deepEqual(parseSchoolSchedule(';;;;;;7-9,???'),[{dayIndex:6,startPeriod:7,endPeriod:9,room:null}]);
  assert.deepEqual(parseSchoolSchedule('2-4,A101'),[]);assert.deepEqual(parseSchoolSchedule('0-9,A101;;;;;;'),[]);assert.deepEqual(parseSchoolSchedule('9-2,A101;;;;;;'),[]);
});
test('schedule/registered-program reader binds school identity and only uses SELECT',async()=>{
  const statements=[];
  const repository=createStudentPortalRepository({connect:async()=>({request(){const parameters={};const req={input(name,_type,value){parameters[name]=value;return req;},async query(sql){assert(!/\b(INSERT|UPDATE|DELETE|MERGE|EXEC)\b/i.test(sql));statements.push({sql,parameters});return{recordset:parameters.number?[{MaHS:'verified-id',SoTheSV:'000000001',MaNganh:'1024034'}]:[{ID:1,IDCode:'2610',ClassRows:1,TKB:'2-4,A101;;;;;;',TuanHoc:'1-10'}]};}};return req;}})});
  assert.equal(await repository.currentProgram('000000001'),'1024034');
  const schedule=await repository.schedule('000000001');assert.equal(schedule.classes[0].meetings[0].startPeriod,2);assert.equal(statements.at(-1).parameters.id,'verified-id');
});
