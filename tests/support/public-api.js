import { createServer } from 'node:http';
import { createApp } from '../../src/app.js';
import { createCourseRegistrationModule } from '../../src/modules/course-registration/index.js';
import { createTimetableModule } from '../../src/modules/timetable/index.js';

export function createPublicApp(clientOptions) {
  return createApp({
    courseRegistrationModule: createCourseRegistrationModule(clientOptions),
    timetableModule: createTimetableModule(clientOptions),
  });
}

export async function listen(t, handler) {
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

export async function fixture(t, options = {}) {
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
  const clientOptions = {
    sources: { 'course-registration': upstream, tkb: upstream },
    timeoutMs: 2000,
    ...options,
  };
  const app = await listen(t, createPublicApp(clientOptions));
  return { app, upstream, calls };
}

