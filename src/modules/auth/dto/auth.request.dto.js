import { AppError } from '../../../shared/errors/app-error.js';

/** @returns {{ state: string, accessToken: unknown }} */
export function parseAuthCallbackQuery(query, expectedState) {
  // Accept gateways that preserve callbackUrl's state as well as those that
  // return only accessToken. The HttpOnly cookie binds both to this browser.
  if (typeof expectedState !== 'string' || !/^[a-f0-9]{64}$/.test(expectedState)) {
    throw new AppError('Missing login attempt; start a new login', 401);
  }
  if (!query || Object.keys(query).some(key => !['accessToken','state'].includes(key))) {
    throw new AppError('SSO callback chỉ nhận accessToken và state.', 400);
  }
  if (query.state !== undefined && (typeof query.state !== 'string' || query.state !== expectedState)) {
    throw new AppError('SSO state không khớp lần đăng nhập. Vui lòng đăng nhập lại.', 401);
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

export function parsePasswordUpdate(body,{reset=false}={}) {
  const allowed=reset?['newPassword']:['currentPassword','newPassword'];
  if(!body||typeof body!=='object'||Array.isArray(body)||Object.keys(body).some(key=>!allowed.includes(key))
    ||typeof body.newPassword!=='string'||[...body.newPassword].length<12||body.newPassword.length>128||body.newPassword.includes('\0')
    ||(!reset&&(typeof body.currentPassword!=='string'||!body.currentPassword.length||body.currentPassword.length>128))) {
    throw new AppError('Mật khẩu mới cần từ 12 đến 128 ký tự; vui lòng điền đầy đủ thông tin.',400);
  }
  return {newPassword:body.newPassword,...(!reset?{currentPassword:body.currentPassword}:{})};
}
