import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AppError } from '../../src/shared/errors/app-error.js';
import { createLocalPermissionContext } from '../../src/common/auth/index.js';
import { createCertificationsModule, createItCertificationsModule } from '../../src/bootstrap/modules/certifications.module.js';
import { createAcademicLeaveModule } from '../../src/bootstrap/modules/academic-leave.module.js';
import { isolatedApp, listen, headers } from '../support/frontend-areas.js';

const auth = { verifyToken: async (token, channel) => {
  assert.equal(channel, 'admin');
  if (!['specialist', 'department'].includes(token)) throw new AppError('Invalid token', 401);
  return { authMethod: 'password', localUserId: token, identity: { displayName: token },
    organization: { active: true, fieldActive: true, fieldCode: 'DT',
      accessLevel: token === 'department' ? 'department_admin' : 'specialist', taskIds: [1, 2, 3] },
    permissions: ['certifications:review', 'academic-leave:review'] };
} };
const id = '00000000-0000-4000-8000-000000000001';
const version = n => n.toString(16).padStart(16, '0').toUpperCase();

test('both certificate HTTP APIs require intake before acceptance, preserve aliases and keep admin monitoring read-only', async t => {
  for (const [factory, name, key, task] of [
    [createCertificationsModule, 'certifications', 'certificationsModule', 1],
    [createItCertificationsModule, 'it-certifications', 'itCertificationsModule', 2],
  ]) {
    let sequence = 1;
    const row = { Id: id, Status: 'submitted', VersionToken: version(sequence), Files: [], Submissions: [] };
    const module = factory({ config: { r2: {} }, storage: {}, inspectImage: async () => ({}),
      reviewerAuthentication: { actor: createLocalPermissionContext('certifications:review', auth, task) },
      repository: { get: async () => ({ ...row }), review: async input => {
        row.Status = input.decision;row.VersionToken = version(++sequence);return { ...row };
      } } });
    const base = await listen(t, isolatedApp({ [key]: module }));
    const url = base + `/api/admin/${name}/applications/${id}`;
    const review = (decision, token = 'specialist', expected = row.VersionToken) => fetch(url + '/review', {
      method: 'POST', headers: { ...headers(token), 'Content-Type': 'application/json', 'If-Match': expected },
      body: JSON.stringify({ decision, reason: 'Offline review', ...(decision === 'verified' ? { verificationMethod: 'document_comparison' } : {}) }),
    });
    assert.equal((await fetch(url + '/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })).status, 401);
    assert.equal((await review('processing', 'student')).status, 401);
    assert.equal((await review('processing', 'department')).status, 403);
    assert.equal((await fetch(url, { headers: headers('department') })).status, 200);
    assert.equal((await review('verified')).status, 409);
    const intake = await review('processing');assert.equal(intake.status, 200);
    assert.equal((await intake.json()).data.status, 'processing');
    assert.equal((await review('needs_changes')).status, 409);
    assert.equal((await review('verified', 'specialist', version(0))).status, 409);
    const alias = await fetch(base + `/api/${name}/reviewer/applications/${id}`, { headers: headers('specialist') });
    assert.equal((await alias.json()).data.status, 'processing');
    const accepted = await review('verified');assert.equal(accepted.status, 200);
    assert.equal((await accepted.json()).data.status, 'verified');
    assert.equal((await review('rejected')).status, 409);
    for (const checkpoint of ['submitted', 'processing']) {
      row.Status = checkpoint;
      assert.equal((await review('rejected')).status, 200);
    }
  }
});

test('leave HTTP workflow waits for paper without rejection, allows late receipt and concludes only from processing', async t => {
  let sequence = 1;
  const row = { id: 1, requestCode: 'NH1022100011', kind: 'leave', status: 'submitted',
    startSemesterCode: '2610', semesterCount: 1, rowVersion: version(sequence) };
  const module = createAcademicLeaveModule({ clock: () => new Date('2026-02-01T00:00:00Z'),
    reviewerContextProvider: createLocalPermissionContext('academic-leave:review', auth, 3),
    repository: { get: async () => ({ ...row }), review: async (_actor, _id, _version, input) => {
      row.status = input.decision;row.rowVersion = version(++sequence);
      if (input.decision === 'received') { row.receivedAt = '2026-01-01T00:00:00Z';row.paperDeadlineAt = '2026-01-04T00:00:00Z'; }
      return { ...row };
    }, receivePaper: async () => { row.status = 'processing';row.rowVersion = version(++sequence);return { ...row }; } } });
  const base = await listen(t, isolatedApp({ academicLeaveModule: module }));
  const path = '/api/admin/academic-leave/applications/1';
  const post = (suffix, body, token = 'specialist') => fetch(base + path + suffix, { method: 'POST',
    headers: { ...headers(token), 'Content-Type': 'application/json', 'If-Match': row.rowVersion }, body: JSON.stringify(body) });
  const review = decision => post('/review', { decision, note: 'Offline review' });
  assert.equal((await post('/review', { decision: 'received' }, 'department')).status, 403);
  assert.equal((await review('approved')).status, 409);
  const received = await review('received');assert.equal(received.status, 200);
  const waiting = (await received.json()).data;
  assert.equal(waiting.status, 'received');assert.equal(waiting.overdue, true);
  assert.deepEqual(waiting.allowedActions, ['receive_paper']);
  assert.equal((await review('rejected')).status, 409);
  const alias = await fetch(base + '/api/academic-leave/reviewer/applications/1', { headers: headers('department') });
  assert.equal(alias.status, 200);assert.equal((await alias.json()).data.status, 'received');
  const paper = await post('/receive-paper', {});assert.equal(paper.status, 200);
  assert.equal((await paper.json()).data.status, 'processing');
  assert.equal((await post('/receive-paper', {})).status, 409);
  assert.equal((await review('received')).status, 409);
  assert.equal((await review('approved')).status, 200);
  assert.equal(row.paperDeadlineAt, '2026-01-04T00:00:00Z');
  assert.equal((await review('rejected')).status, 409);
  for (const checkpoint of ['submitted', 'processing']) { row.status = checkpoint;assert.equal((await review('rejected')).status, 200); }
});
