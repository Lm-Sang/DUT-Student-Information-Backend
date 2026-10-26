import assert from 'node:assert/strict';
import { randomUUID, createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { queryLocalDatabase, disconnectLocalDatabase } from '../src/infrastructure/database/local-sql-server.js';
import { assertLocalDemoTarget, localDatabaseGuardSql } from '../src/infrastructure/database/local-write-guard.js';
import { cleanupRequests } from './lib/cleanup-requests.js';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { performance } from 'node:perf_hooks';

const port = Number(process.env.DEMO_API_PORT || 3003);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid local test port');
const root = `http://127.0.0.1:${port}/api/demo/student-requests`;
const ids = [];
let checks = 0;
const downloadTimes = [], printTimes = [];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
async function api(path, token, body, status = 200) {
  const response = await fetch(root + path, { method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const result = await response.json(); assert.equal(response.status, status, JSON.stringify(result)); checks++;
  return result.data;
}
async function file(request, token, status = 200) {
  const started = performance.now();
  const response = await fetch(`${root}/requests/${request.id}/file`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  assert.equal(response.status, status); checks++;
  const bytes = Buffer.from(await response.arrayBuffer());
  if (status === 200) {
    downloadTimes.push(performance.now() - started);
    assert.equal(response.headers.get('content-type'), 'application/pdf');
    assert(response.headers.get('content-disposition').includes(request.formFile.filename));
    assert.equal(bytes.subarray(0, 5).toString(), '%PDF-');
    assert.equal(request.formFile.generation, 'ON_DOWNLOAD');
    assert.equal(response.headers.get('x-content-sha256'), sha(bytes));
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
  }
  return bytes;
}
async function pdfText(bytes) {
  const task = getDocument({ data: new Uint8Array(bytes), useSystemFonts: true });
  try {
    const pdf = await task.promise, text = [];
    for (let page = 1; page <= pdf.numPages; page++) text.push((await (await pdf.getPage(page)).getTextContent()).items.map(item => item.str).join(' '));
    return text.join(' ').replace(/\s+/g, ' ');
  } finally { await task.destroy(); }
}
async function assertNotStored() {
  const result = (await queryLocalDatabase(`SELECT t.name AS TableName,c.name AS ColumnName FROM sys.tables t JOIN sys.schemas s ON s.schema_id=t.schema_id
    LEFT JOIN sys.columns c ON c.object_id=t.object_id WHERE s.name='svc_demo' AND (t.name='RequestFile' OR c.name LIKE '%Json%' OR c.name='PdfBytes')`)).first;
  assert.deepEqual(result, [], 'demo schema must not store JSON payloads or PDF files'); checks++;
}
try {
  assertLocalDemoTarget();
  await mkdir('.data/research/filled-pdf-qa', { recursive: true });
  const [sv, other, ctsv, dt] = await Promise.all(['student-a', 'student-b', 'staff-ctsv', 'staff-dt'].map(async actorId => (await api('/session', null, { actorId })).token));
  const catalog = await api('/catalogs', sv), profile = await api('/profile', sv);
  assert(profile.isSimulation); assert(!Object.hasOwn(profile, 'photoBase64'));
  const forms = [
    ['DonSV01', { reasonCode: 'LOST_OR_DAMAGED' }],
    ['DonSV01', { reasonCode: 'CHANGE_INFO', changeDescription: 'Cập nhật thông tin trên thẻ: '.repeat(65) }],
    ['DonSV03', { expectedTerm: catalog.nextTerm }],
    ['DonSV04', { targetTerm: catalog.currentTerm, reason: 'Tiếp tục học cải thiện để nâng điểm trung bình tích lũy.' }],
    ['DonSV05', { reviewTerm: catalog.currentTerm, reason: 'Đề nghị xét học bổng khuyến khích học tập theo kết quả học kỳ.' }],
    ['DonSV07', { startTerm: catalog.nextTerm, programCode: catalog.programs[0].code }],
    ['DonSV06', { reasonCode: 'LH002', reasonDetail: 'Thông tin chuyển trường thử nghiệm.' }],
  ];
  let first;
  for (const [index, [typeCode, payload]] of forms.entries()) {
    const body = { typeCode, payload, idempotencyKey: randomUUID() };
    const request = await api('/requests', sv, body, 201); ids.push(request.id); first ||= request;
    assert(request.formFile.canDownload);
    const bytes = await file(request, sv);
    await writeFile(`.data/research/filled-pdf-qa/${typeCode}-${index}.pdf`, bytes);
    const text = await pdfText(bytes);
    assert(text.includes(profile.name)); assert(text.includes(profile.studentNumber));
    assert.equal(await pdfText(await file(request, sv)), text, 'repeat downloads retain form content and original creation time');
    const replay = await api('/requests', sv, body, 201);
    assert.equal(replay.id, request.id); assert.equal(replay.createdAt, request.createdAt);
    const persisted = (await queryLocalDatabase('SELECT * FROM svc_demo.His_InDon WHERE ID=?', [request.id])).first[0];
    assert(persisted); await assertNotStored();
    await file(request, other, 404);
    await file(request, request.department === 'CTSV' ? dt : ctsv, 404);
    let received = await api(`/requests/${request.id}/actions`, request.department === 'CTSV' ? ctsv : dt,
      { action: 'receive', version: request.version, idempotencyKey: randomUUID() });
    if(index!==1){
      const printStarted = performance.now();
      const printResponse=await fetch(root+'/requests/'+request.id+'/print',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+(request.department==='CTSV'?ctsv:dt)},body:JSON.stringify({version:received.version,idempotencyKey:randomUUID()})});
      assert.equal(printResponse.status,200);await printResponse.arrayBuffer();printTimes.push(performance.now()-printStarted);checks++;received=await api('/requests/'+request.id,sv);
    }
    const handled = await api(`/requests/${request.id}/actions`, request.department === 'CTSV' ? ctsv : dt,
      { action: index === 1 ? 'cancel' : 'complete', message: 'Kiểm thử xuất PDF local.', version: received.version, idempotencyKey: randomUUID() });
    if (index === 1) { assert(!handled.formFile.canDownload); await file(handled, sv, 404); }
    else assert.equal(await pdfText(await file(handled, sv)), text);
  }
  await file(first, null, 401);
  const studentCancelled = await api('/requests', sv, { typeCode: 'DonSV01', payload: { reasonCode: 'LOST_OR_DAMAGED' }, idempotencyKey: randomUUID() }, 201); ids.push(studentCancelled.id);
  const cancelled = await api(`/requests/${studentCancelled.id}/actions`, sv, { action: 'cancel', version: 1, idempotencyKey: randomUUID() });
  assert.equal(cancelled.cancelReason, null);
  await file(cancelled, sv, 404);
  const nonPaper = await api('/requests', sv, { typeCode: 'LMS_SUPPORT', payload: {}, idempotencyKey: randomUUID() }, 201); ids.push(nonPaper.id);
  assert.equal(nonPaper.formFile, null); await file(nonPaper, sv, 404);
  await assertNotStored();
  console.log(`PDF workflow passed: ${checks} HTTP/SQL checks; on-download generation, repeat content, typed fields, no JSON/PDF storage, replay, owner/scope and both cancellation roles; ${forms.length} PDFs exported for QA.`);
  const timing = values => { const ordered = [...values].sort((a,b) => a-b); return { samples: values.length,
    medianMs: Math.round(ordered[Math.floor(ordered.length / 2)]), maxMs: Math.round(ordered.at(-1)) }; };
  console.log(JSON.stringify({ download: timing(downloadTimes), staffPrint: timing(printTimes) }));
} finally {
  await cleanupRequests(ids);
  await disconnectLocalDatabase();
}
