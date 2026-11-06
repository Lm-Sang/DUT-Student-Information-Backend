import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createAcademicLeaveService } from '../../../src/common/academic-leave/services/academic-leave.service.js';

test('reviewers read academic-leave applications and history from saved local data without school access', async () => {
  const actor = { role: 'reviewer', source: 'auth', reference: 'local-user:reviewer' };
  const row = { id: 1, kind: 'leave', status: 'submitted', startSemesterCode: '2610', semesterCount: 1,
    snapshot: { student: { fullName: 'Saved student', cccd: '012345678901' }, academicRows: [] } };
  const localHistory = { items: [{ action: 'confirmed', status: 'submitted' }], totalRecords: 1 };
  const noSchool = () => assert.fail('Saved local application reads must not access student profile or school semester/statistics');
  const service = createAcademicLeaveService({ snapshotProvider: noSchool, prefillProvider: noSchool,
    repository: { get: async () => row, list: async () => ({ items: [row], totalRecords: 1 }), history: async () => localHistory,
      currentSemesterCode: noSchool } });
  assert.deepEqual((await service.get(actor, 1)).snapshot, row.snapshot);
  assert.deepEqual((await service.list(actor, {})).items[0].snapshot, row.snapshot);
  assert.deepEqual(await service.applicationHistory(actor, 1, {}), localHistory);
});
