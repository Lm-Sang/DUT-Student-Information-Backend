import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createProgressRepository } from '../../../src/admin/modules/organization/repositories/progress.repository.js';

test('local admin progress keeps permission guards and uses the completed IT submission instead of pending upload state', async () => {
  const reads = [];
  const repository = createProgressRepository({ query: async (sql, params) => {
    reads.push({ sql, params });return { first: [{ id: 'local-application', status: 'needs_changes' }] };
  } });
  const actor = { accountId: 'local-admin', revision: 3, fieldCode: 'DT' };
  const task = { id: 2, code: 'it-certifications' };
  const result = await repository.progress(actor, task, 0);
  assert.equal(result.fieldCode, 'DT');assert.equal(result.items[0].status, 'needs_changes');
  assert.deepEqual(reads[0].params, ['local-admin', 3, 2, 'it-certifications', 0]);
  assert.match(reads[0].sql, /p.AccessLevel='department_admin'/);
  assert.match(reads[0].sql, /x.Status='completed'/);
  assert.match(reads[0].sql, /JSON_VALUE\(done.ReviewJson/);
  assert.doesNotMatch(reads[0].sql, /DATA_SV1|DATA_GVien1|PasswordHash|ObjectKey/);
});
