import { timingSafeEqual } from 'node:crypto';
import { AppError } from '../../../shared/errors/app-error.js';

/** @returns {{ state: string, accessToken: unknown }} */
export function parseAuthCallbackQuery(query, expectedState) {
  const state = query.state;
  if (typeof state !== 'string' || !/^[a-f0-9]{64}$/.test(state)
    || !expectedState || !/^[a-f0-9]{64}$/.test(expectedState)
    || !timingSafeEqual(Buffer.from(state), Buffer.from(expectedState))) {
    throw new AppError('Invalid SSO state; start a new login', 401);
  }
  return { state, accessToken: query.accessToken };
}

/** @returns {{ code: string }} */
export function parseAuthSessionBody(body) {
  if (typeof body?.code !== 'string') throw new AppError('Login code is required', 400);
  return { code: body.code };
}

/** @returns {string} */
export function parseSsoAccessToken(accessToken) {
  if (typeof accessToken !== 'string' || !accessToken || accessToken.length > 16384 || /\s/.test(accessToken)) {
    throw new AppError('Missing or invalid accessToken', 400);
  }
  return accessToken;
}

export function parsePasswordLogin(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)
    || Object.keys(body).some(key => !['username', 'password'].includes(key))
    || typeof body.username !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._@-]{2,127}$/.test(body.username)
    || typeof body.password !== 'string' || !body.password.length || body.password.length > 128) {
    throw new AppError('A valid username and password are required', 400);
  }
  return { username: body.username.toLowerCase(), password: body.password };
}
