import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { test } from 'node:test';
import express from 'express';
import jwt from 'jsonwebtoken';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { env } from '../src/config/env.js';
import { createApp } from '../src/app.js';
import { createAuthController } from '../src/modules/auth/auth.controller.js';
import { createAuthRouter } from '../src/modules/auth/auth.routes.js';
import { createAuthService } from '../src/modules/auth/auth.service.js';
import { createAuthStore } from '../src/modules/auth/auth.store.js';
import { authenticate, requirePermissions } from '../src/shared/middlewares/auth.middleware.js';
import { errorHandler } from '../src/shared/middlewares/error-handler.middleware.js';

const config = {
  ...env,
  jwt: { ...env.jwt, secret: 'application-test-key-only', expiresIn: '1h' },
  microsoftSso: {
    ...env.microsoftSso, jwtSecret: 'sso-test-key-only',
    jwtIssuer: 'test-sso', jwtAudience: 'test-client',
    studentFrontendCallbackUrl: `${env.app.studentFrontendUrl}/auth/sso/callback`,
  },
};
const service = createAuthService({ config, store: createAuthStore() });
const ssoToken = (claims = {}, options = {}) => jwt.sign({
  sub: 'stable-sso-id', unique_name: 'STUDENT@DUT.UDN.VN', name: 'Test Student',
  role: 'Admin', permissions: ['all'], ...claims,
}, config.microsoftSso.jwtSecret, {
  algorithm: 'HS256', expiresIn: '5m', issuer: 'test-sso', audience: 'test-client', ...options,
});

async function listen(t, app) {
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => {
    server.close(resolve);
    server.closeAllConnections();
  }));
  return `http://127.0.0.1:${server.address().port}`;
}

async function fixture(t, channel = 'student', authService = service) {
  const app = express();
  app.use(`/api/${channel}/auth`, createAuthRouter(channel, createAuthController(channel, authService), authService));
  app.get('/protected', authenticate(channel, authService), requirePermissions('students.read'), (_req, res) => res.json({ ok: true }));
  app.use(errorHandler);
  return { base: await listen(t, app), path: `/api/${channel}/auth` };
}

async function beginLogin(base, path) {
  const login = await fetch(`${base}${path}/microsoft/login`, { redirect: 'manual' });
  const url = new URL(login.headers.get('location'));
  return { login, url, state: new URL(url.searchParams.get('callbackUrl')).searchParams.get('state'),
    cookie: login.headers.get('set-cookie').split(';')[0] };
}

async function redeem(base, path, callback, options = {}) {
  const location = new URL(callback.headers.get('location'));
  assert.equal(location.pathname, '/auth/sso/callback');
  assert.equal(location.search, '');
  assert.ok(!location.href.includes('accessToken'));
  const code = new URLSearchParams(location.hash.slice(1)).get('code');
  const cookie = callback.headers.get('set-cookie').split(/,(?=\s*dut_sso_)/)
    .find((item) => item.trim().startsWith('dut_sso_student_handoff=')).trim().split(';')[0];
  const response = await fetch(`${base}${path}/session`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', origin: config.app.studentFrontendUrl, cookie, ...options.headers },
    body: JSON.stringify({ code }),
  });
  return { response, code, cookie };
}

test('student browser login, callback and me; pending identity has no business permissions', async (t) => {
  const { base, path } = await fixture(t);
  const { login, url, state, cookie } = await beginLogin(base, path);
  assert.equal(login.status, 302);
  assert.equal(url.origin, new URL(config.microsoftSso.baseUrl).origin);
  assert.equal(url.searchParams.get('response_mode'), 'query');
  assert.match(login.headers.get('set-cookie'), /HttpOnly/);
  const query = new URLSearchParams({ state, accessToken: ssoToken() });
  const callback = await fetch(`${base}${path}/microsoft/callback?${query}`, { headers: { cookie }, redirect: 'manual' });
  assert.equal(callback.status, 303);
  assert.equal(callback.headers.get('cache-control'), 'no-store');
  assert.match(callback.headers.get('set-cookie'), /Expires=Thu, 01 Jan 1970/);
  const { response, code, cookie: handoffCookie } = await redeem(base, path, callback);
  assert.equal(response.status, 200);
  const { data } = await response.json();
  assert.equal(data.user.microsoftId, 'student@dut.udn.vn');
  assert.equal(data.user.authorizationStatus, 'pending');
  assert.deepEqual(data.user.roles, []);
  assert.deepEqual(data.user.permissions, []);
  const headers = { authorization: `Bearer ${data.token}` };
  const me = await fetch(`${base}${path}/me`, { headers });
  assert.equal(me.status, 200);
  assert.equal((await me.json()).data.user.id, 'stable-sso-id');
  assert.equal((await fetch(`${base}/protected`, { headers })).status, 403);
  assert.equal((await fetch(`${base}${path}/me`)).status, 401);
  assert.equal((await fetch(`${base}${path}/me`, { headers: { authorization: `Bearer ${ssoToken()}` } })).status, 401);
  assert.equal((await fetch(`${base}${path}/microsoft/callback?${query}`)).status, 401);
  assert.equal((await fetch(`${base}${path}/microsoft/callback?${query}`, { headers: { cookie }, redirect: 'manual' })).status, 401);
  const codeReplay = await fetch(`${base}${path}/session`, { method: 'POST',
    headers: { 'Content-Type': 'application/json', origin: config.app.studentFrontendUrl, cookie: handoffCookie }, body: JSON.stringify({ code }) });
  assert.equal(codeReplay.status, 401);
});

