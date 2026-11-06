/**
 * @typedef {Object} SsoIdentityDto
 * @property {string} id
 * @property {string} microsoftId
 * @property {string | null} displayName
 * @property {string | null} email
 * @property {string} provider
 */

/**
 * @typedef {SsoIdentityDto & {
 *   localUserId: string | number | null,
 *   roles: string[], permissions: string[], authorizationStatus: string
 * }} AuthUserDto
 */

/**
 * @typedef {Object} AuthSessionDto
 * @property {string} token
 * @property {string} tokenType
 * @property {string} expiresAt
 * @property {string} channel
 * @property {AuthUserDto} user
 */

/**
 * @param {{ token: string, expiresAt: string, channel: string, user: AuthUserDto }} data
 * @returns {AuthSessionDto}
 */
export function createAuthSessionDto({ token, expiresAt, channel, user }) {
  return { token, tokenType: 'Bearer', expiresAt, channel, user };
}

/**
 * @param {string} channel
 * @param {AuthUserDto} user
 */
export function createAuthMeDto(channel, user) {
  return { channel, user };
}

/**
 * @param {{ code: string, maxAge: number }} handoff
 * @param {string} channel
 */
export function createAuthHandoffDto(handoff, channel) {
  return { code: handoff.code, channel, expiresIn: handoff.maxAge / 1000, frontendCallbackConfigured: false };
}

/** @param {string} url */
export function createAuthLogoutDto(url) {
  return { url, clearLocalToken: true };
}
