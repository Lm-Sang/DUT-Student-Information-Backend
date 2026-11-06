import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { test } from 'node:test';
import { parseList, parseReview } from '../../../src/common/certifications/dto/certifications.request.dto.js';
import { list as leaveList, review as leaveReview } from '../../../src/common/academic-leave/dto/academic-leave.request.dto.js';

// The local test frontend is optional and is not a backend runtime dependency.
const webRoot = new URL('../../../../DUT-Student-Information-Frontend/public/modules/hoc-vu/', import.meta.url);
const options = { skip: !existsSync(new URL('workflow.js', webRoot)) };

test('local frontend filters and offered review actions satisfy the real backend DTO contracts', options, async () => {
  const workflow = await import(new URL('workflow.js', webRoot));
  for (const status of workflow.certificateStatuses) assert.equal(parseList({ status }).status, status);
  for (const status of workflow.academicLeaveStatuses) assert.equal(leaveList({ status }).status, status);
  for (const status of workflow.certificateStatuses) {
    for (const decision of workflow.actions({ status })) assert.equal(parseReview({ decision,
      reason: 'Reviewed locally', verificationMethod: 'document_comparison' }).decision, decision);
  }
  for (const status of workflow.academicLeaveStatuses) {
    for (const decision of workflow.actions({ kind: 'leave', status })) {
      if (decision !== 'receive_paper') assert.equal(leaveReview({ decision, note: 'Reviewed locally' }).decision, decision);
      else assert.equal(status, 'received');
    }
  }
  assert.deepEqual(workflow.actions({ kind: 'leave', status: 'received', overdue: true }), ['receive_paper']);
  assert.deepEqual(workflow.actions({ kind: 'leave', status: 'approved' }), []);
});

test('IT reviewer displays submitted local evidence while students can continue editing a pending supplement', options, async () => {
  const { certificateView } = await import(new URL('certificate-view.js', webRoot));
  const application = { status: 'needs_changes', currentSubmission: { data: { MaCC: 'OLD' }, files: [{ id: 'submitted-evidence' }] },
    pendingSubmission: { data: { MaCC: 'NEW' }, files: [{ id: 'pending-evidence' }] } };
  assert.equal(certificateView(application, true).data.MaCC, 'NEW');
  const reviewer = certificateView(application, true, [], { submittedOnly: true });
  assert.equal(reviewer.data.MaCC, 'OLD');
  assert.equal(reviewer.files[0].id, 'submitted-evidence');
});
