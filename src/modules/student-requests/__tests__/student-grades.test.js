import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'node:http';
import express from 'express';
import { createStudentGradesReader } from '../repositories/student-grades.repository.js';
import { createRequestsService } from '../services/requests.service.js';
import { createRequestsRouter } from '../routes/requests.routes.js';
import { createRequestsController } from '../controllers/requests.controller.js';
import { AppError } from '../../../shared/errors/app-error.js';

function fixture(identities = [{ MaHS: 'school-id', SoTheSV: '000000001' }], grades = []) {
  const calls = [];
  const read = createStudentGradesReader({ connect: async (account, database) => {
    assert.equal(account, 'secondary'); assert.equal(database, 'tmProxDUT');
    return { request() {
      const params = {};
      const request = { input(name, _type, value) { params[name] = value; return request; }, async query(statement) {
        assert(!/\b(INSERT|UPDATE|DELETE|MERGE|EXEC)\b/i.test(statement));
        calls.push({ statement, params });
        return { recordset: params.number ? identities : grades };
      } }; return request;
    } };
  } });
  return { read, calls };
}
test('transcript binds verified identity, preserves exact terms, zero/null scores and repeated attempts', async () => {
  const { read, calls } = fixture(undefined, [
    { ID: 1, IDCode: '2521', MaHP: '1000001', MalopHP: 'class', Diem: 0, Diem4: 0, DiemC: 'F ', Credits: 0, HocLai: 1 },
    { ID: 2, IDCode: '2520', MaHP: '1000001', Diem: null, Diem4: -1, Credits: 3, CourseName: 'Tên học phần' },
  ]);
  const data = await read('000000001');
  assert.equal(data.studentNumber, '000000001'); assert.equal(data.courses.length, 2);
  assert.equal(data.courses[0].termCode, '2521'); assert.equal(data.courses[0].score10, 0);
  assert.equal(data.courses[0].score4, 0); assert.equal(data.courses[0].credits, 0);
  assert.equal(data.courses[0].letter, 'F'); assert.equal(data.courses[0].retake, true);
  assert.equal(data.courses[1].score10, null); assert.equal(data.courses[1].score4, null);
  assert.equal(calls[0].params.number, '000000001'); assert.equal(calls[1].params.id, 'school-id');
});
test('missing, duplicate, mismatched identities never reach grade SELECT', async () => {
  for (const rows of [[], [{ MaHS: 'other', SoTheSV: '000000002' }], [{MaHS:'a',SoTheSV:'000000001'},{MaHS:'b',SoTheSV:'000000001'}]]) {
    const { read, calls } = fixture(rows);
    await assert.rejects(() => read('000000001'), error => error.statusCode === 409);
    assert.equal(calls.length, 1);
  }
  await assert.rejects(() => fixture().read("x'; DROP TABLE"), error => error.statusCode === 403);
});
test('SQL failures are sanitized', async () => {
  const read = createStudentGradesReader({ connect: async () => { throw new Error('password=SECRET'); } });
  await assert.rejects(() => read('000000001'), error => error.statusCode === 503 && !error.message.includes('SECRET'));
});
test('service rejects staff and demo actors before reading school grades', async () => {
  let called = false;
  const service = createRequestsService({}, { loadGrades: async number => { called = number; return []; } });
  for (const actor of [{role:'STAFF'},{role:'STUDENT',identitySource:'DEMO'}])
    await assert.rejects(() => service.grades(actor), error => error.statusCode === 403);
  assert.equal(called, false);
  await service.grades({role:'STUDENT',identitySource:'SSO',studentNumber:'000000001'});
  assert.equal(called, '000000001');
});
test('grades HTTP route requires auth and ignores student identity supplied in query', async t => {
  const actor = {role:'STUDENT',identitySource:'SSO',studentNumber:'000000001'};
  const service = createRequestsService({}, { loadGrades: async number => ({studentNumber:number,courses:[]}) });
  const app = express();
  app.use(createRequestsRouter(createRequestsController(service), service, {demo:false,resolveActor:async req=>{
    if(req.headers.authorization !== 'Bearer verified-session')throw new AppError('Cần đăng nhập.',401);
    return actor;
  }}));
  app.use((error,_req,res,_next)=>res.status(error.statusCode||500).json({message:error.message}));
  const server=createServer(app);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>{server.closeAllConnections();return new Promise(resolve=>server.close(resolve));});
  const url=`http://127.0.0.1:${server.address().port}/grades?studentNumber=000000002`;
  assert.equal((await fetch(url)).status,401);
  const response=await fetch(url,{headers:{Authorization:'Bearer verified-session'}});
  assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');
  assert.equal((await response.json()).data.studentNumber,'000000001');
});
