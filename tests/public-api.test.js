import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { test } from 'node:test';

import { createApp } from '../src/app.js';
import { createPublicModule } from '../src/modules/public/index.js';

async function listen(t, handler) {
  const server = createServer(handler);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    await new Promise((resolve) => {
      server.close(resolve);
      server.closeAllConnections();
    });
  });
  return `http://127.0.0.1:${server.address().port}`;
}

async function fixture(t, options = {}) {
  const calls = [];
  const upstream = await listen(t, (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    calls.push({ path: url.pathname, query: Object.fromEntries(url.searchParams), headers: req.headers, method: req.method });
    const fail = /\/errors\/(\d+)$/.exec(url.pathname);
    if (fail) {
      res.writeHead(Number(fail[1]), { 'Content-Type': 'text/plain' });
      res.end('Internal secret, password and stack trace');
      return;
    }
    if (url.pathname.endsWith('/html')) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<html>Sign in</html>');
      return;
    }
    res.setHeader('Content-Type', 'application/json');
    if (url.pathname.endsWith('/invalid-json')) {
      res.end('{invalid-json');
    } else if (url.pathname.endsWith('/failed-envelope')) {
      res.end(JSON.stringify({ isSuccess: false, message: 'Internal database error', data: null }));
    } else if (url.pathname.endsWith('/missing-data')) {
      res.end(JSON.stringify({ success: true }));
    } else if (url.pathname.endsWith('/slow')) {
      // Keep the body open: the deadline must also cover reading a response.
      res.write('{"success":true,"data":');
    } else if (url.pathname.endsWith('/large')) {
      res.write(JSON.stringify({ data: 'x'.repeat(4096) }));
      res.end();
    } else if (url.pathname === '/api/Majors') {
      res.end(JSON.stringify([{ id: '102', majorName: 'Công nghệ thông tin' }]));
    } else if (url.pathname === '/api/Faculties') {
      res.end(JSON.stringify({ isSuccess: true, data: [{ id: '102', facultyName: 'CNTT' }], message: 'ok' }));
    } else if (url.pathname === '/api/AcademicPrograms/paged') {
      res.end(JSON.stringify({ items: [{ id: '1022220' }], totalRecords: 1, pageIndex: 1, pageSize: 20 }));
    } else if (url.pathname === '/api/StudentGrades/currentSemesterCode') {
      res.end(JSON.stringify({ IsSuccess: true, Data: '2610' }));
    } else {
      res.end(JSON.stringify({ success: true, data: { path: url.pathname, query: Object.fromEntries(url.searchParams) } }));
    }
  });
  const publicModule = createPublicModule({
    sources: { 'course-registration': upstream, tkb: upstream },
    timeoutMs: 2000,
    ...options,
  });
  const app = await listen(t, createApp({ publicModule }));
  return { app, upstream, calls };
}

test('public APIs normalize raw lists and both Course Registration envelope casings', async (t) => {
  const { app, calls } = await fixture(t);
  for (const [path, expected] of [
    ['/course-registration/faculties', [{ id: '102', facultyName: 'CNTT' }]],
    ['/course-registration/majors', [{ id: '102', majorName: 'Công nghệ thông tin' }]],
    ['/course-registration/settings/current-semester-code', '2610'],
  ]) {
    const response = await fetch(`${app}/api/public${path}`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await response.json(), { success: true, data: expected });
  }
  assert.equal(calls.length, 3);
});

test('paging, Unicode search, literal route precedence and caller credential isolation', async (t) => {
  const { app, calls } = await fixture(t);
  const query = new URLSearchParams({ keyword: 'Công nghệ & thông tin', sortDescending: 'TRUE' });
  const response = await fetch(`${app}/api/public/course-registration/academic-programs/paged?${query}`, {
    headers: { Authorization: 'Bearer caller-token', Cookie: 'session=caller-cookie' },
  });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    success: true,
    data: { items: [{ id: '1022220' }], totalRecords: 1, pageIndex: 1, pageSize: 20 },
  });
  assert.deepEqual(calls[0].query, {
    keyword: 'Công nghệ & thông tin', pageIndex: '1', pageSize: '20', sortDescending: 'true',
  });
  assert.equal(calls[0].path, '/api/AcademicPrograms/paged');
  assert.equal(calls[0].method, 'GET');
  assert.equal(calls[0].headers.authorization, undefined);
  assert.equal(calls[0].headers.cookie, undefined);
});

test('timetable routes preserve filters, boolean false, and static paths before numeric IDs', async (t) => {
  const { app, calls } = await fixture(t);
  const response = await fetch(`${app}/api/public/tkb/schedules?lecturerId=42&semester=21&onlyScheduled=false&week=1-5%3B7-9`);
  assert.equal(response.status, 200);
  assert.deepEqual(calls[0].query, { lecturerId: '42', semester: '21', week: '1-5;7-9', onlyScheduled: 'false' });
  const stats = await fetch(`${app}/api/public/tkb/schedules/semester-stats`);
  assert.equal(stats.status, 200);
  assert.equal(calls[1].path, '/api/Schedule/semester-stats');
  const candidates = await fetch(`${app}/api/public/tkb/schedules/42/room-candidates`);
  assert.equal(candidates.status, 200);
  assert.equal(calls[2].path, '/api/Schedule/42/room-candidates');
});

