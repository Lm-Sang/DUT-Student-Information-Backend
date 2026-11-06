import { AppError } from '../../../shared/errors/app-error.js';
import { validateUsername, validatePassword } from '../rules/credentials.js';

/** @returns {{ state: string, accessToken: unknown }} */
export function parseAuthCallbackQuery(query, expectedState, pathState) {
  if (typeof expectedState !== 'string' || !/^[a-f0-9]{64}$/.test(expectedState)) {
    throw new AppError('Missing login attempt; start a new login', 401);
  }
  if (!query || Object.keys(query).some(key => !['accessToken','state'].includes(key))) {
    throw new AppError('SSO callback chỉ nhận accessToken và state.', 400);
  }
  const state = pathState ?? query.state;
  if (typeof state !== 'string' || state !== expectedState
    || (query.state !== undefined && query.state !== expectedState)) {
    throw new AppError('SSO state không khớp lần đăng nhập. Vui lòng đăng nhập lại.', 401);
  }
  return { state, accessToken: parseSsoAccessToken(query.accessToken) };
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
    || typeof body.password !== 'string' || !body.password.length || body.password.length > 128) {
    throw new AppError('A valid username and password are required', 400);
  }
  return { username: validateUsername(body.username, 128).toLowerCase(), password: body.password };
}

export function parsePasswordUpdate(body,{reset=false}={}) {
  const allowed=reset?['newPassword']:['currentPassword','newPassword'];
  if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(key=>!allowed.includes(key))
    ||(!reset&&(typeof body.currentPassword!=='string'||!body.currentPassword.length||body.currentPassword.length>128))) {
    throw new AppError('Vui lòng điền đầy đủ thông tin đổi mật khẩu.',400);
  }
  validatePassword(body.newPassword);
  return {newPassword:body.newPassword,...(!reset?{currentPassword:body.currentPassword}:{})};
}
