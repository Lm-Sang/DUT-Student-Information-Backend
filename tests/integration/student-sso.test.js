import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import jwt from 'jsonwebtoken';
import { listen } from '../support/public-api.js';
import { createAuthService } from '../../src/common/auth/services/auth.service.js';
import { createAuthStore } from '../../src/common/auth/stores/auth.store.js';
import { createAuthController } from '../../src/common/auth/controllers/auth.controller.js';
import { createAuthRouter } from '../../src/common/auth/routes/auth.routes.js';
import { createSsoTokenResolver } from '../../src/common/auth/middlewares/auth.middleware.js';
import { createDutStudentContext } from '../../src/common/students/index.js';
import { createCertificationMiddleware } from '../../src/common/certifications/middlewares/certifications.middleware.js';
import { createStudentCertificationsController } from '../../src/student/modules/certifications/controllers/certifications.controller.js';
import { createStudentCertificationsRouter } from '../../src/student/modules/certifications/routes/certifications.routes.js';
import { createStudentItCertificationsController } from '../../src/student/modules/certifications/controllers/it-certifications.controller.js';
import { createStudentItCertificationsRouter } from '../../src/student/modules/certifications/routes/it-certifications.routes.js';
import { createStudentAcademicLeaveController } from '../../src/student/modules/academic-leave/controllers/academic-leave.controller.js';
import { createStudentAcademicLeaveRouter } from '../../src/student/modules/academic-leave/routes/academic-leave.routes.js';
import { createAcademicLeaveMiddleware } from '../../src/common/academic-leave/middlewares/academic-leave.middleware.js';
import { createStudentRequestsRouter } from '../../src/student/modules/student-requests/routes/requests.routes.js';
import { createStudentRequestsController } from '../../src/student/modules/student-requests/controllers/requests.controller.js';
import { createRequestActorResolver } from '../../src/common/student-requests/middlewares/request-actor.js';
import { errorHandler } from '../../src/shared/middlewares/error-handler.middleware.js';
import { createStudentService, createStudentApplicationDataService } from '../../src/common/students/index.js';
import { createCertificationsService } from '../../src/common/certifications/services/certifications.service.js';
import { createItCertificationsService } from '../../src/common/certifications/services/it-certifications.service.js';
import { createAcademicLeaveService } from '../../src/common/academic-leave/services/academic-leave.service.js';

test('the same raw SSO token authenticates every student module and logout blocks all of them', async t => {
  const secret = 'offline-school-sso-secret-at-least-32-bytes';
  const store = createAuthStore();
  t.after(() => store.close());
  // No backend JWT key, SSO issuer or audience is available to the student app.
  const config = { jwt: {}, microsoftSso: { jwtSecret: secret, baseUrl: 'https://sso.example.test', logoutPath: '/logout' },
    app: { studentFrontendUrl: 'http://localhost:5173' } };
  const service = createAuthService({ config, store });
  const token = jwt.sign({ unique_name: '102210001@sv1.dut.udn.vn', studentCode: '102210001' }, secret, { expiresIn: 600 });
  const forwarded = [];
  const studentContext = createDutStudentContext({ ssoTokenResolver: createSsoTokenResolver(service),
    fetchImpl: async (_url, options) => {
      forwarded.push(options.headers.Authorization);
      return { ok: true, status: 200, json: async () => ({ data: { studentCardNumber: '102210001', fullName: 'Student' } }) };
    } });
  const certificateContext = createCertificationMiddleware({}, undefined, studentContext);
  const leaveContext = createAcademicLeaveMiddleware({ studentContextProvider: studentContext });
  let identityReads = 0;
  const profiles = createStudentService({ repository: {
    findIdentityRowsByStudentCode: async code => {
      identityReads++;
      assert.equal(code, '102210001');
      return [{ studentCode: code, citizenId: '012345678901' }];
    },
  } });
  const studentProfile = actor => profiles.getCertificationProfile(actor);
  const certificates = createCertificationsService({ config: {}, studentProfile,
    repository: { catalog: async () => ({ languages: [], types: [], policies: [] }) } });
  const itCertificates = createItCertificationsService({ config: {}, studentProfile, repository: { catalog: async () => [] } });
  const applicationData = createStudentApplicationDataService({ identityService: profiles });
  const academicLeave = createAcademicLeaveService({ prefillProvider: applicationData.prefill,
    repository: { currentSemesterCode: async () => '2610', eligibleParents: async () => [] } });
  const app = express();
  app.use('/api/student/auth', createAuthRouter('student', createAuthController('student', service, { frontendOrigin: config.app.studentFrontendUrl }), service));
  app.use('/api/student/certifications', createStudentCertificationsRouter(
    createStudentCertificationsController(certificates, {}), certificateContext));
  app.use('/api/student/it-certifications', createStudentItCertificationsRouter(
    createStudentItCertificationsController(itCertificates, {}), certificateContext));
  app.use('/api/student/academic-leave', createStudentAcademicLeaveRouter(
    createStudentAcademicLeaveController(academicLeave, {}), leaveContext, leaveContext('student')));
  const student = { id: 'sso:student', role: 'STUDENT', identitySource: 'SSO', studentNumber: '102210001' };
  const requestService = { sessionActor: async () => student };
  app.use('/api/student/requests', createStudentRequestsRouter(createStudentRequestsController(requestService),
    createRequestActorResolver({ channel: 'student', auth: service, service: requestService,
      school: { signIn: async claims => { assert.equal(claims.identity.microsoftId, '102210001@sv1.dut.udn.vn'); return student.id; } } })));
  app.use(errorHandler);
  const base = await listen(t, app);
  const paths = ['/certifications/catalog', '/it-certifications/form', '/academic-leave/form', '/requests/me'];
  for (const path of paths) {
    const url = base + '/api/student' + path;
    assert.equal((await fetch(url)).status, 401);
    const response = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
    assert.equal(response.status, 200, path);
    const data = (await response.json()).data;
    const profile = data.student ?? data.prefill?.student ?? data;
    assert.equal(profile.studentCode ?? profile.studentNumber, '102210001');
    if (path !== '/requests/me') assert.equal(profile.cccd, '012345678901');
    const localToken = jwt.sign({ channel: 'staff', tokenUse: 'access', authMethod: 'password', sid: 'local-session' }, 'different-backend-jwt-secret', { expiresIn: 600 });
    assert.equal((await fetch(url, { headers: { Authorization: 'Bearer ' + localToken } })).status, 401);
  }
  assert.deepEqual(forwarded, Array(3).fill('Bearer ' + token));
  assert.equal(identityReads, 3, 'only authenticated forms may read school identity');
  const logout = await fetch(base + '/api/student/auth/logout', { method: 'POST', headers: { Authorization: 'Bearer ' + token } });
  assert.equal(logout.status, 200);
  for (const path of paths) assert.equal((await fetch(base + '/api/student' + path, { headers: { Authorization: 'Bearer ' + token } })).status, 401);
  assert.equal(forwarded.length, 3, 'revoked tokens must be rejected before any DUT call');
  assert.equal(identityReads, 3, 'revoked tokens must be rejected before any school query');
});
