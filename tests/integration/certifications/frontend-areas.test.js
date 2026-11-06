import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AppError } from '../../../src/shared/errors/app-error.js';
import { isolatedApp, listen, studentContext, reviewerContext, headers } from '../../support/frontend-areas.js';
import { createCertificationsModule, createItCertificationsModule } from '../../../src/bootstrap/modules/certifications.module.js';
import { createLocalPermissionContext } from '../../../src/common/auth/index.js';

test('certificate aliases share services, enforce frontend identity and preserve reviewer/catalog permissions', async t => {
  const queries = [];
  const auth = { verifyToken: async (token, channel) => {
    if (channel !== 'admin' || !['reviewer', 'manager', 'unprivileged'].includes(token)) throw new AppError('Wrong audience', 401);
    return { authMethod: 'password', localUserId: token, identity: { displayName: token },
      organization:{active:true,fieldActive:true,accessLevel:'specialist',taskIds:[1]},
      permissions: token === 'manager' ? ['certifications:review', 'certifications:catalog:manage']
        : token === 'reviewer' ? ['certifications:review'] : [] };
  } };
  const review = createLocalPermissionContext('certifications:review', auth, 1);
  const catalog = createLocalPermissionContext('certifications:catalog:manage', auth, 1);
  const module = createCertificationsModule({
    config: { maxFiles: 1, r2: {} }, storage: {}, inspectImage: async () => ({}),
    studentContextProvider: studentContext,
    reviewerAuthentication: { actor: (req, role) => (role === 'catalog' ? catalog : review)(req) },
    repository: {
      list: async query => { queries.push(query); return { page: 1, pageSize: 20, totalRecords: 0, items: [] }; },
      catalog: async () => ({ languages: [], types: [], policies: [], issuers: [] }),
      get: async () => ({ ActorSource: 'auth', ActorReference: 'student:someone-else' }),
    },
  });
  const base = await listen(t, isolatedApp({ certificationsModule: module }));
  const call = (path, token, method = 'GET') => fetch(base + path, { method, headers: headers(token) });
  for (const path of ['/api/student/certifications/applications', '/api/certifications/applications']) {
    assert.equal((await call(path)).status, 401);
    assert.equal((await call(path, 'reviewer')).status, 401);
    const response = await call(path, 'student');
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).data.items, []);
  }
  for (const path of ['/api/admin/certifications/applications', '/api/certifications/reviewer/applications']) {
    assert.equal((await call(path, 'student')).status, 401);
    assert.equal((await call(path, 'unprivileged')).status, 403);
    assert.equal((await call(path, 'reviewer')).status, 200);
    assert.equal(queries.at(-1).status, 'submitted');
  }
  assert.equal((await call('/api/admin/certifications/management/catalog', 'reviewer')).status, 403);
  assert.equal((await call('/api/admin/certifications/management/catalog', 'manager')).status, 200);
  assert.equal((await call('/api/certifications/management/catalog', 'manager')).status, 200);
  const id = '00000000-0000-4000-8000-000000000001';
  assert.equal((await call('/api/student/certifications/applications/' + id, 'student')).status, 403);
  assert.equal((await call('/api/student/certifications/applications/' + id + '/review', 'student', 'POST')).status, 404);
  assert.equal((await call('/api/admin/certifications/applications', 'reviewer', 'POST')).status, 404);
  assert.equal(queries.filter(query => query.actor.role === 'student').length, 2);
});

test('IT certificates keep frontend isolation and reviewer defaults on both URL layouts', async t => {
  const queries = [];
  const module = createItCertificationsModule({
    config: { maxFiles: 4, r2: {} }, storage: {}, inspectImage: async () => ({}),
    studentContextProvider: studentContext, reviewerAuthentication: { actor: reviewerContext },
    repository: {
      list: async query => { queries.push(query); return { page: 1, pageSize: 20, totalRecords: 0, items: [] }; },
      records: async () => ({ items: [], totalRecords: 0 }),
    },
  });
  const base = await listen(t, isolatedApp({ itCertificationsModule: module }));
  for (const [path, token] of [
    ['/api/student/it-certifications/applications', 'student'],
    ['/api/it-certifications/applications', 'student'],
    ['/api/admin/it-certifications/applications', 'reviewer'],
    ['/api/it-certifications/reviewer/applications', 'reviewer'],
  ]) {
    assert.equal((await fetch(base + path)).status, 401);
    assert.equal((await fetch(base + path, { headers: headers(token === 'student' ? 'reviewer' : 'student') })).status, 401);
    const response = await fetch(base + path, { headers: headers(token) });
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).data.items, []);
    if (token === 'reviewer') assert.equal(queries.at(-1).status, 'submitted');
  }
  for (const token of ['student', 'reviewer']) {
    const area = token === 'student' ? 'student' : 'admin';
    assert.equal((await fetch(base + '/api/' + area + '/it-certifications/records', { headers: headers(token) })).status, 200);
  }
});