test('callback rejects missing/mismatched state and missing access token', async (t) => {
  const { base, path } = await fixture(t);
  const { state, cookie } = await beginLogin(base, path);
  for (const query of [new URLSearchParams({ accessToken: ssoToken() }), new URLSearchParams({ state: 'b'.repeat(64), accessToken: ssoToken() })]) {
    assert.equal((await fetch(`${base}${path}/microsoft/callback?${query}`, { headers: { cookie } })).status, 401);
  }
  assert.equal((await fetch(`${base}${path}/microsoft/callback?state=${state}`, { headers: { cookie } })).status, 400);
});

test('SSO verification rejects tampering, expiry, missing expiry/identity, issuer, audience and algorithm', async () => {
  const noExpiry = jwt.sign({ unique_name: 'user', iss: 'test-sso', aud: 'test-client' }, config.microsoftSso.jwtSecret);
  const cases = [
    ssoToken({}, { expiresIn: -1 }), ssoToken({ unique_name: null }), noExpiry,
    ssoToken({}, { issuer: 'other' }), ssoToken({}, { audience: 'other' }),
    ssoToken({}, { algorithm: 'HS384' }),
    jwt.sign({ unique_name: 'user' }, 'wrong-secret', { expiresIn: '5m' }),
  ];
  for (const token of cases) {
    await assert.rejects(service.exchangeToken('student', token), (error) => error.statusCode === 401);
  }
});

test('admin tokens are isolated from student tokens without automatically granting Admin', async () => {
  const student = await service.exchangeToken('student', ssoToken());
  const admin = await service.exchangeToken('admin', ssoToken());
  assert.throws(() => service.verifyToken(student.token, 'admin'), (error) => error.statusCode === 401);
  assert.throws(() => service.verifyToken(admin.token, 'student'), (error) => error.statusCode === 401);
  assert.deepEqual(admin.user.roles, []);
});

test('missing or reused signing keys fail closed; no database or external SSO required', async () => {
  for (const secret of ['', config.microsoftSso.jwtSecret]) {
    const unconfigured = createAuthService({ config: { ...config, jwt: { ...config.jwt, secret } } });
    assert.throws(() => unconfigured.loginUrl('student', 'state'), (error) => error.statusCode === 503);
  }
});

test('admin auth is absent from default app and can be mounted separately', async (t) => {
  const base = await listen(t, createApp());
  assert.equal((await fetch(`${base}/api/admin/auth/microsoft/login`, { redirect: 'manual' })).status, 404);
  assert.equal((await fetch(`${base}/api/student/auth/me`)).status, 401);
  const adminAuthModule = {
    basePath: '/api/admin/auth',
    router: createAuthRouter('admin', createAuthController('admin', service), service),
  };
  const enabled = await listen(t, createApp({ adminAuthModule }));
  assert.equal((await fetch(`${enabled}/api/admin/auth/microsoft/login`, { redirect: 'manual' })).status, 302);
});

test('authenticated POST logout revokes only that session immediately', async (t) => {
  const { base, path } = await fixture(t);
  const first = await service.exchangeToken('student', ssoToken());
  const second = await service.exchangeToken('student', ssoToken());
  const headers = { authorization: `Bearer ${first.token}` };
  assert.equal((await fetch(`${base}${path}/logout`, { method: 'POST' })).status, 401);
  assert.equal((await fetch(`${base}${path}/logout`, { method: 'POST', headers: { ...headers, origin: 'https://evil.invalid' } })).status, 403);
  const response = await fetch(`${base}${path}/logout`, { method: 'POST', headers });
  assert.equal(response.status, 200);
  const { data } = await response.json();
  assert.equal(data.clearLocalToken, true);
  const url = new URL(data.url);
  assert.equal(url.pathname, config.microsoftSso.logoutPath);
  assert.equal(url.searchParams.get('postLogoutRedirectUri'), config.app.studentFrontendUrl);
  assert.equal((await fetch(`${base}${path}/me`, { headers })).status, 401);
  assert.equal((await fetch(`${base}${path}/me`, { headers: { authorization: `Bearer ${second.token}` } })).status, 200);
});

