import { AppError } from '../../../shared/errors/app-error.js';

/** @returns {{ state: string, accessToken: unknown }} */
export function parseAuthCallbackQuery(query, expectedState) {
  // The gateway returns accessToken only. The one-use login attempt stays in an HttpOnly cookie.
  if (typeof expectedState !== 'string' || !/^[a-f0-9]{64}$/.test(expectedState)) {
    throw new AppError('Missing login attempt; start a new login', 401);
  }
  if (!query || Object.keys(query).some(key => key !== 'accessToken')) {
    throw new AppError('SSO callback accepts accessToken only', 400);
  }
  return { state: expectedState, accessToken: parseSsoAccessToken(query.accessToken) };
}

/** @returns {{ code: string }} */
export function parseAuthSessionBody(body) {
  if (typeof body?.code !== 'string') throw new AppError('Login code is required', 400);
  return { code: body.code };
}

/** @returns {string} */
export function parseSsoAccessToken(accessToken) {
  if (typeof accessToken !== 'string' || !accessToken || accessToken.length > 16384) {
    throw new AppError('Missing or invalid accessToken', 400);
  }
  return accessToken;
}
