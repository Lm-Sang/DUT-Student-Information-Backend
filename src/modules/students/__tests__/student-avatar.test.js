import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'node:http';
import express from 'express';
import sharp from 'sharp';
import { createStudentsModule } from '../index.js';
import { createStudentAvatarReader, maxStudentAvatarBytes } from '../repositories/student-avatar.repository.js';
import { studentAvatarThumbnail } from '../services/student-avatar.service.js';
import { errorHandler } from '../../../shared/middlewares/error-handler.middleware.js';
import { AppError } from '../../../shared/errors/app-error.js';

const claims = { channel: 'student', authMethod: 'sso', identity: { microsoftId: '000000001@sv1.dut.udn.vn' } };
const portrait = () => sharp({ create: { width: 480, height: 640, channels: 3, background: '#294ca5' } }).png().toBuffer();

async function api(t, readAvatar, user = claims) {
  const calls = [];
  const module = createStudentsModule({
    authService: { verifyToken: async token => { if (token !== 'valid') throw new AppError('Invalid session', 401); return user; } },
    readAvatar: async number => { calls.push(number); return readAvatar(); },
  });
  const app = express(); app.use(module.basePath, module.router); app.use(errorHandler);
  const server = createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => { server.closeAllConnections(); return new Promise(resolve => server.close(resolve)); });
  return { calls, get: (path = 'avatar', token = 'valid') => fetch(`http://127.0.0.1:${server.address().port}/api/students/me/${path}`, { headers: { Authorization: `Bearer ${token}` } }) };
}

test('own avatar is a small JPEG with no metadata; original profile remains separate', async t => {
  const bytes = await sharp(await portrait()).withExifMerge({ IFD0: { Artist: 'PRIVATE METADATA' } }).toBuffer();
  const f = await api(t, () => bytes);
  const response = await f.get();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'image/jpeg');
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  const metadata = await sharp(Buffer.from(await response.arrayBuffer())).metadata();
  assert.equal(metadata.format, 'jpeg'); assert.equal(metadata.width, 192); assert.equal(metadata.height, 256);
  assert.equal(metadata.exif, undefined);
  assert.deepEqual(f.calls, ['000000001']);
});

test('empty/corrupt/oversized/unsupported portraits give 204 without a mock image', async t => {
  for (const bytes of [null, Buffer.alloc(0), Buffer.from('not an image'), Buffer.alloc(maxStudentAvatarBytes + 1), Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"/>')]) {
    const f = await api(t, () => bytes); const response = await f.get();
    assert.equal(response.status, 204); assert.equal((await response.arrayBuffer()).byteLength, 0);
  }
  const tiny = await sharp({ create: { width: 24, height: 32, channels: 3, background: 'white' } }).png().toBuffer();
  assert.equal((await sharp(await studentAvatarThumbnail(tiny)).metadata()).width, 24);
});

test('avatar rejects identity selectors, invalid sessions and non-student SSO before SQL', async t => {
  const f = await api(t, portrait);
  assert.equal((await f.get('avatar?studentNumber=000000002')).status, 400);
  assert.equal((await f.get('avatar/000000002')).status, 404);
  assert.equal((await f.get('avatar', 'invalid')).status, 401);
  assert.deepEqual(f.calls, []);
  for (const user of [{ ...claims, channel: 'staff' }, { ...claims, authMethod: 'password' }, { ...claims, identity: { microsoftId: 'other@example.com' } }]) {
    const invalid = await api(t, portrait, user);
    assert.equal((await invalid.get()).status, 403); assert.deepEqual(invalid.calls, []);
  }
});

test('avatar school failures remain retryable and do not leak SQL details', async t => {
  const f = await api(t, () => { throw new Error('SQL SECRET password'); });
  const response = await f.get(); assert.equal(response.status, 503);
  assert(!(await response.text()).includes('SECRET'));
});

function reader(results) {
  const calls = [];
  const read = createStudentAvatarReader({ connect: async (account, database) => ({ request() {
    const params = {};
    const request = { input(name, _type, value) { params[name] = value; return request; }, async query(statement) {
      assert.equal(account, 'secondary'); assert(!/\b(INSERT|UPDATE|DELETE|EXEC|MERGE)\b/i.test(statement));
      assert(statement.includes('WHERE h.SoTheSV=@number')); assert(statement.includes('DATALENGTH(h.Anh) BETWEEN 1 AND @maxBytes'));
      calls.push({ database, params }); return { recordset: results[database] ?? [] };
    } }; return request;
  } }) });
  return { read, calls };
}
const row = (Photo = null, MaHS = 'verified-id') => ({ MaHS, SoTheSV: '000000001', Photo });

test('portrait reader binds verified MSSV, checks both sources and skips fallback when current photo exists', async () => {
  const photo = await portrait();
  const f = reader({ tmProxDUT: [row()], DATA_GVien1: [row(photo)] });
  assert.deepEqual(await f.read('000000001'), photo);
  assert.deepEqual(f.calls.map(c => c.database), ['tmProxDUT', 'DATA_GVien1']);
  assert(f.calls.every(c => c.params.number === '000000001' && c.params.maxBytes === maxStudentAvatarBytes));
  const current = reader({ tmProxDUT: [row(photo)] }); await current.read('000000001'); assert.equal(current.calls.length, 1);
  const empty = reader({ tmProxDUT: [row()], DATA_GVien1: [row()] }); assert.equal(await empty.read('000000001'), null);
});

test('portrait reader rejects ambiguous/mismatched profiles and invalid MSSV', async () => {
  for (const results of [
    { tmProxDUT: [row(), row()] },
    { tmProxDUT: [{ ...row(), SoTheSV: '000000002' }] },
    { tmProxDUT: [row()], DATA_GVien1: [row(await portrait(), 'another-id')] },
  ]) await assert.rejects(reader(results).read('000000001'), error => error.statusCode === 409);
  const f = reader({}); await assert.rejects(f.read("000000001' OR 1=1"), error => error.statusCode === 403); assert.equal(f.calls.length, 0);
});
