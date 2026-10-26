import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getDocument, OPS } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from '@napi-rs/canvas';
import { formDate, paperTemplates, renderPaperPdf } from '../services/paper-pdf.renderer.js';
import { createPaperFilesService } from '../services/paper-files.service.js';
import { createRequestsService } from '../services/requests.service.js';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

async function readPdf(bytes) {
  const task = getDocument({ data: new Uint8Array(bytes), useSystemFonts: true });
  const pdf = await task.promise;
  const pages = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    const page = await pdf.getPage(n); pages.push((await page.getTextContent()).items);
  }
  await task.destroy(); return pages;
}
const snapshot = { createdAt: '2026-10-24T17:05:00Z', profile: { name: 'Sinh viên kiểm thử', studentNumber: 'TEST0001',
  className: 'DEMO', dateOfBirth: '01/01/2004', phone: '0000000000', identityNumber: '000000000001',
  photoKind: 'DEMO', academic: {}, semesterResults: [] }, values: { changeDescription: 'Cập nhật tên trên thẻ.',
  expectedTerm: 'Học kỳ 2 năm học 2026-2027', targetTerm: 'Học kỳ 1 năm học 2026-2027', reviewTerm: 'Học kỳ 1 năm học 2026-2027',
  startTerm: 'Học kỳ 2 năm học 2026-2027', programName: 'Công nghệ thông tin', reason: 'Lý do kiểm thử.', withdrawalReason: 'Chuyển trường', reasonDetail: '' } };

test('form date is fixed at creation time in Vietnam even across a UTC date boundary', () => {
  assert.equal(formDate(snapshot.createdAt).footer, '00:05 25/10/2026');
});

test('all six PDF forms contain Vietnamese text, matching code and creation timestamp on every page', async () => {
  for (const template of paperTemplates) {
    const result = await renderPaperPdf({ template, snapshot });
    assert.equal(result.bytes.subarray(0, 5).toString(), '%PDF-');
    const pages = await readPdf(result.bytes); assert.equal(pages.length, result.pageCount);
    const all = pages.flat().map(i => i.str).join(' ').replace(/\s+/g, ' ');
    assert(!/Z\d{3}Z|\{\{\w+\}\}/.test(all), 'build-time markers never leak into student files');
    assert(all.includes('Sinh viên kiểm thử')); assert(all.includes('TEST0001'));
    for (const items of pages) {
      const footer = items.filter(i => i.transform[5] < 40).map(i => i.str).join(' ');
      assert(footer.includes(template.code)); assert(footer.includes('00:05 25/10/2026'));
      assert(items.every(i => i.transform[4] >= 0 && i.transform[4] + i.width <= 596), 'no text extends beyond the page');
    }
    assert(pages[0].map(i => i.str).join(' ').replace(/\s+/g, ' ').includes('CỘNG HÒA'));
    for (const stale of ['Trần Anh Khoa', 'Trần Ngọc Tiến', '0947070042', '046204013407', 'Paragraphs are the']) assert(!all.includes(stale));
  }
});

test('all seven compiled layouts match the neutral sources and keep fixed header anchors', async () => {
  const root = new URL('../../../../assets/request-forms/', import.meta.url);
  for (const template of paperTemplates) for (const reasonCode of template.code === 'DonSV01' ? ['LOST_OR_DAMAGED', 'CHANGE_INFO'] : ['']) {
    const stem = `${template.code}-${template.slug}${reasonCode === 'CHANGE_INFO' ? '-thay-doi-thong-tin' : ''}`;
    const layout = JSON.parse(readFileSync(new URL(`layouts/${stem}.json`, root)));
    assert.equal(createHash('sha256').update(readFileSync(new URL(`docx/${stem}.docx`, root))).digest('hex'), layout.sourceSha256);
    const result = await renderPaperPdf({ template, snapshot: { ...snapshot, payload: { reasonCode } } });
    const pages = await readPdf(result.bytes);
    for (const anchor of layout.pages[0].spans.filter(s => s.t.includes('CỘNG HÒA') || s.t.startsWith('ĐƠN ') || s.t.startsWith('Tôi tên là:'))) {
      const item = pages[0].find(i => i.str.startsWith(anchor.t.trim()));
      assert(item, `missing ${stem} fixed anchor`);
      assert(Math.abs(item.transform[4] - anchor.x) < 0.25);
      assert(Math.abs(layout.pages[0].height - item.transform[5] - anchor.y) < 0.25);
    }
  }
});

