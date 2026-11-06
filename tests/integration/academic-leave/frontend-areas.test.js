import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AppError } from '../../../src/shared/errors/app-error.js';
import { isolatedApp, listen, studentContext, reviewerContext, headers } from '../../support/frontend-areas.js';
import { createAcademicLeaveModule } from '../../../src/bootstrap/modules/academic-leave.module.js';

test('academic-leave aliases retain request parsing and expose mutations only to their owning frontend', async t => {
  const reads = [];
  const module = createAcademicLeaveModule({
    studentContextProvider: studentContext, reviewerContextProvider: reviewerContext,
    snapshotProvider: async () => ({}), prefillProvider: async () => ({}), renderPdf: async () => Buffer.from('pdf'),
    repository: { list: async (actor, query) => { reads.push({ actor, query }); return { items: [], totalRecords: 0 }; } },
  });
  const base = await listen(t, isolatedApp({ academicLeaveModule: module }));
  for (const [path, token] of [
    ['/api/student/academic-leave/applications', 'student'],
    ['/api/academic-leave/applications', 'student'],
    ['/api/admin/academic-leave/applications', 'reviewer'],
    ['/api/academic-leave/reviewer/applications', 'reviewer'],
  ]) {
    assert.equal((await fetch(base + path)).status, 401);
    assert.equal((await fetch(base + path, { headers: headers(token === 'student' ? 'reviewer' : 'student') })).status, 401);
    const response = await fetch(base + path, { headers: headers(token) });
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).data.items, []);
  }
  assert.equal(reads.length, 4);
  const invalidDraft = await fetch(base + '/api/student/academic-leave/applications', {
    method: 'POST', headers: { ...headers('student'), 'Content-Type': 'application/json' }, body: '{}',
  });
  assert.equal(invalidDraft.status, 400);
  assert.equal((await fetch(base + '/api/admin/academic-leave/applications', {
    method: 'POST', headers: { ...headers('reviewer'), 'Content-Type': 'application/json' }, body: '{}',
  })).status, 404);
  assert.equal((await fetch(base + '/api/student/academic-leave/applications/1/review', {
    method: 'POST', headers: { ...headers('student'), 'Content-Type': 'application/json' }, body: '{}',
  })).status, 404);
  for (const prefix of ['/api/admin/academic-leave', '/api/academic-leave/reviewer']) {
    const response = await fetch(base + prefix + '/applications/1/review', {
      method: 'POST', headers: { ...headers('reviewer'), 'Content-Type': 'application/json' }, body: '{}',
    });
    assert.equal(response.status, 428, 'review still requires the original If-Match concurrency contract');
  }
});
