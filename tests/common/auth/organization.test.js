import assert from 'node:assert/strict';
import { test } from 'node:test';
import { organizationAuthorization, parseOrganizationAccount, requireOrganizationManager } from '../../../src/common/auth/rules/organization.js';
import { createOrganizationRepository } from '../../../src/common/auth/repositories/organization.repository.js';
import { createLocalPermissionContext } from '../../../src/common/auth/middlewares/auth.middleware.js';
import { organizationPermissionsViewSql } from '../../../src/common/student-requests/repositories/rbac-views.js';

const base = { accountId: 'manager', accessLevel: 'specialist', fieldCode: 'DT', active: true, fieldActive: true, revision: 1 };
const claims = organization => ({ authMethod: 'password', authorizationStatus: 'active', organization,
  permissions: organization.permissions, localUserId: 'manager', identity: { displayName: 'Manager', organization } });
const tasks = [{ id: 1, active: true, fieldCode: 'DT' }, { id: 2, active: true, fieldCode: 'KT' }, { id: 3, active: false, fieldCode: 'DT' }];
const grants = [{ taskId: 1, permission: 'certifications:review' }, { taskId: 2, permission: 'other' }, { taskId: 3, permission: 'disabled' }];

test('numeric task tags grant only active tasks in the account department', () => {
  const auth = organizationAuthorization(base, tasks, grants);
  assert.deepEqual(auth.taskIds, [1]);
  assert.deepEqual(auth.permissions, ['certifications:review']);
  assert.deepEqual(auth.tags, { role: 'specialist', fieldCode: 'DT', taskIds: [1] });
  for (const changes of [{ active: false }, { fieldActive: false }]) {
    assert.deepEqual(organizationAuthorization({ ...base, ...changes }, tasks, grants).permissions, []);
  }
});

test('administrators receive management permissions only, even if tasks were assigned directly in SQL', () => {
  const root = organizationAuthorization({ ...base, accessLevel: 'super_admin', fieldCode: null }, tasks, grants);
  assert.deepEqual(root.permissions, ['organization.fields.manage', 'organization.admins.manage']);
  assert.deepEqual(root.taskIds, []);
  const manager = organizationAuthorization({ ...base, accessLevel: 'department_admin' }, tasks, grants);
  assert.deepEqual(manager.permissions, ['organization.specialists.manage', 'organization.progress.view']);
  assert.deepEqual(manager.taskIds, []);
  assert.doesNotThrow(() => requireOrganizationManager(claims(root), 'department_admin', 'KT'));
  assert.doesNotThrow(() => requireOrganizationManager(claims(manager), 'specialist', 'DT'));
  for (const [actor, level, field] of [[root, 'specialist', 'DT'], [manager, 'department_admin', 'DT'], [manager, 'specialist', 'KT'], [base, 'specialist', 'DT']])
    assert.throws(() => requireOrganizationManager(claims(actor), level, field), e => e.statusCode === 403);
});

test('DTO rejects privilege injection, duplicate tasks, invalid passwords and missing edit revisions', () => {
  const input = { username: 'test-user', password: 'test-password-123', displayName: 'Test', accessLevel: 'specialist', fieldCode: 'DT', taskIds: [1] };
  assert.deepEqual(parseOrganizationAccount(input).taskIds, [1]);
  for (const change of [{ permissions: ['*'] }, { accessLevel: 'super_admin' }, { taskIds: ['1'] }, { taskIds: [1, 1] }, { fieldCode: '115' }, { password: 'short' }, { accessLevel: 'department_admin' }])
    assert.throws(() => parseOrganizationAccount({ ...input, ...change }), e => e.statusCode === 400);
  assert.throws(() => parseOrganizationAccount({ displayName: 'Test', accessLevel: 'specialist', fieldCode: 'DT' }, { editing: true }), e => e.statusCode === 400);
});

test('reviewer contexts preserve admin audience and distinguish task tags, monitoring and mutation', async () => {
  const accounts = [
    organizationAuthorization(base, tasks, grants),
    organizationAuthorization({ ...base, accessLevel: 'department_admin' }, [], []),
    organizationAuthorization({ ...base, accessLevel: 'department_admin', fieldCode: 'KT' }, [], []),
    organizationAuthorization({ ...base, accessLevel: 'super_admin', fieldCode: null }, [], []),
  ];
  for (const [index, profile] of accounts.entries()) {
    const service = { verifyToken: async (_token, channel) => { assert.equal(channel, 'admin'); return claims(profile); } };
    const context = createLocalPermissionContext('certifications:review', service, 1);
    const request = method => ({ method, headers: { authorization: 'Bearer verified-token' } });
    if (index < 2) assert.equal((await context(request('GET'))).role, 'reviewer');
    else await assert.rejects(() => context(request('GET')), e => e.statusCode === 403);
    if (index === 0) assert.equal((await context(request('POST'))).role, 'reviewer');
    else await assert.rejects(() => context(request('POST')), e => e.statusCode === 403);
    await assert.rejects(() => createLocalPermissionContext('certifications:review', service, 2)(request('POST')), e => e.statusCode === 403);
  }
});

test('repository rechecks management role, field, revision and task ownership inside the guarded transaction', async () => {
  const writes = [];
  const repository = createOrganizationRepository({ guard() {}, query: async (sql, params) => { writes.push({ sql, params }); return { first: [] }; } });
  const profile = { ...base, accessLevel: 'department_admin' };
  await repository.saveAccount(profile, 'target', 'cv:target', {
    accessLevel: 'specialist', fieldCode: 'DT', displayName: 'Target', active: true, username: 'target', taskIds: [1],
  }, 'password-hash', false);
  assert.match(writes[0].sql, /IF DB_NAME\(\) NOT IN/);
  assert.match(writes[0].sql, /UPDLOCK,HOLDLOCK/);
  assert.match(writes[0].sql, /p.FieldCode=@field/);
  assert.match(writes[0].sql, /TaskId=\? AND FieldCode=@field/);
  assert(!writes[0].sql.includes('password-hash'));
  assert(writes[0].params.includes('password-hash'));
  assert(!organizationPermissionsViewSql.includes('VaiTroRBAC'));assert(!organizationPermissionsViewSql.includes('UNION'));
  assert(!writes[0].sql.includes('DangNhapChuyenVien'));
  assert.match(organizationPermissionsViewSql, /p.AccessLevel='specialist'/);
});
