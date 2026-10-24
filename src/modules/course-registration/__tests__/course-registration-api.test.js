import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fixture } from '../../../../tests/support/public-api.js';

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

