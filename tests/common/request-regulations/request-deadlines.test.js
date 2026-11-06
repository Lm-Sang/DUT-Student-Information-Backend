import assert from 'node:assert/strict';
import { test } from 'node:test';
import { requestDeadlines } from '../../../src/common/request-regulations/index.js';
import { applicationView } from '../../../src/common/academic-leave/rules/academic-leave.rules.js';
import { applicationDto, listDto } from '../../../src/common/certifications/mappers/certifications.mapper.js';
import { itApplicationDto, itListDto } from '../../../src/common/certifications/mappers/it-certifications.mapper.js';

const submittedAt = '2026-11-01T08:00:00Z';
const rules = (extra, now) => requestDeadlines({ kind: 'certificate', status: 'submitted', submittedAt, ...extra }, new Date(now));

test('certificate intake has a strict one-day boundary and handles SQL UTC dates', () => {
  assert.equal(rules({}, '2026-11-02T08:00:00Z').overdue, false);
  const late = rules({ submittedAt: '2026-11-01T08:00:00' }, '2026-11-02T08:00:00.001Z');
  assert.equal(late.deadlineStatus, 'overdue');
  assert.deepEqual(late.overdueTags, ['intake']);
});

test('certificate processing lasts 13 days and overall result is capped at 14 days', () => {
  const extra = { status: 'processing', receivedAt: '2026-11-02T08:00:00Z' };
  assert.equal(rules(extra, '2026-11-15T08:00:00Z').overdue, false);
  assert.deepEqual(rules(extra, '2026-11-15T08:00:00.001Z').overdueTags, ['processing', 'result']);
  assert.deepEqual(rules({ ...extra, receivedAt: '2026-11-05T08:00:00Z' }, '2026-11-16T08:00:00Z').overdueTags, ['result']);
  assert.deepEqual(rules({}, '2026-11-16T08:00:00Z').overdueTags, ['intake', 'result']);
});

test('leave, extension and return share intake and five-day processing from paper receipt', () => {
  for (const kind of ['leave', 'extension', 'return']) {
    const row = { kind, status: 'submitted', startSemesterCode: '2610', semesterCount: kind === 'return' ? 0 : 1,
      studentConfirmedAt: submittedAt, receivedAt: '2026-11-02T08:00:00Z', paperReceivedAt: '2026-11-10T08:00:00Z' };
    assert.deepEqual(applicationView(row, new Date('2026-11-03T08:00:00Z')).overdueTags, ['intake']);
    row.status = 'processing';
    assert.equal(applicationView(row, new Date('2026-11-15T08:00:00Z')).overdue, false);
    const late = applicationView(row, new Date('2026-11-15T08:00:00.001Z'));
    assert.deepEqual(late.overdueTags, ['processing']);
    assert.deepEqual(late.allowedActions, ['approved', 'rejected']);
    row.status = 'received';row.paperDeadlineAt = '2026-11-05T08:00:00Z';
    assert.deepEqual(applicationView(row, new Date('2026-11-10T08:00:00Z')).overdueTags, ['paper_submission']);
  }
});

test('completed, editable and missing-timestamp records do not become overdue; resubmission resets deadlines', () => {
  for (const status of ['draft', 'uploading', 'checking', 'needs_changes', 'verified', 'approved', 'rejected', 'cancelled']) {
    assert.equal(rules({ status }, '2026-12-01T00:00:00Z').overdue, false);
  }
  assert.equal(rules({ submittedAt: null }, '2026-12-01T00:00:00Z').overdue, false);
  assert.equal(rules({ submittedAt: '2026-11-20T08:00:00Z' }, '2026-11-21T08:00:00Z').overdue, false);
});

test('both certificate list and detail contracts agree and preserve workflow actions', () => {
  const now = new Date('2026-11-16T08:00:00Z');
  const row = { Id: 'abc', Status: 'processing', SubmittedAt: submittedAt, ReviewedAt: '2026-11-02T08:00:00Z' };
  const expected = applicationDto(row, now);
  const listed = listDto({ items: [row], page: 1, pageSize: 20, totalRecords: 1 }, now).items[0];
  const it = itApplicationDto({ ...row, CurrentSubmissionId: 'def', Submissions: [{ Id: 'def', SubmittedAt: submittedAt,
    Review: { ReviewedAt: row.ReviewedAt } }] }, now);
  const itListed = itListDto({ items: [row], page: 1, pageSize: 20, totalRecords: 1 }, now).items[0];
  for (const dto of [expected, listed, it, itListed]) {
    assert.equal(dto.status, 'processing');
    assert.equal(dto.deadlineStatus, 'overdue');
    assert.deepEqual(dto.overdueTags, ['processing', 'result']);
    assert.deepEqual(dto.deadlines, expected.deadlines);
  }
  assert.deepEqual(it.allowedActions, ['verified', 'rejected']);
});
