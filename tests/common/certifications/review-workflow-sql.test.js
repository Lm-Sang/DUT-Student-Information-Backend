import assert from 'node:assert/strict';
import { test } from 'node:test';
import { upgradeReviewWorkflow } from '../../../scripts/database/review-workflow-db.mjs';
import { createCertificationsRepository } from '../../../src/common/certifications/repositories/certifications.repository.js';
import { createItCertificationsRepository } from '../../../src/common/certifications/repositories/it-certifications.repository.js';
import { createAcademicLeaveRepository } from '../../../src/common/academic-leave/repositories/academic-leave.repository.js';

test('local migration is guarded before any query and converts legacy leave meanings once inside a rollback-capable batch', async () => {
  let calls = 0, sql;
  await assert.rejects(() => upgradeReviewWorkflow({ guard: () => { throw new Error('Wrong target'); },
    query: async () => { calls++; } }), /Wrong target/);
  assert.equal(calls, 0);
  await upgradeReviewWorkflow({ guard() {}, query: async statement => { calls++;sql = statement; } });
  assert.equal(calls, 1);
  assert.match(sql, /IF DB_NAME\(\) NOT IN/);
  assert.match(sql, /BEGIN TRANSACTION/);assert.match(sql, /ROLLBACK TRANSACTION/);
  assert.match(sql, /sys\.extended_properties[\s\S]*ReviewWorkflowVersion/);
  assert.match(sql, /WHEN ''approved'' THEN ''received'' ELSE ''processing''/);
  assert.match(sql, /workflow_upgraded/);
  assert.doesNotMatch(sql, /DROP TABLE|DELETE FROM|DATA_SV1|DATA_GVien1/i);
});

test('both certificate repositories recheck phase, decision and version inside the local review transaction', async () => {
  for (const create of [createCertificationsRepository, createItCertificationsRepository]) {
    const reads = [], transactions = [];
    const repository = create({ databaseName: 'sv_dut', databaseHost: 'localhost',
      query: async sql => { reads.push(sql);return { first: [{ Json: 'null' }] }; },
      transaction: async sql => { transactions.push(sql);return { first: [{ Json: 'null' }] }; } });
    await repository.review({ actor: { role: 'reviewer' }, decision: 'processing', expected: '0000000000000001' });
    assert.equal(reads.length, 0);assert.equal(transactions.length, 1);
    assert.match(transactions[0], /@status='submitted'[\s\S]*IN\('processing','rejected','needs_changes'\)/);
    assert.match(transactions[0], /@status='processing'[\s\S]*IN\('verified','rejected'\)/);
    assert.match(transactions[0], /\$\.expected/);
  }
});

test('leave transactions keep the original intake marker, allow late paper and block another open application', async () => {
  const statements = [];
  const repository = createAcademicLeaveRepository({ query: async () => assert.fail('Review must use a transaction'),
    transaction: async (sql, params) => { statements.push({ sql, input: JSON.parse(params[0]) });return { first: [{ Json: 'null' }] }; } });
  const actor = { role: 'reviewer' };
  await repository.review(actor, 1, '0000000000000001', { decision: 'received' });
  assert.match(statements[0].sql, /DATEADD\(day,3,@now\) ELSE PaperDeadlineAt/);
  assert.match(statements[0].sql, /@status='processing'[\s\S]*IN\('approved','rejected'\)/);
  assert.match(statements[0].sql, /ApplicationHistory/);
  await repository.receivePaper(actor, 1, '0000000000000002');
  assert.match(statements[1].sql, /IF @status<>'received'/);
  assert.match(statements[1].sql, /Status='processing'/);
  assert.doesNotMatch(statements[1].sql, /PaperDeadlineAt\s*<|AL_LATE/);
  await repository.save({ role: 'student', studentCode: '102210001' }, {});
  assert.match(statements[2].sql, /Status IN\('draft','submitted','needs_changes','received','processing'\)/);
  assert.match(statements[2].sql, /sp_getapplock/);
});
