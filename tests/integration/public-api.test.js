import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createApp } from '../../src/app.js';
import { createTimetableModule } from '../../src/modules/timetable/index.js';
import { fixture, listen } from '../support/public-api.js';

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
    const timetableModule = createTimetableModule({ sources: { tkb: upstream },
      fetchImpl: (_url, init) => fetch(`${upstream}/errors/${upstreamStatus}`, init), timeoutMs: 2000 });
    const local = await listen(t, createApp({ timetableModule }));
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
    const timetableModule = createTimetableModule({
      sources: { tkb: upstream }, fetchImpl: (_url, init) => fetch(`${upstream}/${failure}`, init), timeoutMs: 2000,
    });
    const app = await listen(t, createApp({ timetableModule }));
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
    const timetableModule = createTimetableModule({ sources: { tkb: upstream },
      fetchImpl: (_url, init) => fetch(`${upstream}/${failure}`, init), ...options });
    const app = await listen(t, createApp({ timetableModule }));
    const response = await fetch(`${app}/api/public/tkb/faculties`);
    assert.equal(response.status, status);
  }
});

test('connection failures are sanitized and deployment prefixes are preserved', async (t) => {
  const requested = [];
  const timetableModule = createTimetableModule({ sources: { tkb: 'https://upstream.example/backend/' },
    fetchImpl: async (url) => { requested.push(url.href); throw new Error('Sensitive network details'); },
  });
  const app = await listen(t, createApp({ timetableModule }));
  const response = await fetch(`${app}/api/public/tkb/lecturers?keyword=abc`);
  assert.equal(response.status, 503);
  assert.equal((await response.text()).includes('Sensitive'), false);
  assert.deepEqual(requested, ['https://upstream.example/backend/api/Lecturer?page=1&pageSize=20&keyword=abc']);
});
