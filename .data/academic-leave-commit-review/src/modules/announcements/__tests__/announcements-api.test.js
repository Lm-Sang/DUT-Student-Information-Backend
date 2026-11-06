import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { test } from 'node:test';

import { createApp } from '../../../app.js';
import { createAnnouncementsModule } from '../index.js';
import { createAnnouncementsRepository } from '../repositories/announcements.repository.js';

const announcement = {
  ID: 5461, MaThongBao: '2610SV00004 ', Tieude: 'Th%c3%b4ng+b%c3%a1o',
  Noidung: '%3cp%3eN%e1%bb%99i+dung%3c%2fp%3e',
  Ngaydang: new Date('2026-10-10T09:46:53.663Z'), Nguoidang: 'admin ',
  LinhVuc: 'SV ', LinhVucCT: null,
};

async function fixture(t, repository) {
  const app = createApp({ announcementsModule: createAnnouncementsModule({ repository }) });
  const server = createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => {
    server.close(resolve);
    server.closeAllConnections();
  }));
  return `http://127.0.0.1:${server.address().port}/api/public/announcements`;
}

test('GET announcements paginates summaries and decodes stored text', async (t) => {
  const calls = [];
  const base = await fixture(t, {
    async list(input) { calls.push(input); return { totalRecords: 21, rows: [announcement] }; },
    async getById(id) { calls.push(id); return announcement; },
  });
  const list = await fetch(`${base}?pageIndex=2&pageSize=10`);
  assert.equal(list.status, 200);
  assert.equal(list.headers.get('cache-control'), 'no-store');
  assert.deepEqual((await list.json()).data, {
    items: [{ id: 5461, code: '2610SV00004', title: 'Thông báo',
      postedAt: '2026-10-10T09:46:53.663Z', author: 'admin', category: 'SV', subcategory: null }],
    totalRecords: 21, pageIndex: 2, pageSize: 10, totalPages: 3,
  });
  const detail = await fetch(`${base}/5461`);
  assert.equal(detail.status, 200);
  assert.equal((await detail.json()).data.contentHtml, '<p>Nội dung</p>');
  assert.deepEqual(calls, [{ pageIndex: 2, pageSize: 10 }, 5461]);
});

test('invalid pagination, unknown filters and non-GET requests never query SQL', async (t) => {
  let calls = 0;
  const repository = {
    async list() { calls++; return { totalRecords: 0, rows: [] }; },
    async getById() { calls++; return null; },
  };
  const base = await fixture(t, repository);
  for (const path of ['?pageIndex=0', '?pageIndex=1.5', '?pageSize=101',
    '?pageSize=10&pageSize=20', '?other=1', '/abc', '/2147483648']) {
    const response = await fetch(base + path);
    assert.equal(response.status, 400, path);
  }
  assert.equal((await fetch(base, { method: 'POST' })).status, 404);
  assert.equal(calls, 0);
  assert.equal((await fetch(`${base}/1`)).status, 404);
  assert.equal(calls, 1);
});

test('SQL queries use DATA_SV1, bind pagination and exclude hidden notices', async () => {
  const calls = [];
  const repository = createAnnouncementsRepository({
    async connect(account, database) {
      assert.deepEqual([account, database], ['secondary', 'DATA_SV1']);
      return {
        request() {
          const inputs = {};
          return {
            input(name, _type, value) { inputs[name] = value; return this; },
            async query(statement) {
              calls.push({ statement, inputs });
              if (statement.includes('COUNT_BIG')) return { recordset: [{ totalRecords: 1 }] };
              return { recordset: [announcement] };
            },
          };
        },
      };
    },
  });
  const list = await repository.list({ pageIndex: 3, pageSize: 20 });
  assert.equal(list.totalRecords, 1);
  assert.deepEqual(calls[1].inputs, { offset: 40, pageSize: 20 });
  const detail = await repository.getById(5461);
  assert.equal(detail.ID, 5461);
  assert.deepEqual(calls[2].inputs, { id: 5461 });
  for (const { statement } of calls) {
    assert.match(statement, /Hide IS NULL OR Hide = 0/);
    assert.match(statement, /Ngaydang <= GETDATE\(\)/);
    assert.ok(!/\b(?:INSERT|UPDATE|DELETE|EXEC)\b/i.test(statement));
  }
  assert.match(calls[1].statement, /ORDER BY Ngaydang DESC, ID DESC/);
  assert.ok(!calls[1].statement.includes('Noidung'));
});
