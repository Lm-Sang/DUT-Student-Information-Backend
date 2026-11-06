import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fixture } from '../../../../tests/support/public-api.js';

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

