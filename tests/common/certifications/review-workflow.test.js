import assert from 'node:assert/strict';
import { test } from 'node:test';
import { certificationReviewActions } from '../../../src/common/certifications/rules/certifications.rules.js';
import { academicLeaveReviewActions, applicationView, validatePeriod } from '../../../src/common/academic-leave/rules/academic-leave.rules.js';
import { createCertificationsService } from '../../../src/common/certifications/services/certifications.service.js';
import { createItCertificationsService } from '../../../src/common/certifications/services/it-certifications.service.js';
import { createAcademicLeaveService } from '../../../src/common/academic-leave/services/academic-leave.service.js';
import { parseReview } from '../../../src/common/certifications/dto/certifications.request.dto.js';
import { review as leaveReview } from '../../../src/common/academic-leave/dto/academic-leave.request.dto.js';

const reviewer = { role: 'reviewer', source: 'auth', reference: 'local-user:reviewer' };
const version = '0000000000000001';

test('intake needs no invented verification result while rejection and final certificate verification validate their evidence', () => {
  assert.equal(parseReview({ decision: 'processing' }).verificationMethod, null);
  assert.equal(leaveReview({ decision: 'received' }).note, '');
  assert.throws(() => parseReview({ decision: 'verified' }), e => e.statusCode === 400);
  assert.throws(() => parseReview({ decision: 'rejected' }), e => e.statusCode === 400);
  assert.throws(() => leaveReview({ decision: 'rejected' }), e => e.statusCode === 400);
  assert.throws(() => leaveReview({ decision: 'received', receivedAt: '2026-01-01' }), e => e.statusCode === 400);
});

test('certificate intake starts processing and rejection is allowed only at online review or final processing review', async () => {
  assert.deepEqual(certificationReviewActions('submitted'), ['processing', 'rejected', 'needs_changes']);
  assert.deepEqual(certificationReviewActions('processing'), ['verified', 'rejected']);
  for (const factory of [createCertificationsService, createItCertificationsService]) {
    for (const status of ['uploading', 'checking', 'submitted', 'processing', 'needs_changes', 'verified', 'rejected']) {
      for (const decision of ['processing', 'verified', 'rejected', 'needs_changes']) {
        let writes = 0;
        const service = factory({ config: {}, repository: {
          get: async () => ({ Id: '00000000-0000-4000-8000-000000000001', Status: status, VersionToken: version }),
          review: async () => { writes++;return { Id: '00000000-0000-4000-8000-000000000001', Status: decision }; },
        } });
        const call = () => service.review(reviewer, 'id', version, { decision, reason: 'Reviewed' });
        if (certificationReviewActions(status).includes(decision)) { await call();assert.equal(writes, 1); }
        else { await assert.rejects(call, e => e.statusCode === 409);assert.equal(writes, 0); }
        const before = writes;
        await assert.rejects(() => service.review(reviewer, 'id', '0000000000000000', { decision }), e => e.statusCode === 409);
        await assert.rejects(() => service.review({ role: 'student' }, 'id', version, { decision }), e => e.statusCode === 403);
        assert.equal(writes, before);
      }
    }
  }
});

test('leave waiting for paper cannot be rejected; receive-paper remains possible after the three day marker', async () => {
  assert.deepEqual(academicLeaveReviewActions('submitted'), ['received', 'rejected', 'needs_changes']);
  assert.deepEqual(academicLeaveReviewActions('received'), []);
  assert.deepEqual(academicLeaveReviewActions('processing'), ['approved', 'rejected']);
  for (const status of ['draft', 'submitted', 'received', 'processing', 'approved', 'rejected', 'needs_changes', 'cancelled']) {
    let paperWrites = 0;
    const row = { id: 1, kind: 'leave', status, startSemesterCode: '2610', semesterCount: 1,
      rowVersion: version, paperDeadlineAt: '2026-01-04T00:00:00Z' };
    const service = createAcademicLeaveService({ clock: () => new Date('2026-02-01T00:00:00Z'), repository: {
      get: async () => row,
      review: async (_actor, _id, _version, input) => ({ ...row, status: input.decision }),
      receivePaper: async () => { paperWrites++;return { ...row, status: 'processing' }; },
    } });
    for (const decision of ['received', 'approved', 'rejected', 'needs_changes']) {
      const call = () => service.review(reviewer, 1, version, { decision, note: 'Reviewed' });
      if (academicLeaveReviewActions(status).includes(decision)) assert.equal((await call()).status, decision);
      else await assert.rejects(call, e => e.statusCode === 409);
    }
    if (status === 'received') {
      assert.equal((await service.receivePaper(reviewer, 1, version)).status, 'processing');
      const view = applicationView(row, new Date('2026-02-01T00:00:00Z'));
      assert.equal(view.status, 'received');assert.equal(view.overdue, true);
      assert.deepEqual(view.allowedActions, ['receive_paper']);
    } else await assert.rejects(() => service.receivePaper(reviewer, 1, version), e => e.statusCode === 409);
    assert.equal(paperWrites, status === 'received' ? 1 : 0);
    await assert.rejects(() => service.review(reviewer, 1, '0000000000000000', { decision: 'rejected' }), e => e.statusCode === 409);
  }
});

test('only finally approved leave can be used as the parent of an extension or return', () => {
  const input = { kind: 'extension', startSemesterCode: '2620', semesterCount: 1, reasonCode: 'medical' };
  for (const status of ['received', 'processing', 'approved']) {
    const parent = { kind: 'leave', status, startSemesterCode: '2610', semesterCount: 1 };
    if (status === 'approved') assert.doesNotThrow(() => validatePeriod(input, '2620', parent));
    else assert.throws(() => validatePeriod(input, '2620', parent), e => e.statusCode === 409);
  }
});