test('state expiry, fabricated state and concurrent replay fail on server', async (t) => {
  let clock = Date.now();
  const store = createAuthStore({ now: () => clock });
  const local = createAuthService({ config, store, now: () => clock });
  const { base, path } = await fixture(t, 'student', local);
  const first = await beginLogin(base, path);
  clock += config.auth.stateTtlMs + 1;
  const expired = await fetch(`${base}${path}/microsoft/callback?${new URLSearchParams({ state: first.state, accessToken: ssoToken() })}`,
    { headers: { cookie: first.cookie }, redirect: 'manual' });
  assert.equal(expired.status, 401);
  const fabricated = 'a'.repeat(64);
  assert.equal((await fetch(`${base}${path}/microsoft/callback?${new URLSearchParams({ state: fabricated, accessToken: ssoToken() })}`,
    { headers: { cookie: `dut_sso_student_state=${fabricated}` }, redirect: 'manual' })).status, 401);
  const next = await beginLogin(base, path);
  const requests = await Promise.all([1, 2].map(() => fetch(`${base}${path}/microsoft/callback?${new URLSearchParams({ state: next.state, accessToken: ssoToken() })}`,
    { headers: { cookie: next.cookie }, redirect: 'manual' })));
  assert.deepEqual(requests.map((r) => r.status).sort(), [303, 401]);
});

test('handoff expiry, wrong browser, missing/wrong Origin and concurrent redemption', async (t) => {
  let clock = Date.now();
  const local = createAuthService({ config, store: createAuthStore({ now: () => clock }), now: () => clock });
  const { base, path } = await fixture(t, 'student', local);
  const result = await local.exchangeToken('student', ssoToken());
  const handoff = local.createHandoff('student', result);
  const code = new URLSearchParams(new URL(handoff.url).hash.slice(1)).get('code');
  const post = (headers) => fetch(`${base}${path}/session`, { method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ code }) });
  const cookie = `dut_sso_student_handoff=${handoff.binding}`;
  assert.equal((await post({ cookie })).status, 403);
  assert.equal((await post({ cookie, origin: 'https://evil.invalid' })).status, 403);
  assert.equal((await post({ origin: config.app.studentFrontendUrl })).status, 401);
  const headers = { cookie, origin: config.app.studentFrontendUrl };
  const responses = await Promise.all([post(headers), post(headers)]);
  assert.deepEqual(responses.map((r) => r.status).sort(), [200, 401]);
  const expired = local.createHandoff('student', result);
  const expiredCode = new URLSearchParams(new URL(expired.url).hash.slice(1)).get('code');
  clock += config.auth.handoffTtlMs + 1;
  assert.throws(() => local.redeemHandoff('student', expiredCode, expired.binding), (error) => error.statusCode === 401);
});

test('sessions survive restart and revocation is shared across two workers', async (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'dut-auth-test-'));
  const filename = join(directory, 'auth.sqlite');
  const one = createAuthStore({ filename });
  const two = createAuthStore({ filename });
  t.after(() => { one.close(); two.close(); rmSync(directory, { recursive: true, force: true }); });
  const first = createAuthService({ config, store: one });
  const second = createAuthService({ config, store: two });
  const session = await first.exchangeToken('student', ssoToken());
  one.close();
  assert.equal(first.verifyToken(session.token, 'student').sub, 'stable-sso-id');
  second.revokeSession('student', second.verifyToken(session.token, 'student'));
  assert.throws(() => first.verifyToken(session.token, 'student'), (error) => error.statusCode === 401);
  const login = first.startLogin('student');
  second.consumeState('student', login.state);
  assert.throws(() => first.consumeState('student', login.state), (error) => error.statusCode === 401);
});

