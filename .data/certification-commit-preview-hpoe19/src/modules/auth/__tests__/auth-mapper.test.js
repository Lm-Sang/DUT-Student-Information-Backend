import assert from 'node:assert/strict';
import { test } from 'node:test';

import { toSsoIdentityDto, toAuthUserDto } from '../mappers/auth.mapper.js';

test('auth mappers allowlist identity fields and do not grant roles from SSO claims', () => {
  const identity = toSsoIdentityDto({
    unique_name: ' STUDENT@DUT.UDN.VN ', name: ' Student ', role: 'Admin',
    permissions: ['all'], accessToken: 'must not escape into identity',
  });
  assert.equal(identity.id, 'student@dut.udn.vn');
  assert.equal(identity.microsoftId, 'student@dut.udn.vn');
  assert.equal(identity.displayName, 'Student');
  assert.equal(toSsoIdentityDto({ unique_name: ' ' }), null);
  assert.ok(!Object.hasOwn(identity, 'role'));
  assert.ok(!Object.hasOwn(identity, 'permissions'));
  assert.ok(!Object.hasOwn(identity, 'accessToken'));
  const dto = toAuthUserDto({
    identity: { ...identity, internalSecret: 'private' }, jti: 'session-id',
    localUserId: null, roles: [], permissions: [], authorizationStatus: 'pending',
  });
  assert.deepEqual(dto.roles, []);
  assert.equal(dto.authorizationStatus, 'pending');
  assert.ok(!Object.hasOwn(dto, 'internalSecret'));
  assert.ok(!Object.hasOwn(dto, 'jti'));
});
