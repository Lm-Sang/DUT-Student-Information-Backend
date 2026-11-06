import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createStudentService } from '../../../src/common/students/services/student.service.js';
import { createStudentRepository } from '../../../src/common/students/repositories/student.repository.js';
import { createStudentApplicationDataService } from '../../../src/common/students/services/student-application-data.service.js';
import { requireStudentInformation } from '../../../src/common/certifications/services/student-information.js';

test('forms keep missing identity empty when the school has no matching student', async () => {
  const service = createStudentService({ repository: { findIdentityRowsByStudentCode: async () => [] } });
  const actor = { role: 'student', studentCode: '102210001', name: 'SSO student' };
  const certificate = await service.getCertificationProfile(actor);
  assert.deepEqual(certificate, { studentCode: actor.studentCode, fullName: actor.name, className: null, cccd: null });
  const application = await service.getApplicationProfile(actor);
  assert.equal(application.cccd, null);assert.equal(application.birthday, null);assert.equal(application.phoneNumber, null);
  const data = createStudentApplicationDataService({ identityService: service,
    academicRepository: { statistics: () => assert.fail('Opening a form must not fetch academic statistics') } });
  assert.deepEqual((await data.prefill(actor)).student, application);
  // Missing authoritative details remain a submission validation error, not a login failure.
  assert.throws(() => requireStudentInformation(certificate), error => error.statusCode === 422 && error.details.code === 'CERT_STUDENT_INFORMATION_REQUIRED');
});

test('complete authenticated profile is preserved and invalid fields are not replaced with invented values', async () => {
  const service = createStudentService({ repository: { findIdentityRowsByStudentCode: () => assert.fail('Unexpected SQL') } });
  const actor = { role: 'student', studentCode: '102210001', name: ' Student ', className: ' 21TEST ',
    cccd: '012345678901', birthday: '2003-01-02', phoneNumber: '0901234567' };
  const profile = await service.getApplicationProfile(actor);
  assert.equal(profile.fullName, 'Student');assert.equal(profile.className, '21TEST');assert.equal(profile.cccd, actor.cccd);
  assert.equal(profile.birthday, actor.birthday);assert.equal(profile.phoneNumber, actor.phoneNumber);
  const emptySchool = createStudentService({ repository: { findIdentityRowsByStudentCode: async () => [] } });
  const missing = await emptySchool.getApplicationProfile({ ...actor, cccd: 'invalid', birthday: '2003-02-31' });
  assert.equal(missing.cccd, null);assert.equal(missing.birthday, null);
  for (const invalid of [{ ...actor, role: 'reviewer' }, { ...actor, studentCode: 'invalid' }]) {
    await assert.rejects(() => service.getCertificationProfile(invalid), error => error.statusCode === 403);
    await assert.rejects(() => service.getApplicationProfile(invalid), error => error.statusCode === 403);
  }
});

test('certificate and application forms supplement missing SSO CCCD from the authenticated student school record', async () => {
  const actor = { role: 'student', studentCode: '102210001', name: 'SSO student' };
  const service = createStudentService({ repository: { findIdentityRowsByStudentCode: async code => {
    assert.equal(code, actor.studentCode);
    return [{ studentCode: code, citizenId: '012345678901' }];
  } } });
  assert.equal((await service.getCertificationProfile(actor)).cccd, '012345678901');
  const profile = await service.getApplicationProfile(actor);
  assert.equal(profile.cccd, '012345678901');
  assert.equal(profile.cccdSource, 'DATA_SV1.dbo.NhanThan.CCCD_So');
  const mismatch = createStudentService({ repository: { findIdentityRowsByStudentCode: async () => [{ studentCode: '102210002', citizenId: '012345678901' }] } });
  await assert.rejects(() => mismatch.getCertificationProfile(actor), error => error.statusCode === 502);
  await assert.rejects(() => mismatch.getApplicationProfile(actor), error => error.statusCode === 502);
  const unavailable = createStudentService({ repository: { findIdentityRowsByStudentCode: async () => { throw new Error('SQL unavailable'); } } });
  await assert.rejects(() => unavailable.getCertificationProfile(actor), error => error.statusCode === 503);
});

test('school identity lookup remains explicit and rejects a record belonging to a different student', async () => {
  let reads = 0;
  const actor = { role: 'student', studentCode: '102210001' };
  const service = createStudentService({ repository: { findIdentityRowsByStudentCode: async code => {
    reads++;return [{ studentCode: code, citizenId: '012345678901' }];
  } } });
  assert.equal((await service.getIdentityForAuthenticatedStudent(actor)).cccd, '012345678901');assert.equal(reads, 1);
  const mismatch = createStudentService({ repository: { findIdentityRowsByStudentCode: async () => [{ studentCode: '102210002' }] } });
  await assert.rejects(() => mismatch.getIdentityForAuthenticatedStudent(actor), error => error.statusCode === 502);
});

test('school identity query uses the student card number instead of the internal profile ID', async () => {
  const rows = [{ studentCode: '102210001', citizenId: '012345678901' }];
  const repository = createStudentRepository({ connect: async (connection, database) => {
    assert.equal(connection, 'secondary');assert.equal(database, 'DATA_SV1');
    return { request: () => ({ input(name, type, value) {
      assert.equal(name, 'studentCode');assert.equal(value, '102210001');
      return { query: async sql => {
        assert.match(sql, /SoThe AS studentCode/);
        assert.match(sql, /WHERE SoThe = @studentCode/);
        assert.doesNotMatch(sql, /WHERE MaHS/);
        return { recordset: rows };
      } };
    } }) };
  } });
  assert.deepEqual(await repository.findIdentityRowsByStudentCode('102210001'), rows);
});

test('school CCCD fallback accepts a valid legacy number and never chooses an ambiguous record', async () => {
  const actor = { role: 'student', studentCode: '102210001' };
  for (const [rows, expected] of [
    [[{ studentCode: actor.studentCode, citizenId: 'invalid', legacyIdentityNumber: '012345678901' }], '012345678901'],
    [[{ studentCode: actor.studentCode, legacyIdentityNumber: '123456789' }], null],
    [[{ studentCode: actor.studentCode, citizenId: '012345678901' }, { studentCode: actor.studentCode, citizenId: '012345678902' }], null],
  ]) {
    const service = createStudentService({ repository: { findIdentityRowsByStudentCode: async () => rows } });
    assert.equal((await service.getCertificationProfile(actor)).cccd, expected);
    assert.equal((await service.getApplicationProfile(actor)).cccd, expected);
  }
});
