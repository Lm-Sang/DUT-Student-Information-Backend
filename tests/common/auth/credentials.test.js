import assert from 'node:assert/strict';
import { test } from 'node:test';
import { validateUsername, validatePassword } from '../../../src/common/auth/rules/credentials.js';
import { parsePasswordLogin, parsePasswordUpdate } from '../../../src/common/auth/dto/auth.request.dto.js';
import { parseOrganizationAccount } from '../../../src/common/auth/rules/organization.js';
import { createOrganizationService } from '../../../src/admin/modules/organization/services/organization.service.js';

test('usernames accept uppercase, Unicode, spaces, punctuation and one-character names', () => {
  for (const username of ['Admin', 'AdminDT', 'ChuyenvienDT01', 'Đào tạo #01', 'a', 'A @ ?']) {
    assert.equal(validateUsername(username), username);
    assert.equal(parsePasswordLogin({ username, password: 'legacy-password' }).username, username.toLowerCase());
  }
  for (const username of ['', '  ', 'a'.repeat(65), 'a\0b', 'a\nb', 'a\u200bb', null])
    assert.throws(() => validateUsername(username), e => e.statusCode === 400);
});

test('passwords require more than eight characters and both letters and digits', () => {
  for (const password of ['abcdefg12', 'Có chữ và số 1', 'A'.repeat(127) + '1'])
    assert.equal(validatePassword(password, 'different-account'), password);
  for (const password of ['abcde123', 'abcdefghijk', '1234567890', 'abcdefg1\0', 'a1'.repeat(65), null])
    assert.throws(() => validatePassword(password), e => e.statusCode === 400);
  for (const password of ['AdminDT01', 'admindt01', ' ADMINdt01 '])
    assert.throws(() => validatePassword(password, 'AdminDT01'), e => e.statusCode === 400);
});

test('creation and password changes use the same policy without restricting existing login passwords', () => {
  const input = { username: 'Đào tạo #01', password: 'abcdefg12', displayName: 'Test', accessLevel: 'specialist', fieldCode: 'DT', permissions: ['work:DonSV01'] };
  assert.equal(parseOrganizationAccount(input).username, input.username);
  assert.throws(() => parseOrganizationAccount({ ...input, password: input.username }), e => e.statusCode === 400);
  assert.equal(parsePasswordUpdate({ currentPassword: 'old', newPassword: 'abcdefg12' }).newPassword, 'abcdefg12');
  assert.throws(() => parsePasswordUpdate({ newPassword: 'letters-only' }, { reset: true }), e => e.statusCode === 400);
  assert.equal(parsePasswordLogin({ username: 'Admin', password: 'old' }).password, 'old');
});

test('editing checks new password against the stored username and never writes invalid credentials', async () => {
  const id = '11111111-1111-4111-8111-111111111111';
  const service = createOrganizationService({
    accounts: async () => [{ accountId: id, username: 'ChuyenvienDT01', accessLevel: 'specialist', fieldCode: 'DT' }],
    saveAccount: () => assert.fail('invalid password must not reach the database'),
  });
  const actor = { authorizationStatus: 'active', organization: { active: true, fieldActive: true, accessLevel: 'department_admin', fieldCode: 'DT' } };
  await assert.rejects(() => service.saveAccount(actor, id, { displayName: 'Test', accessLevel: 'specialist', fieldCode: 'DT', permissions: ['work:DonSV01'], revision: 1, password: 'chuyenvienDT01' }), e => e.statusCode === 400);
});