test('invalid queries and path traversal are rejected before contacting upstream', async (t) => {
  const { app, calls } = await fixture(t);
  for (const path of [
    '/course-registration/course-sections',
    '/course-registration/course-sections?academicYearCode=2026-2027',
    '/course-registration/faculties?url=http://untrusted.example',
    '/course-registration/faculties?access_token=secret',
    '/course-registration/majors/a%2Fb',
    '/tkb/lecturers?pageSize=101',
    '/tkb/lecturers?page=1&page=2',
    '/tkb/lecturers?page=-1',
    '/tkb/schedules?semester=99',
    '/tkb/schedules?onlyScheduled=1',
    '/tkb/schedules/batch/not-a-uuid',
    '/tkb/schedules/0',
    '/tkb/classrooms/suggest?building=B',
  ]) {
    const response = await fetch(`${app}/api/public${path}`);
    assert.equal(response.status, 400, path);
    assert.equal((await response.json()).success, false);
  }
  assert.equal(calls.length, 0);
});

test('mutation, account, SSO, and stub routes are not mounted', async (t) => {
  const { app, calls } = await fixture(t);
  for (const [method, path] of [
    ['POST', '/course-registration/faculties'],
    ['PUT', '/tkb/system-config'],
    ['DELETE', '/tkb/schedules/batch/00000000-0000-0000-0000-000000000000'],
    ['GET', '/course-registration/account/admin/reset-pass/102'],
    ['GET', '/course-registration/lecturers/102'],
    ['GET', '/course-registration/classes/102'],
    ['GET', '/course-registration/microsoft/signin'],
    ['GET', '/tkb/accounts'],
  ]) {
    const response = await fetch(`${app}/api/public${path}`, { method });
    assert.equal(response.status, 404, `${method} ${path}`);
  }
  assert.equal(calls.length, 0);
});

test('upstream failures have stable status codes and never expose the remote error body', async (t) => {
  const { app, upstream } = await fixture(t);
  for (const [upstreamStatus, expected] of [[400, 400], [404, 404], [401, 502], [403, 502], [302, 502], [429, 503], [500, 503], [503, 503]]) {
    const publicModule = createPublicModule({ sources: { tkb: upstream },
      fetchImpl: (_url, init) => fetch(`${upstream}/errors/${upstreamStatus}`, init), timeoutMs: 2000 });
    const local = await listen(t, createApp({ publicModule }));
    const response = await fetch(`${local}/api/public/tkb/faculties`);
    assert.equal(response.status, expected);
    const body = await response.json();
    assert.deepEqual(body.details, { source: 'tkb', upstreamStatus });
    assert.equal(JSON.stringify(body).includes('Internal secret'), false);
  }
  // The fixture app itself still answers health requests independently of upstreams.
  assert.equal((await fetch(`${app}/api/health`)).status, 200);
});

test('HTML, malformed JSON and failed/missing envelopes are rejected', async (t) => {
  const { upstream } = await fixture(t);
  for (const failure of ['html', 'invalid-json', 'failed-envelope', 'missing-data']) {
    const publicModule = createPublicModule({
      sources: { tkb: upstream }, fetchImpl: (_url, init) => fetch(`${upstream}/${failure}`, init), timeoutMs: 2000,
    });
    const app = await listen(t, createApp({ publicModule }));
    const response = await fetch(`${app}/api/public/tkb/faculties`);
    assert.equal(response.status, 502, failure);
    assert.equal((await response.text()).includes('Internal database error'), false);
  }
});

test('deadline covers body streaming and oversized chunked responses are stopped', async (t) => {
  const { upstream } = await fixture(t);
  for (const [failure, options, status] of [
    ['slow', { timeoutMs: 100 }, 504],
    ['large', { maxResponseBytes: 1024 }, 502],
  ]) {
    const publicModule = createPublicModule({ sources: { tkb: upstream },
      fetchImpl: (_url, init) => fetch(`${upstream}/${failure}`, init), ...options });
    const app = await listen(t, createApp({ publicModule }));
    const response = await fetch(`${app}/api/public/tkb/faculties`);
    assert.equal(response.status, status);
  }
});

test('connection failures are sanitized and deployment prefixes are preserved', async (t) => {
  const requested = [];
  const publicModule = createPublicModule({ sources: { tkb: 'https://upstream.example/backend/' },
    fetchImpl: async (url) => { requested.push(url.href); throw new Error('Sensitive network details'); },
  });
  const app = await listen(t, createApp({ publicModule }));
  const response = await fetch(`${app}/api/public/tkb/lecturers?keyword=abc`);
  assert.equal(response.status, 503);
  assert.equal((await response.text()).includes('Sensitive'), false);
  assert.deepEqual(requested, ['https://upstream.example/backend/api/Lecturer?page=1&pageSize=20&keyword=abc']);
});
