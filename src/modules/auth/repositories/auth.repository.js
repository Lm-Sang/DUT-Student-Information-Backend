// TODO AUTH-01: Map verified SSO identities to local student/staff accounts.
// Do not read or write Course Registration sessions.
export const authRepository = Object.freeze({
  async resolveIdentity(identity) {
    return { ...identity, localUserId: null, roles: [], permissions: [], authorizationStatus: 'pending' };
  },
});
