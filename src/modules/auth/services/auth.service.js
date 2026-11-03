import { randomUUID, randomBytes, createHash, hkdfSync, createCipheriv, createDecipheriv } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../../config/env.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { authRepository } from '../repositories/auth.repository.js';
import { authStore } from '../stores/auth.store.js';
import { parseSsoAccessToken, parsePasswordLogin } from '../dto/auth.request.dto.js';
import { createAuthSessionDto } from '../dto/auth.response.dto.js';
import { toSsoIdentityDto } from '../mappers/auth.mapper.js';
import { verifyPassword } from './password.service.js';

const digest = value => createHash('sha256').update(value).digest('hex');
const failToken = () => new AppError('Invalid or expired application token', 401);
const failSso = () => new AppError('DUT SSO sign-in is required for this operation', 401, { code: 'SSO_REAUTH_REQUIRED' });

export function createAuthService({ config = env, repository = authRepository, store = authStore, now = Date.now } = {}) {
  const key = (kind, channel, value) => `${kind}:${channel}:${digest(value)}`;
  const seconds = () => Math.floor(now() / 1000);
  const duration = /^(\d+)(s|m|h)?$/.exec(String(config.jwt.expiresIn));
  const accessTtl = duration ? Number(duration[1]) * ({ s: 1, m: 60, h: 3600 }[duration[2]] ?? 1) : NaN;

  function audience(channel) {
    if (channel === 'student') return config.jwt.studentAudience;
    if (channel === 'admin') return config.jwt.adminAudience;
    if (channel === 'staff') return config.jwt.staffAudience;
    throw new AppError('Unknown authentication channel', 400);
  }

  function requireAppConfig(channel) {
    const aud = audience(channel);
    const signingKey = appKey();
    const audiences = [config.jwt.studentAudience, config.jwt.adminAudience, config.jwt.staffAudience].filter(Boolean);
    if (signingKey.length < 32 || !config.jwt.issuer || !aud
      || config.jwt.issuer === config.microsoftSso?.jwtIssuer
      || new Set(audiences).size !== audiences.length
      || !Number.isInteger(accessTtl) || accessTtl < 1 || accessTtl > 3600) {
      throw new AppError('Application authentication requires a strong key, distinct audiences and an access lifetime of at most one hour', 503);
    }
  }

  function appKey() {
    if (config.jwt.shareSsoKey === true) return ssoKey();
    return Buffer.from(config.jwt.secret || '');
  }

  function ssoKey() {
    const sso = config.microsoftSso;
    if (!sso.jwtSecret || !sso.jwtIssuer || (!sso.jwtAudience && !sso.allowMissingAudience)) {
      throw new AppError('Configure SSO key, issuer and audience policy', 503);
    }
    const encoding = sso.jwtSecretEncoding ?? 'utf8';
    if (!['utf8', 'base64'].includes(encoding)
      || (encoding === 'base64' && !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(sso.jwtSecret))) {
      throw new AppError('Invalid SSO key encoding configuration', 503);
    }
    const secret = Buffer.from(sso.jwtSecret, encoding);
    if (!secret.length || (config.jwt.shareSsoKey !== true && secret.equals(Buffer.from(config.jwt.secret || '')))
      || (config.nodeEnv === 'production' && secret.length < 32)) {
      throw new AppError('SSO signing key is missing, weak or incompatible with the configured key policy', 503);
    }
    return secret;
  }

  function verifySsoToken(accessToken) {
    const secret = ssoKey();
    accessToken = parseSsoAccessToken(accessToken);
    try {
      const claims = jwt.verify(accessToken, secret, {
        algorithms: ['HS256'], issuer: config.microsoftSso.jwtIssuer,
        ...(config.microsoftSso.jwtAudience ? { audience: config.microsoftSso.jwtAudience } : {}),
        clockTimestamp: seconds(), clockTolerance: 0,
      });
      if (!claims || typeof claims !== 'object' || !Number.isInteger(claims.exp)
        || (!config.microsoftSso.jwtAudience && claims.aud !== undefined && claims.aud !== null)) throw new Error();
      const identity = toSsoIdentityDto(claims);
      if (!identity || identity.id.length > 256 || identity.microsoftId.length > 256) throw new Error();
      return { identity, expiresAt: claims.exp * 1000 };
    } catch { throw new AppError('Invalid or expired SSO token', 401); }
  }

  function frontendCallback(channel) {
    const frontend = channel === 'student' ? config.app.studentFrontendUrl : config.app.adminFrontendUrl;
    const callback = channel === 'student' ? config.microsoftSso.studentFrontendCallbackUrl : config.microsoftSso.adminFrontendCallbackUrl;
    if (!callback) return null;
    try {
      const url = new URL(callback);
      if (url.origin !== frontend || url.username || url.password || url.hash || url.search
        || (config.nodeEnv === 'production' && url.protocol !== 'https:')) throw new Error();
      return url;
    } catch { throw new AppError('Frontend SSO callback must belong to the configured frontend origin', 503); }
  }

  function requireSsoConfig(channel) {
    requireAppConfig(channel);
    ssoKey();
    // SSO identifies school users; an admin URL must never grant staff privileges.
    if (channel !== 'student') throw new AppError('SSO does not grant local administrative access', 403);
    const sso = config.microsoftSso;
    const frontend = channel === 'student' ? config.app.studentFrontendUrl : config.app.adminFrontendUrl;
    const callback = channel === 'student' ? sso.studentCallbackUrl : sso.adminCallbackUrl;
    try {
      const urls = [sso.baseUrl, callback, frontend, config.app.url].map(value => new URL(value));
      if (urls.some(url => !['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.hash)
        || urls[1].origin !== urls[3].origin || urls[1].pathname !== `/api/${channel}/auth/microsoft/callback`
        || urls[1].search || urls[2].origin !== frontend
        || [sso.loginPath, sso.logoutPath].some(path => !path.startsWith('/') || path.startsWith('//') || path.includes('?') || path.includes('#'))
        || (config.nodeEnv === 'production' && urls.some(url => url.protocol !== 'https:'))) throw new Error();
    } catch { throw new AppError('Invalid SSO URLs; production requires HTTPS and callbacks on the API origin', 503); }
    frontendCallback(channel);
  }

  function encryptionKey() {
    return Buffer.from(hkdfSync('sha256', appKey(), 'dut-auth', 'upstream-token-v1', 32));
  }

  function encrypt(token, binding) {
    const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
    cipher.setAAD(Buffer.from(binding));
    const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
    return [iv, cipher.getAuthTag(), encrypted].map(buffer => buffer.toString('base64url')).join('.');
  }

  function decrypt(value, binding) {
    try {
      const [iv, tag, encrypted] = value.split('.').map(part => Buffer.from(part, 'base64url'));
      const cipher = createDecipheriv('aes-256-gcm', encryptionKey(), iv);
      cipher.setAAD(Buffer.from(binding)); cipher.setAuthTag(tag);
      return Buffer.concat([cipher.update(encrypted), cipher.final()]).toString('utf8');
    } catch { throw failSso(); }
  }

  function localUser(account) {
    return {
      id: account.id, localUserId: account.id, username: account.username,
      microsoftId: null, displayName: account.displayName, email: null, provider: 'local',
      roles: account.roles, permissions: account.permissions, authorizationStatus: 'active',
      requestActorId: account.requestActorId ?? null,
    };
  }

  function signToken(session, use) {
    const expires = use === 'access' ? Math.min(seconds() + accessTtl, Math.floor(session.expiresAt / 1000)) : Math.floor(session.expiresAt / 1000);
    return jwt.sign({ tokenUse: use, sid: session.id, authMethod: session.authMethod,
      channel: session.channel, iat: seconds(), exp: expires }, appKey(), {
      algorithm: 'HS256', issuer: config.jwt.issuer, audience: audience(session.channel),
      subject: session.subject, jwtid: randomUUID(), header: { typ: use === 'access' ? 'at+jwt' : 'refresh+jwt' },
    });
  }

  function bundle(session) {
    const accessToken = signToken(session, 'access'), refreshToken = signToken(session, 'refresh');
    return {
      data: createAuthSessionDto({ token: accessToken, expiresAt: new Date(jwt.decode(accessToken).exp * 1000).toISOString(),
        channel: session.channel, user: session.user, authMethod: session.authMethod,
        ssoExpiresAt: session.ssoExpiresAt ? new Date(session.ssoExpiresAt).toISOString() : null,
        ssoAvailable: session.authMethod === 'sso' && session.ssoExpiresAt > now(),
        refreshExpiresAt: new Date(session.expiresAt).toISOString() }),
      refreshToken, maxAge: session.expiresAt - now(),
    };
  }

  function issueSession(channel, pending) {
    requireAppConfig(channel);
    const session = { ...pending, id: randomUUID(), channel, expiresAt: now() + (config.auth.refreshTtlSeconds ?? 604800) * 1000 };
    const result = bundle(session);
    store.createSession(session, digest(result.refreshToken));
    return result;
  }

  function verifyJwt(token, channel, use) {
    requireAppConfig(channel);
    try {
      if (typeof token !== 'string' || token.length > 8192) throw new Error();
      const { header, payload } = jwt.verify(token, appKey(), {
        complete: true, algorithms: ['HS256'], issuer: config.jwt.issuer, audience: audience(channel),
        clockTimestamp: seconds(), clockTolerance: 0,
      });
      if (header.typ !== (use === 'access' ? 'at+jwt' : 'refresh+jwt') || payload.tokenUse !== use
        || payload.channel !== channel || !['sso', 'password'].includes(payload.authMethod)
        || typeof payload.sid !== 'string' || !/^[a-f0-9-]{36}$/.test(payload.sid)
        || typeof payload.sub !== 'string' || !payload.sub || typeof payload.jti !== 'string'
        || !Number.isInteger(payload.exp) || !Number.isInteger(payload.iat) || payload.iat > seconds()) throw new Error();
      return payload;
    } catch { throw failToken(); }
  }

  async function activeSession(claims) {
    const session = store.getSession(claims.sid);
    if (!session || session.subject !== claims.sub || session.channel !== claims.channel || session.authMethod !== claims.authMethod) throw failToken();
    if (session.authMethod === 'password') {
      const account = await (session.channel === 'staff' ? repository.findStaffById(session.user.localUserId) : repository.findLocalById(session.user.localUserId));
      if (!account?.isActive || account.channel !== session.channel || account.version !== session.accountVersion) {
        store.revokeSession(session.id); throw failToken();
      }
      // Also detect revocation while the asynchronous account query was running.
      if (!store.getSession(session.id)) throw failToken();
      session.user = localUser(account);
    }
    return session;
  }

  async function verifyToken(token, channel) {
    const claims = verifyJwt(token, channel, 'access');
    const session = await activeSession(claims);
    return { ...claims, identity: session.user, localUserId: session.user.localUserId,
      roles: session.user.roles, permissions: session.user.permissions,
      authorizationStatus: session.user.authorizationStatus, ssoExpiresAt: session.ssoExpiresAt ?? null };
  }

  function rateLimit(kind, value, limit, windowMs) {
    const retryAfterSeconds = store.rateLimit(key('rate', kind, value), limit, windowMs);
    if (retryAfterSeconds) throw new AppError('Too many authentication attempts; try again later', 429, { retryAfterSeconds });
  }

  async function loginWithPassword(channel, body) {
    if (channel === 'student') throw new AppError('Students must sign in using DUT SSO', 403);
    requireAppConfig(channel);
    const { username, password } = parsePasswordLogin(body);
    rateLimit('username', username, 8, 900000);
    const account = await (channel === 'staff' ? repository.findStaffByUsername(username) : repository.findLocalByUsername(username));
    const valid = await verifyPassword(password, account?.passwordHash);
    if (!valid || !account?.isActive || account.channel !== channel) throw new AppError('Invalid username or password', 401);
    return issueSession(channel, { authMethod: 'password', subject: `local:${account.id}`,
      user: localUser(account), accountVersion: account.version });
  }

  async function exchangeToken(channel, accessToken) {
    requireSsoConfig(channel);
    const { identity, expiresAt } = verifySsoToken(accessToken);
    const subject = `sso:${digest(config.microsoftSso.jwtIssuer + '\0' + identity.id)}`;
    return { authMethod: 'sso', subject, ssoExpiresAt: expiresAt,
      ssoCiphertext: encrypt(accessToken, `${channel}:${subject}`),
      user: { ...identity, localUserId: null, roles: ['student'], permissions: [], authorizationStatus: 'active' } };
  }

  async function refreshSession(channel, refreshToken) {
    const claims = verifyJwt(refreshToken, channel, 'refresh');
    const session = await activeSession(claims);
    const result = bundle(session);
    if (!store.rotateRefresh(digest(refreshToken), digest(result.refreshToken), channel, session.id)) throw failToken();
    return result;
  }

  async function getSsoAccessToken(token, channel = 'student') {
    const claims = await verifyToken(token, channel);
    if (claims.authMethod !== 'sso') throw new AppError('Local accounts cannot use DUT SSO APIs', 403, { code: 'SSO_REQUIRED' });
    const session = store.getSession(claims.sid);
    if (!session?.ssoCiphertext || session.ssoExpiresAt <= now()) throw failSso();
    const upstream = decrypt(session.ssoCiphertext, `${channel}:${session.subject}`);
    verifySsoToken(upstream);
    return upstream;
  }

  function loginUrl(channel, state) {
    requireSsoConfig(channel);
    const sso = config.microsoftSso;
    const callback = new URL(sso.studentCallbackUrl);
    callback.searchParams.set('state', state);
    const url = new URL(sso.loginPath, sso.baseUrl);
    url.searchParams.set('callbackUrl', callback.href); url.searchParams.set('response_mode', 'query');
    return url.href;
  }

  function startLogin(channel) {
    const state = randomBytes(32).toString('hex'), url = loginUrl(channel, state);
    store.put(key('state', channel, state), { channel }, now() + config.auth.stateTtlMs);
    return { state, url, maxAge: config.auth.stateTtlMs };
  }

  function consumeState(channel, state) {
    if (!store.consume(key('state', channel, state))) throw new AppError('SSO state expired or already used; start a new login', 401);
  }

  function createHandoff(channel, pending) {
    const code = randomBytes(32).toString('hex'), binding = randomBytes(32).toString('hex');
    store.put(key('handoff', channel, code), { bindingHash: key('binding', channel, binding), pending }, now() + config.auth.handoffTtlMs);
    const url = frontendCallback(channel);
    if (url) url.hash = new URLSearchParams({ code }).toString();
    return { binding, code, url: url?.href ?? null, maxAge: config.auth.handoffTtlMs };
  }

  function redeemHandoff(channel, code, binding) {
    if (!/^[a-f0-9]{64}$/.test(code ?? '') || !/^[a-f0-9]{64}$/.test(binding ?? '')) throw new AppError('Invalid login code or browser binding', 401);
    const entryKey = key('handoff', channel, code), entry = store.get(entryKey);
    if (!entry || entry.bindingHash !== key('binding', channel, binding)) throw new AppError('Invalid or expired login code', 401);
    const consumed = store.consume(entryKey);
    if (!consumed || consumed.pending.ssoExpiresAt <= now()) throw new AppError('Login code expired or already used', 401);
    return issueSession(channel, consumed.pending);
  }

  function revokeSession(channel, claims) {
    if (claims.channel !== channel) throw failToken();
    store.revokeSession(claims.sid);
  }

  function logoutSession(channel, refreshToken) {
    const claims = verifyJwt(refreshToken, channel, 'refresh');
    const session = store.getSession(claims.sid);
    if (session && session.channel === channel && session.subject === claims.sub) store.revokeSession(session.id);
  }

  function logoutUrl(channel) {
    audience(channel);
    const url = new URL(config.microsoftSso.logoutPath, config.microsoftSso.baseUrl);
    url.searchParams.set('postLogoutRedirectUri', channel === 'student' ? config.app.studentFrontendUrl : config.app.adminFrontendUrl);
    return url.href;
  }

  return Object.freeze({ loginUrl, startLogin, consumeState, exchangeToken, verifyToken, logoutUrl,
    createHandoff, redeemHandoff, revokeSession, logoutSession, loginWithPassword, refreshSession, getSsoAccessToken, rateLimit });
}

export const authService = createAuthService();
