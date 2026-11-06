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
  const cookieOptions = {
    httpOnly: true, secure: secureCookies, sameSite: 'lax',
    path: `/api/${channel}/auth/microsoft`,
  };
  const handoffCookieName = `dut_sso_${channel}_handoff`;
  const handoffCookieOptions = { ...cookieOptions, path: `/api/${channel}/auth` };
  function readCookie(req, name) {
    const matches = (req.headers.cookie ?? '').split(';').map((part) => part.trim())
      .filter((part) => part.startsWith(`${name}=`));
    return matches.length === 1 ? matches[0].slice(name.length + 1) : undefined;
  }
  function requireFrontendOrigin(req) {
    if (req.headers.origin !== frontendOrigin) throw new AppError('Invalid frontend origin', 403);
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
      const { state, accessToken } = parseAuthCallbackQuery(req.query, expected);
      service.consumeState(channel, state);
      const result = await service.exchangeToken(channel, accessToken);
      const handoff = service.createHandoff(channel, result);
      res.cookie(handoffCookieName, handoff.binding, { ...handoffCookieOptions, maxAge: handoff.maxAge });
      if (handoff.url) return res.redirect(303, handoff.url);
      // No assumed frontend route while the frontend team builds its callback.
      return sendSuccess(res, createAuthHandoffDto(handoff, channel));
    },
    session(req, res) {
      requireFrontendOrigin(req);
      const { code } = parseAuthSessionBody(req.body);
      const result = service.redeemHandoff(channel, code, readCookie(req, handoffCookieName));
      res.clearCookie(handoffCookieName, handoffCookieOptions);
      return sendSuccess(res, result);
    },
    me(req, res) {
      return sendSuccess(res, createAuthMeDto(channel, toAuthUserDto(req.user)));
    },
    logout(req, res) {
      // Bearer authentication protects this state-changing POST. If a browser
      // supplies Origin, enforce its configured frontend origin as well.
      if (req.headers.origin) requireFrontendOrigin(req);
      service.revokeSession(channel, req.user);
      res.clearCookie(cookieName, cookieOptions);
      res.clearCookie(handoffCookieName, handoffCookieOptions);
      return sendSuccess(res, createAuthLogoutDto(service.logoutUrl(channel)));
    },
  });
}
