import { randomUUID, randomBytes, createHash } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { AppError } from '../../shared/errors/app-error.js';
import { authRepository } from './auth.repository.js';
import { authStore } from './auth.store.js';

function textClaim(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function createAuthService({ config = env, repository = authRepository, store = authStore, now = Date.now } = {}) {
  const key = (kind, channel, value) => `${kind}:${channel}:${createHash('sha256').update(value).digest('hex')}`;
  const stateTtlMs = config.auth.stateTtlMs;
  const handoffTtlMs = config.auth.handoffTtlMs;
  function frontendCallback(channel) {
    const frontend = channel === 'student' ? config.app.studentFrontendUrl : config.app.adminFrontendUrl;
    const callback = channel === 'student' ? config.microsoftSso.studentFrontendCallbackUrl : config.microsoftSso.adminFrontendCallbackUrl;
    if (!callback) return null;
    try {
      const url = new URL(callback);
      if (url.origin !== frontend || url.username || url.password || url.hash || url.search
        || (config.nodeEnv === 'production' && url.protocol !== 'https:')) throw new Error();
      return url;
    } catch {
      throw new AppError('Frontend SSO callback must belong to the configured frontend origin', 503);
    }
  }
  function audience(channel) {
    if (channel === 'student') return config.jwt.studentAudience;
    if (channel === 'admin') return config.jwt.adminAudience;
    throw new AppError('Unknown authentication channel', 400);
  }

  function requireConfig(channel) {
    if (!config.jwt.secret || !config.microsoftSso.jwtSecret) {
      throw new AppError('SSO authentication is not configured', 503);
    }
    if (config.jwt.secret === config.microsoftSso.jwtSecret) {
      throw new AppError('Application and SSO signing keys must be different', 503);
    }
    if (config.nodeEnv === 'production' && (!config.microsoftSso.jwtIssuer || !config.microsoftSso.jwtAudience
      || Buffer.byteLength(config.jwt.secret) < 32 || Buffer.byteLength(config.microsoftSso.jwtSecret) < 32)) {
      throw new AppError('Production SSO requires strong keys, issuer and audience', 503);
    }
    const sso = config.microsoftSso;
    const frontend = channel === 'student' ? config.app.studentFrontendUrl : config.app.adminFrontendUrl;
    const callback = channel === 'student' ? sso.studentCallbackUrl : sso.adminCallbackUrl;
    try {
      const urls = [sso.baseUrl, callback, frontend, config.app.url].map((value) => new URL(value));
      if (urls.some((url) => !['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.hash)
        || urls[1].origin !== urls[3].origin || urls[1].pathname !== `/api/${channel}/auth/microsoft/callback`
        || urls[1].search || urls[2].origin !== frontend
        || [sso.loginPath, sso.logoutPath].some((path) => !path.startsWith('/') || path.startsWith('//') || path.includes('?') || path.includes('#'))
        || (config.nodeEnv === 'production' && urls.some((url) => url.protocol !== 'https:'))) throw new Error();
    } catch {
      throw new AppError('Invalid SSO URLs; callback must match the API origin and production requires HTTPS', 503);
    }
    frontendCallback(channel);
  }

  function loginUrl(channel, state) {
    requireConfig(channel);
    audience(channel);
    const sso = config.microsoftSso;
    const callback = new URL(channel === 'student' ? sso.studentCallbackUrl : sso.adminCallbackUrl);
    // Carry state in callbackUrl using the reference gateway's query contract.
    callback.searchParams.set('state', state);
    const url = new URL(sso.loginPath, sso.baseUrl);
    url.searchParams.set('callbackUrl', callback.href);
    url.searchParams.set('response_mode', 'query');
    return url.href;
  }

  async function exchangeToken(channel, accessToken) {
    requireConfig(channel);
    const targetAudience = audience(channel);
    if (typeof accessToken !== 'string' || !accessToken || accessToken.length > 16384) {
      throw new AppError('Missing or invalid accessToken', 400);
    }
    let claims;
    try {
      claims = jwt.verify(accessToken, config.microsoftSso.jwtSecret, {
        algorithms: ['HS256'],
        ...(config.microsoftSso.jwtIssuer ? { issuer: config.microsoftSso.jwtIssuer } : {}),
        ...(config.microsoftSso.jwtAudience ? { audience: config.microsoftSso.jwtAudience } : {}),
        clockTolerance: 0,
      });
      if (!claims || typeof claims !== 'object' || !Number.isFinite(claims.exp)) throw new Error();
    } catch {
      throw new AppError('Invalid or expired SSO token', 401);
    }
    const microsoftId = textClaim(claims.unique_name);
    if (!microsoftId) throw new AppError('SSO token requires unique_name', 401);
    const identity = {
      id: textClaim(claims.sub) ?? microsoftId.toLowerCase(),
      microsoftId: microsoftId.toLowerCase(),
      displayName: textClaim(claims.name),
      email: textClaim(claims.email),
      provider: 'microsoft-sso',
    };
    const user = await repository.resolveIdentity(identity);
    if (!user) throw new AppError('Account is not allowed to sign in', 403);
    // TODO AUTH-02: Resolve local permissions; never grant Admin from the URL
    // or copy untrusted business roles from SSO claims.
    const sessionId = randomUUID();
    const token = jwt.sign({
      channel, identity, localUserId: user.localUserId,
      roles: user.roles, permissions: user.permissions,
      authorizationStatus: user.authorizationStatus,
    }, config.jwt.secret, {
      algorithm: 'HS256', issuer: config.jwt.issuer, audience: targetAudience,
      subject: identity.id, jwtid: sessionId, expiresIn: config.jwt.expiresIn,
    });
    store.put(key('session', channel, sessionId), { subject: identity.id }, jwt.decode(token).exp * 1000);
    return { token, tokenType: 'Bearer', expiresAt: new Date(jwt.decode(token).exp * 1000).toISOString(), channel, user };
  }

  function verifyToken(token, channel) {
    if (!config.jwt.secret) throw new AppError('Authentication is not configured', 503);
    try {
      const claims = jwt.verify(token, config.jwt.secret, {
        algorithms: ['HS256'], issuer: config.jwt.issuer, audience: audience(channel),
      });
      if (claims.channel !== channel || !claims.sub || !claims.jti || !Number.isFinite(claims.exp)) throw new Error();
      const session = store.get(key('session', channel, claims.jti));
      if (!session || session.subject !== claims.sub) throw new Error();
      return claims;
    } catch {
      throw new AppError('Invalid or expired application token', 401);
    }
  }

  function logoutUrl(channel) {
    audience(channel);
    const url = new URL(config.microsoftSso.logoutPath, config.microsoftSso.baseUrl);
    url.searchParams.set('postLogoutRedirectUri', channel === 'student'
      ? config.app.studentFrontendUrl : config.app.adminFrontendUrl);
    return url.href;
  }

  function startLogin(channel) {
    const state = randomBytes(32).toString('hex');
    const url = loginUrl(channel, state);
    store.put(key('state', channel, state), { channel }, now() + stateTtlMs);
    return { state, url, maxAge: stateTtlMs };
  }

  function consumeState(channel, state) {
    if (!store.consume(key('state', channel, state))) {
      throw new AppError('SSO state expired or already used; start a new login', 401);
    }
  }

  function createHandoff(channel, result) {
    const code = randomBytes(32).toString('hex');
    const binding = randomBytes(32).toString('hex');
    store.put(key('handoff', channel, code), { bindingHash: key('binding', channel, binding), result }, now() + handoffTtlMs);
    const url = frontendCallback(channel);
    if (url) url.hash = new URLSearchParams({ code }).toString();
    return { binding, code, url: url?.href ?? null, maxAge: handoffTtlMs };
  }

  function redeemHandoff(channel, code, binding) {
    if (!/^[a-f0-9]{64}$/.test(code ?? '') || !/^[a-f0-9]{64}$/.test(binding ?? '')) {
      throw new AppError('Invalid login code or browser binding', 401);
    }
    const handoffKey = key('handoff', channel, code);
    const entry = store.get(handoffKey);
    if (!entry || entry.bindingHash !== key('binding', channel, binding)) {
      throw new AppError('Invalid or expired login code', 401);
    }
    const consumed = store.consume(handoffKey);
    if (!consumed) throw new AppError('Login code has already been used', 401);
    verifyToken(consumed.result.token, channel);
    return consumed.result;
  }

  function revokeSession(channel, claims) {
    store.delete(key('session', channel, claims.jti));
  }

  return Object.freeze({ loginUrl, startLogin, consumeState, exchangeToken, verifyToken, logoutUrl,
    createHandoff, redeemHandoff, revokeSession });
}

export const authService = createAuthService();
