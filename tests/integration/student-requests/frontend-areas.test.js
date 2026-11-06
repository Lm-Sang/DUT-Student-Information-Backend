import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AppError } from '../../../src/shared/errors/app-error.js';
import { isolatedApp, listen, studentContext, reviewerContext, headers } from '../../support/frontend-areas.js';
import { createRequestActorResolver } from '../../../src/common/student-requests/middlewares/request-actor.js';
import { createStudentRequestsController } from '../../../src/student/modules/student-requests/controllers/requests.controller.js';
import { createAdminRequestsController } from '../../../src/admin/modules/student-requests/controllers/requests.controller.js';
import { createStudentRequestsRouter } from '../../../src/student/modules/student-requests/routes/requests.routes.js';
import { createAdminRequestsRouter } from '../../../src/admin/modules/student-requests/routes/requests.routes.js';

test('request aliases require their channel and keep demo and administrative endpoints out of student routes', async t => {
  let creations = 0;
  const actors = {
    student: { id: 'student', role: 'STUDENT', identitySource: 'SSO', studentNumber: '102210001' },
    staff: { id: 'staff', role: 'STAFF', permissions: [] },
  };
  const service = {
    sessionActor: async id => actors[id], list: async actor => [{ owner: actor.id }],
    create: async (actor, input) => { creations++; return { student: actor.id, typeCode: input.typeCode }; },
  };
  const auth = { verifyToken: async (token, channel) => {
    if (token !== channel) throw new AppError('Wrong audience', 401);
    return channel === 'student'
      ? { authMethod: 'sso', identity: { microsoftId: '102210001@sv1.dut.udn.vn' } }
      : { authMethod: 'password', identity: { requestActorId: 'staff' } };
  } };
  const school = { signIn: async () => 'student' };
  const modules = {};
  for (const channel of ['student', 'staff']) {
    const isStudent = channel === 'student';
    const controller = isStudent ? createStudentRequestsController(service) : createAdminRequestsController(service);
    const router = isStudent ? createStudentRequestsRouter : createAdminRequestsRouter;
    const resolveActor = createRequestActorResolver({ channel, service, school, auth });
    modules[isStudent ? 'studentServicesModule' : 'staffServicesModule'] = {
      basePath: isStudent ? '/api/student-services' : '/api/staff/student-services',
      router: router(controller, resolveActor, { collectionPath: '/requests', legacy: !isStudent }),
      [isStudent ? 'studentRouter' : 'adminRouter']: router(controller, resolveActor),
    };
  }
  const base = await listen(t, isolatedApp(modules));
  for (const [path, token] of [
    ['/api/student/requests', 'student'], ['/api/student-services/requests', 'student'],
    ['/api/admin/requests', 'staff'], ['/api/staff/student-services/requests', 'staff'],
  ]) {
    assert.equal((await fetch(base + path)).status, 401);
    assert.equal((await fetch(base + path, { headers: headers(token === 'student' ? 'staff' : 'student') })).status, 401);
    const response = await fetch(base + path, { headers: headers(token) });
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).data, [{ owner: token }]);
  }
  const body = JSON.stringify({ typeCode: 'DonSV01', payload: {}, idempotencyKey: 'test-submission' });
  const post = (path, token) => fetch(base + path, { method: 'POST', headers: { ...headers(token), 'Content-Type': 'application/json' }, body });
  assert.equal((await post('/api/student/requests', 'student')).status, 201);
  assert.equal((await post('/api/student-services/requests', 'student')).status, 201);
  assert.equal((await post('/api/admin/requests', 'staff')).status, 404);
  assert.equal((await post('/api/staff/student-services/requests', 'staff')).status, 403);
  assert.equal((await fetch(base + '/api/staff/student-services/requests', {
    method: 'POST', headers: { ...headers('staff'), 'Content-Type': 'application/json' }, body: '{}',
  })).status, 400, 'legacy staff submissions preserve input validation before permission rejection');
  assert.equal(creations, 2);
  for (const suffix of ['/session', '/sso/session', '/staff/session', '/admin/roles']) {
    assert.equal((await post('/api/student/requests' + suffix, 'student')).status, 404);
  }
});