test('24 semester rows remain readable, complete and repeat the table header across pages', async () => {
  for (const code of ['DonSV06', 'DonSV07']) {
    const semesterResults = Array.from({ length: 24 }, (_, i) => ({ termName: `Kỳ ${i + 1} năm học 2025-2026`, credits: i + 101, gpa: 3.2, cumulativeGpa: 3.3, conductScore: 85 }));
    const result = await renderPaperPdf({ template: paperTemplates.find(t => t.code === code), snapshot: {
      ...snapshot, profile: { ...snapshot.profile, semesterResults } } });
    const pages = await readPdf(result.bytes);
    const all = pages.flat().map(i => i.str).join(' ');
    for (let i = 0; i < 24; i++) assert(all.includes(String(i + 101)), `missing semester row ${i + 1}`);
    for (const page of pages) {
      const rows = page.filter(i => /^1(?:0\d|1\d|2[0-4])$/.test(i.str));
      if (!rows.length) continue;
      assert(page.some(i => i.str.includes('Học kỳ/ năm học')));
      assert(rows.every(i => i.height >= 10 && i.transform[5] > 44), 'table rows stay legible and above footer');
    }
  }
});

test('long card changes flow to additional pages with an intact confirmation block and footer', async () => {
  const template = paperTemplates.find(t => t.code === 'DonSV01');
  for (const changeDescription of ['Thông tin cập nhật sinh viên. '.repeat(65) + 'A'.repeat(250),
    'Cập nhật thông tin trên thẻ: '.repeat(65)]) {
  const result = await renderPaperPdf({ template, snapshot: { ...snapshot, payload: { reasonCode: 'CHANGE_INFO' },
    values: { ...snapshot.values, changeDescription } } });
  const pages = await readPdf(result.bytes); assert(pages.length >= 2);
  const last = pages.at(-1).map(i => i.str).join(' ').replace(/\s+/g, ' ');
  assert(last.includes('XÁC NHẬN CỦA NHÀ TRƯỜNG')); assert(last.includes('LÂM THỊ HỒNG NHẬT'));
  assert(last.includes('Kính đơn')); assert(last.includes('Sinh viên kiểm thử'));
  assert(last.includes('Đà Nẵng, ngày 25 tháng 10 năm 2026'), 'date, signature and photo anchor move together');
  for (const items of pages) assert(items.every(i => i.transform[4] + i.width <= 596));
  }
});

const actor = { id: 'test', role: 'STUDENT' };
function fileRepository(overrides = {}) {
  const row = { Id: 'test-id', TypeCode: 'DonSV07', Status: 'SUBMITTED', StudentId: 'test', StudentNumber: 'TEST0001',
    Department: 'DT', Version: 1, CreatedAt: snapshot.createdAt, Payload: { programCode: 'CS', startTerm: '2620' } };
  return { get: async () => row, profile: async () => ({ ...snapshot.profile, source: 'LOCAL_DEMO' }),
    catalogs: async () => ({ programs: [{ code: 'CS', name: 'Tên CTĐT từ danh mục' }], terms: [{ code: '2620', name: 'Học kỳ kế tiếp' }] }), ...overrides };
}
test('downloads obtain current server profile and catalog labels; no file or JSON is persisted', async () => {
  let rendered, count = 0, name = snapshot.profile.name;
  const repo = fileRepository({ profile: async () => ({ ...snapshot.profile, name }) });
  const service = createPaperFilesService(repo, { renderer: async input => {
    count++; rendered = input; return { bytes: Buffer.from('%PDF-test-' + name), pageCount: 1 };
  } });
  const file = await service.download(actor, 'test-id');
  assert.equal(rendered.snapshot.profile.name, name);
  assert.equal(rendered.snapshot.values.programName, 'Tên CTĐT từ danh mục');
  assert.equal(rendered.snapshot.values.startTerm, 'Học kỳ kế tiếp');
  assert.equal(rendered.snapshot.createdAt, snapshot.createdAt);
  assert.equal(file.sha256, createHash('sha256').update(file.bytes).digest('hex'));
  name = 'Tên hồ sơ đã cập nhật';
  await service.download(actor, 'test-id');
  assert.equal(rendered.snapshot.profile.name, name); assert.equal(count, 2);
  const invalid = createPaperFilesService(fileRepository({ profile: async () => ({ ...snapshot.profile, studentNumber: 'OTHER' }) }));
  await assert.rejects(() => invalid.download(actor, 'test-id'), e => e.statusCode === 422);
});