test('blank frontend callback returns only a short-lived code, no guessed redirect or JWT', async (t) => {
  const localConfig = { ...config, microsoftSso: { ...config.microsoftSso, studentFrontendCallbackUrl: '' } };
  const local = createAuthService({ config: localConfig, store: createAuthStore() });
  const { base, path } = await fixture(t, 'student', local);
  const { state, cookie } = await beginLogin(base, path);
  const callback = await fetch(`${base}${path}/microsoft/callback?${new URLSearchParams({ state, accessToken: ssoToken() })}`,
    { headers: { cookie }, redirect: 'manual' });
  assert.equal(callback.status, 200);
  assert.equal(callback.headers.get('location'), null);
  const { data } = await callback.json();
  assert.equal(data.frontendCallbackConfigured, false);
  assert.equal(data.expiresIn, 60);
  assert.match(data.code, /^[a-f0-9]{64}$/);
  assert.equal(data.token, undefined);
  assert.throws(() => createAuthService({ config: { ...config, microsoftSso: {
    ...config.microsoftSso, studentFrontendCallbackUrl: 'https://evil.invalid/callback',
  } }, store: createAuthStore() }).startLogin('student'), (error) => error.statusCode === 503);
});

test('production refuses missing SSO issuer/audience, weak keys and HTTP callbacks', () => {
  const production = { ...config, nodeEnv: 'production' };
  for (const candidate of [production,
    { ...production, microsoftSso: { ...production.microsoftSso, jwtIssuer: undefined } },
    { ...production, jwt: { ...production.jwt, secret: 'strong-app-key'.repeat(4) },
      microsoftSso: { ...production.microsoftSso, jwtSecret: 'strong-sso-key'.repeat(4) } },
  ]) {
    assert.throws(() => createAuthService({ config: candidate, store: createAuthStore() }).startLogin('student'),
      (error) => error.statusCode === 503);
  }
  const valid = {
    ...production,
    jwt: { ...production.jwt, secret: 'strong-app-test-key'.repeat(3) },
    app: { ...production.app, url: 'https://api.example.invalid', studentFrontendUrl: 'https://student.example.invalid' },
    microsoftSso: { ...production.microsoftSso, jwtSecret: 'strong-sso-test-key'.repeat(3),
      studentCallbackUrl: 'https://api.example.invalid/api/student/auth/microsoft/callback',
      studentFrontendCallbackUrl: '' },
  };
  assert.match(createAuthService({ config: valid, store: createAuthStore() }).startLogin('student').state, /^[a-f0-9]{64}$/);
  for (const claim of ['jwtIssuer', 'jwtAudience']) {
    const missing = { ...valid, microsoftSso: { ...valid.microsoftSso, [claim]: undefined } };
    assert.throws(() => createAuthService({ config: missing, store: createAuthStore() }).startLogin('student'),
      (error) => error.statusCode === 503);
  }
});

test('mock gateway exercises redirects, callback state preservation, redemption and logout URL', async (t) => {
  let dropState = false;
  const gateway = express();
  gateway.get('/microsoft/login', (req, res) => {
    assert.equal(req.query.response_mode, 'query');
    const callback = new URL(req.query.callbackUrl);
    if (dropState) callback.searchParams.delete('state');
    callback.searchParams.set('accessToken', ssoToken());
    res.redirect(callback.href);
  });
  gateway.get('/microsoft/logout', (req, res) => {
    assert.equal(req.query.postLogoutRedirectUri, config.app.studentFrontendUrl);
    res.redirect(req.query.postLogoutRedirectUri);
  });
  const gatewayBase = await listen(t, gateway);
  const app = express();
  const base = await listen(t, app);
  const localConfig = { ...config, app: { ...config.app, url: base }, microsoftSso: {
    ...config.microsoftSso, baseUrl: gatewayBase, studentCallbackUrl: `${base}/api/student/auth/microsoft/callback`,
  } };
  const local = createAuthService({ config: localConfig, store: createAuthStore() });
  const path = '/api/student/auth';
  app.use(path, createAuthRouter('student', createAuthController('student', local), local));
  app.use(errorHandler);
  const first = await beginLogin(base, path);
  const sso = await fetch(first.url, { redirect: 'manual' });
  const callback = await fetch(sso.headers.get('location'), { redirect: 'manual', headers: { cookie: first.cookie } });
  assert.equal(callback.status, 303);
  const { response } = await redeem(base, path, callback);
  const { data } = await response.json();
  const logout = await fetch(base + path + '/logout', { method: 'POST', headers: { authorization: `Bearer ${data.token}` } });
  const logoutData = (await logout.json()).data;
  const gatewayLogout = await fetch(logoutData.url, { redirect: 'manual' });
  assert.equal(gatewayLogout.headers.get('location'), config.app.studentFrontendUrl);
  assert.throws(() => local.verifyToken(data.token, 'student'), (error) => error.statusCode === 401);
  dropState = true;
  const second = await beginLogin(base, path);
  const dropped = await fetch(second.url, { redirect: 'manual' });
  const rejected = await fetch(dropped.headers.get('location'), { redirect: 'manual', headers: { cookie: second.cookie } });
  assert.equal(rejected.status, 401);
});
