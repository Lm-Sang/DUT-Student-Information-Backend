import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createApp } from '../../src/app.js';
import { createCourseRegistrationModule } from '../../src/modules/course-registration/index.js';
import { createTimetableModule } from '../../src/modules/timetable/index.js';
import { listen } from '../support/public-api.js';

test('course registration and timetable can be replaced or disabled independently', async (t) => {
  for (const timetableEnabled of [true, false]) {
    const requested = [];
    const clientOptions = {
      sources: { tkb: 'https://tkb.example', 'course-registration': 'https://registration.example' },
      fetchImpl: async (url) => {
        requested.push(url.href);
        return Response.json({ success: true, data: [{ id: '102' }] });
      },
    };
    const base = await listen(t, createApp({
      courseRegistrationModule: timetableEnabled ? null : createCourseRegistrationModule(clientOptions),
      timetableModule: timetableEnabled ? createTimetableModule(clientOptions) : null,
    }));
    const enabled = timetableEnabled ? 'tkb' : 'course-registration';
    const disabled = timetableEnabled ? 'course-registration' : 'tkb';

    const response = await fetch(`${base}/api/public/${enabled}/faculties`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { success: true, data: [{ id: '102' }] });
    assert.equal((await fetch(`${base}/api/public/${disabled}/faculties`)).status, 404);
    assert.equal((await fetch(`${base}/api/health`)).status, 200);
    assert.deepEqual(requested, [timetableEnabled
      ? 'https://tkb.example/api/Faculty'
      : 'https://registration.example/api/Faculties']);
  }
});