test('creating a paper request saves fields without invoking the PDF renderer', async () => {
  let writes = 0, saved;
  const repo = fileRepository({ receipt: async () => null, catalogs: async () => ({ settings: [{ SettingKey: 'currentTerm', SettingValue: '2610' }],
    terms: [{ code: '2610', sortOrder: 1, selectable: true }], programs: [] }),
    create: async input => { writes++; saved = input; return 'test-id'; } });
  const service = createRequestsService(repo, { paperFiles: { prepare: () => { throw new Error('must not render'); } } });
  const request = await service.create(actor, { typeCode: 'DonSV01', payload: { reasonCode: 'LOST_OR_DAMAGED' }, idempotencyKey: 'key' });
  assert.equal(writes, 1); assert.equal(saved.payload.reasonCode, 'LOST_OR_DAMAGED');
  assert.equal(request.formFile.generation, 'ON_DOWNLOAD'); assert(!Object.hasOwn(saved, 'file'));
});

test('download rejects revoked access, cancelled requests and concurrent changes after rendering', async () => {
  for (const [patch, status] of [[{ Status: 'CANCELLED' }, 404], [{ StudentId: 'other' }, 404], [{ Version: 2 }, 409]]) {
    const repo = fileRepository(); const original = await repo.get(); let reads = 0;
    repo.get = async () => ++reads === 1 ? original : { ...original, ...patch };
    const service = createPaperFilesService(repo, { renderer: async () => ({ bytes: Buffer.from('%PDF-test') }) });
    await assert.rejects(() => service.download(actor, 'test-id'), e => e.statusCode === status);
  }
  let rendered = false;
  const repo = fileRepository(); const row = await repo.get();
  for (const patch of [{ Status: 'CANCELLED' }, { StudentId: 'other' }, { TypeCode: 'CONFIRMATION' }]) {
    const service = createPaperFilesService({ ...repo, get: async () => ({ ...row, ...patch }) }, {
      renderer: async () => { rendered = true; return {}; } });
    await assert.rejects(() => service.download(actor, 'test-id'), e => e.statusCode === 404);
  }
  assert.equal(rendered, false);
});

test('a server-managed PNG is embedded in the card form, and malformed photo bytes are rejected', async () => {
  const canvas = createCanvas(30, 40); canvas.getContext('2d').fillRect(0, 0, 30, 40);
  const photo = canvas.toBuffer('image/png');
  const result = await renderPaperPdf({ template: paperTemplates[0], snapshot, photo });
  const task = getDocument({ data: new Uint8Array(result.bytes) });
  const pdf = await task.promise;
  const operators = await (await pdf.getPage(1)).getOperatorList();
  assert(operators.fnArray.includes(OPS.paintImageXObject)); await task.destroy();
  const files = createPaperFilesService(fileRepository({ profile: async () => ({ ...snapshot.profile, photoBase64: Buffer.from('not an image').toString('base64') }) }));
  await assert.rejects(() => files.download(actor, 'test-id'), e => e.statusCode === 422);
});
