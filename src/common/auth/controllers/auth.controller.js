import { env } from '../../../config/env.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { sendSuccess } from '../../../shared/utils/response.js';
import { parseAuthCallbackQuery, parseAuthSessionBody } from '../dto/auth.request.dto.js';
import { createAuthHandoffDto, createAuthMeDto, createAuthLogoutDto } from '../dto/auth.response.dto.js';
import { toAuthUserDto } from '../mappers/auth.mapper.js';

export function createAuthController(channel, service, {
  secureCookies = false,
  frontendOrigin = channel === 'student' ? env.app.studentFrontendUrl : env.app.adminFrontendUrl,
} = {}) {
  const cookieName = `dut_sso_${channel}_state`;
  const cookieOptions = { httpOnly: true, secure: secureCookies, sameSite: 'lax', path: `/api/${channel}/auth/microsoft` };
  const handoffCookieName = `dut_sso_${channel}_handoff`;
  const handoffCookieOptions = { ...cookieOptions, path: `/api/${channel}/auth` };
  const refreshCookieName = `dut_web_${channel}_refresh`;
  const refreshCookieOptions = { ...handoffCookieOptions };

  function readCookie(req, name) {
    const matches = (req.headers.cookie ?? '').split(';').map(part => part.trim()).filter(part => part.startsWith(`${name}=`));
    return matches.length === 1 ? matches[0].slice(name.length + 1) : undefined;
  }

  function requireFrontendOrigin(req) {
    if (req.headers.origin !== frontendOrigin) throw new AppError('Invalid frontend origin', 403);
    if (req.headers['sec-fetch-site'] === 'cross-site') throw new AppError('Cross-site authentication requests are not allowed', 403);
  }

  function sendSession(res, result) {
    if (result.refreshToken) res.cookie(refreshCookieName, result.refreshToken, { ...refreshCookieOptions, maxAge: result.maxAge });
    else res.clearCookie(refreshCookieName, refreshCookieOptions);
    return sendSuccess(res, result.data);
  }

  return Object.freeze({
    login(_req, res) {
      const { state, url, maxAge } = service.startLogin(channel);
      res.cookie(cookieName, state, { ...cookieOptions, maxAge });
      return res.redirect(url);
    },
    async callback(req, res) {
      const expected = readCookie(req, cookieName);
      res.clearCookie(cookieName, cookieOptions);
      const { state, accessToken } = parseAuthCallbackQuery(req.query, expected, req.params.state);
      service.consumeState(channel, state);
      const pending = await service.exchangeToken(channel, accessToken);
      const handoff = service.createHandoff(channel, pending);
      res.cookie(handoffCookieName, handoff.binding, { ...handoffCookieOptions, maxAge: handoff.maxAge });
      if (handoff.url) return res.redirect(303, handoff.url);
      return sendSuccess(res, createAuthHandoffDto(handoff, channel));
    },
    session(req, res) {
      requireFrontendOrigin(req);
      const { code } = parseAuthSessionBody(req.body);
      const result = service.redeemHandoff(channel, code, readCookie(req, handoffCookieName));
      res.clearCookie(handoffCookieName, handoffCookieOptions);
      return sendSession(res, result);
    },
    async passwordLogin(req, res) {
      requireFrontendOrigin(req);
      return sendSession(res, await service.loginWithPassword(channel, req.body));
    },
    async changePassword(req,res) {
      requireFrontendOrigin(req);
      const result=await service.updateStaffPassword(req.user,req.body);
      res.clearCookie(refreshCookieName,refreshCookieOptions);
      return sendSuccess(res,result);
    },
    async resetStaffPassword(req,res) {
      requireFrontendOrigin(req);
      return sendSuccess(res,await service.updateStaffPassword(req.user,req.body,{targetId:req.params.id}));
    },
    async refresh(req, res) {
      requireFrontendOrigin(req);
      if (req.body && (typeof req.body !== 'object' || Array.isArray(req.body) || Object.keys(req.body).length)) {
        throw new AppError('Refresh tokens must be sent using the HttpOnly cookie', 400);
      }
      try { return sendSession(res, await service.refreshSession(channel, readCookie(req, refreshCookieName))); }
      catch (error) {
        if (error.statusCode === 401) res.clearCookie(refreshCookieName, refreshCookieOptions);
        throw error;
      }
    },
    me(req, res) {
      return sendSuccess(res, createAuthMeDto(channel, toAuthUserDto(req.user), req.user));
    },
    async logout(req, res) {
      const refreshToken = channel === 'student' ? undefined : readCookie(req, refreshCookieName);
      if (refreshToken || req.headers.origin) requireFrontendOrigin(req);
      try {
        if (refreshToken) service.logoutSession(channel, refreshToken);
        else {
          const match = /^Bearer ([^\s]+)$/i.exec(req.headers.authorization ?? '');
          if (!match) throw new AppError('Authentication required', 401);
          service.revokeSession(channel, await service.verifyToken(match[1], channel));
        }
      } finally {
        res.clearCookie(cookieName, cookieOptions);
        res.clearCookie(handoffCookieName, handoffCookieOptions);
        res.clearCookie(refreshCookieName, refreshCookieOptions);
      }
      return sendSuccess(res, createAuthLogoutDto(channel === 'student' ? service.logoutUrl(channel) : null));
    },
  });
}
