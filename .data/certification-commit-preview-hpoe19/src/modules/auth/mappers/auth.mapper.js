function textClaim(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/**
 * Map only verified SSO claims. Signature/expiry/issuer/audience checks belong
 * to the auth service and must happen before calling this mapper.
 * @returns {import('../dto/auth.response.dto.js').SsoIdentityDto | null}
 */
export function toSsoIdentityDto(claims) {
  const microsoftId = textClaim(claims.unique_name);
  if (!microsoftId) return null;
  return {
    id: textClaim(claims.sub) ?? microsoftId.toLowerCase(),
    microsoftId: microsoftId.toLowerCase(),
    displayName: textClaim(claims.name),
    email: textClaim(claims.email),
    provider: 'microsoft-sso',
  };
}

/** @returns {import('../dto/auth.response.dto.js').AuthUserDto} */
export function toAuthUserDto(claims) {
  const { identity, localUserId, roles, permissions, authorizationStatus } = claims;
  return {
    id: identity?.id,
    microsoftId: identity?.microsoftId,
    displayName: identity?.displayName,
    email: identity?.email,
    provider: identity?.provider,
    localUserId, roles, permissions, authorizationStatus,
  };
}
