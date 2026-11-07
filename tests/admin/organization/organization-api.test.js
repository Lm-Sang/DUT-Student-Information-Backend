import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import { createServer } from 'node:http';
import { createOrganizationModule } from '../../../src/admin/modules/organization/index.js';
import { AppError } from '../../../src/shared/errors/app-error.js';
import { errorHandler } from '../../../src/shared/middlewares/error-handler.middleware.js';

test('organization routes require admin authentication and enforce the management hierarchy and field boundaries', async t => {
  const calls = [], targetId = '11111111-1111-4111-8111-111111111111';
  const profiles = {
    root: { accessLevel: 'super_admin', fieldCode: null },
    dt: { accessLevel: 'department_admin', fieldCode: 'DT' },
    kt: { accessLevel: 'department_admin', fieldCode: 'KT' },
    staff: { accessLevel: 'specialist', fieldCode: 'DT' },
  };
  const repository = {
    fields: async () => [{ fieldCode: 'DT', active: true }, { fieldCode: 'KT', active: true }],
    tasks: async () => [{ id: 1, code: 'certifications', fieldCode: 'DT' }],
    accounts: async (level, field) => [{ accountId: targetId, staffAccountId: 'cv:target', displayName: 'Target', accessLevel: level, fieldCode: field ?? 'DT', revision: 1 }],
    saveField: async (...args) => calls.push(['field', ...args]),
    saveAccount: async (...args) => calls.push(['account', ...args]),
    progress: async (...args) => { calls.push(['progress', ...args]); return { items: [] }; },
  };
  const authService = { verifyToken: async (token, channel) => {
    assert.equal(channel, 'admin');
    if (!profiles[token]) throw new AppError('Invalid audience or token', 401);
    return { channel, authorizationStatus: 'active', organization: { ...profiles[token], accountId: token, active: true, fieldActive: true, revision: 1 } };
  } };
  const app = express(); app.use(express.json());
  app.use('/api/admin/organization', createOrganizationModule({ repository, progressRepository: repository, authService }).router);
  app.use(errorHandler);
  const server = createServer(app); await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  const base = `http://127.0.0.1:${server.address().port}/api/admin/organization`;
  const request = (path, token, method = 'GET', body) => fetch(base + path, {
    method, headers: { ...(token ? { authorization: 'Bearer ' + token } : {}), 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  for (const token of [undefined, 'student-token', 'staff-token']) assert.equal((await request('/accounts', token)).status, 401);
  assert.equal((await request('/accounts', 'staff')).status, 403);
  assert.equal((await request('/accounts', 'root')).status, 200);
  const edit = { displayName: 'Target', accessLevel: 'specialist', fieldCode: 'DT', permissions: [], revision: 1 };
  assert.equal((await request('/accounts/' + targetId, 'dt', 'PUT', edit)).status, 200);
  assert.equal((await request('/accounts/' + targetId, 'kt', 'PUT', edit)).status, 403);
  assert.equal((await request('/accounts/' + targetId, 'root', 'PUT', edit)).status, 200);
  assert.equal((await request('/fields/DT', 'dt', 'PUT', { name: 'Đào tạo' })).status, 403);
  assert.equal((await request('/fields/DT', 'root', 'PUT', { name: 'Đào tạo' })).status, 200);
  assert.equal((await request('/progress/1', 'dt')).status, 200);
  assert.equal((await request('/progress/1', 'kt')).status, 404);
  assert.equal((await request('/progress/1', 'root')).status, 403);
  assert.equal((await request('/progress/1', 'staff')).status, 403);
  assert.equal((await request('/progress/1', 'dt', 'POST', {})).status, 404);
  assert.equal((await request('/accounts/' + targetId, 'dt', 'DELETE', { revision: 1 })).status, 200);
  assert.equal(calls.at(-1)[4].active, false);
});
