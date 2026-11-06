import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createCertificationsService } from '../../../src/common/certifications/services/certifications.service.js';
import { createItCertificationsService } from '../../../src/common/certifications/services/it-certifications.service.js';

const reviewer = { role: 'reviewer', source: 'auth', reference: 'local-user:reviewer' };
const owner = { role: 'student', source: 'auth', reference: 'dut-student:102210001', studentCode: '102210001' };
const row = { Id: '00000000-0000-4000-8000-000000000001', StudentCode: owner.studentCode,
  ActorSource: owner.source, ActorReference: owner.reference, Status: 'submitted', VersionToken: '0000000000000001' };
const unavailableSchool = () => assert.fail('Reading saved local applications must not call school profile/SQL');

test('language certificate queues and details use local snapshots even when old records lack personal fields', async () => {
  for (const snapshot of [{}, { FullName: 'Saved name', ClassName: '21TEST', Cccd: '012345678901' }]) {
    const saved = { ...row, ...snapshot };
    const service = createCertificationsService({ config: {}, studentProfile: unavailableSchool,
      repository: { list: async () => ({ page: 1, pageSize: 20, totalRecords: 1, items: [saved] }), get: async () => saved } });
    for (const actor of [reviewer, owner]) {
      const list = await service.list(actor, {}), detail = await service.get(actor, row.Id);
      assert.equal(list.items[0].studentCode, row.StudentCode);
      assert.equal(list.items[0].cccd, snapshot.Cccd ?? null);
      assert.equal(detail.cccd, snapshot.Cccd ?? null);
      assert.equal(detail.fullName, snapshot.FullName);
    }
    await assert.rejects(() => service.get({ ...owner, reference: 'another-student' }, row.Id), e => e.statusCode === 403);
  }
});

test('IT certificate queues, details and imported records never enrich identity from the school', async () => {
  for (const snapshot of [null, { fullName: 'Saved name', className: '21TEST', cccd: '012345678901' }]) {
    const saved = { ...row, StudentSnapshot: snapshot, Submissions: [] };
    const service = createItCertificationsService({ config: {}, studentProfile: unavailableSchool,
      repository: { list: async () => ({ page: 1, pageSize: 20, totalRecords: 1, items: [saved] }), get: async () => saved,
        records: async () => ({ totalRecords: 1, items: [{ MaHS: row.StudentCode, StudentSnapshot: snapshot }] }) } });
    for (const actor of [reviewer, owner]) {
      const list = await service.list(actor, {}), detail = await service.get(actor, row.Id);
      assert.equal(list.items[0].cccd, snapshot?.cccd ?? null);
      assert.equal(detail.fullName, snapshot?.fullName ?? null);
    }
    const records = await service.records(reviewer, { page: 1, pageSize: 20 });
    assert.equal(records.items[0].cccd, snapshot?.cccd ?? null);
    await assert.rejects(() => service.get({ ...owner, reference: 'another-student' }, row.Id), e => e.statusCode === 403);
  }
});
