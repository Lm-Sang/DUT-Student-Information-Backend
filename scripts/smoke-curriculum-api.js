import assert from 'node:assert/strict';
import { createServer } from 'node:http';

import { createApp } from '../src/app.js';
import { disconnectDatabases } from '../src/config/database.js';

// Opt-in integration check against the configured SQL sources. SELECT only.
// The local HTTP server is temporary and closes together with SQL/SSH resources.
const facultyId = process.argv[2] ?? '102';
if (!/^\d{3}$/.test(facultyId)) throw new Error('Faculty ID must contain three digits.');
const server = createServer(createApp());
const summaries = [];
try {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/api/public`;
  async function read(path, expectedStatus = 200) {
    const response = await fetch(`${base}${path}`, { signal: AbortSignal.timeout(60_000) });
    const body = await response.json();
    assert.equal(response.status, expectedStatus, `${path}: ${body.message ?? response.status}`);
    assert.equal(body.success, expectedStatus === 200);
    return body.data;
  }
  const programs = await read(`/academic-programs?facultyId=${facultyId}`);
  assert.ok(Array.isArray(programs));
  assert.equal(new Set(programs.map((row) => row.id)).size, programs.length);
  assert.ok(programs.every((row) => row.facultyId === facultyId && row.educationLevelCode === 'CD01'));

  let next = 0;
  await Promise.all(Array.from({ length: Math.min(4, programs.length) }, async () => {
    while (next < programs.length) {
      const program = programs[next++];
      const data = await read(`/academic-programs/${program.id}/curriculum`);
      assert.equal(data.program.id, program.id);
      assert.equal(data.courses.length, data.counts.curriculumRows);
      assert.equal(data.requirements.length, data.counts.requirementRows);
      assert.equal(data.counts.rowsWithReplacement,
        data.courses.filter((row) => row.alternativeCourseId).length);
      assert.equal(data.counts.rowsWithoutReplacement + data.counts.rowsWithReplacement, data.courses.length);
      assert.equal(data.counts.missingCourseMetadata, 0, `${program.id}: missing course metadata`);
      assert.equal(data.counts.missingRequirementMetadata, 0, `${program.id}: missing requirement metadata`);
      summaries.push({ id: program.id, ...data.counts, ...data.coverage });
    }
  }));
  await read('/academic-programs/9999999/curriculum', 404);
  console.log(JSON.stringify({
    facultyId, programs: programs.length, verifiedCurricula: summaries.length,
    curriculumRows: summaries.reduce((sum, row) => sum + row.curriculumRows, 0),
    requirementRows: summaries.reduce((sum, row) => sum + row.requirementRows, 0),
    samples: summaries.filter((row) => ['1021049', '1024045'].includes(row.id)),
  }, null, 2));
} finally {
  await new Promise((resolve) => {
    server.close(resolve);
    server.closeAllConnections();
  });
  await disconnectDatabases();
}
