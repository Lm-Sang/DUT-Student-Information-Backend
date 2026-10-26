import { cleanupRequests } from './lib/cleanup-requests.js';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { queryLocalDatabase, disconnectLocalDatabase } from '../src/infrastructure/database/local-sql-server.js';
import { assertLocalDemoTarget, localDatabaseGuardSql } from '../src/infrastructure/database/local-write-guard.js';

const port = Number(process.env.DEMO_API_PORT || 3003);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid local test port');
const base = `http://127.0.0.1:${port}/api/demo/student-requests`;
const created = new Set();
let checks = 0;
async function call(path, actor, body, expected = 200, method = body ? 'POST' : 'GET') {
  const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json',
    ...(actor ? { Authorization: `Bearer ${actor}` } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const result = await response.json();
  assert.equal(response.status, expected, `${path}: ${JSON.stringify(result)}`);
  checks++;
  return result.data;
}
async function session(actorId) { return (await call('/session', null, { actorId })).token; }
async function create(token, typeCode, payload) {
  const body = { typeCode, payload, idempotencyKey: randomUUID() };
  const request = await call('/requests', token, body, 201); created.add(request.id);
  return { request, body };
}
async function printRequest(token,request){
  const response=await fetch(base+'/requests/'+request.id+'/print',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({version:request.version,idempotencyKey:randomUUID()})});
  assert.equal(response.status,200);await response.arrayBuffer();checks++;return call('/requests/'+request.id,token);
}
async function action(token, request, kind, extra = {}, expected = 200) {
  return call(`/requests/${request.id}/actions`, token, { action: kind, version: request.version,
    idempotencyKey: randomUUID(), ...extra }, expected);
}
try {
  assertLocalDemoTarget();
  const [sv, other, cv, cvOther, dt, lms] = await Promise.all(['student-a', 'student-b', 'staff-ctsv', 'staff-ctsv-b', 'staff-dt', 'staff-lms'].map(session));
  const catalog = await call('/catalogs', sv);
  assert.equal(catalog.terms.find(t => t.isCurrent).code, catalog.currentTerm);
  assert.equal(catalog.terms.at(-1).code, catalog.nextTerm);
  assert(catalog.programs.length > 0);
  await call('/session', null, { actorId: 'student-a', role: 'STAFF' }, 400);
  const payload = { reasonCode: 'CHANGE_INFO', changeDescription: 'Kiểm thử Unicode: đổi thông tin thẻ sinh viên.' };
  await call('/requests', sv, { typeCode: 'DonSV01', payload: { reasonCode: 'CHANGE_INFO' }, idempotencyKey: randomUUID() }, 400);
  const first = await create(sv, 'DonSV01', payload);
  assert.equal(first.request.payload.changeDescription, payload.changeDescription);
  const replay = await call('/requests', sv, first.body, 201); assert.equal(replay.id, first.request.id);
  await call('/requests', sv, { ...first.body, payload: { ...payload, changeDescription: 'Khác' } }, 409);
  await call(`/requests/${first.request.id}`, other, undefined, 404);
  await call(`/requests/${first.request.id}`, dt, undefined, 404);
  await action(sv, first.request, 'receive', {}, 403);
  let cancelled = await action(sv, first.request, 'cancel', {});
  assert.equal(cancelled.cancelledByRole, 'STUDENT');
  let detail = await call(`/requests/${cancelled.id}`, sv);
  assert.equal(detail.events.at(-1).type, 'CANCELLED_BY_STUDENT');
  assert.equal(detail.cancelReason, null);
  await action(cv, cancelled, 'receive', {}, 403);

  const second = await create(sv, 'DonSV01', payload);
  cancelled = await action(cv, second.request, 'cancel', { message: 'Chuyên viên hủy vì hồ sơ trùng.' });
  detail = await call(`/requests/${cancelled.id}`, sv);
  assert.equal(detail.cancelledByRole, 'STAFF'); assert.equal(detail.events.at(-1).type, 'CANCELLED_BY_STAFF');

  const third = await create(sv, 'DonSV01', payload);
  assert.equal(third.request.submissionMode, 'PAPER_FORM');
  assert.equal(third.request.formFile.canDownload, true);
  assert.equal(third.request.formFile.status, 'AVAILABLE');
  assert.equal(third.request.formFile.generation, 'ON_DOWNLOAD');
  await action(cv, third.request, 'complete', {}, 403);
  let receivedThird = await action(cv, third.request, 'receive');
  await action(cv,receivedThird,'complete',{},403);
  receivedThird=await printRequest(cv,receivedThird);
  await action(cv, receivedThird, 'requestInfo', { message: 'Không dùng luồng bổ sung web cho đơn giấy.', requiredFields: ['changeDescription'] }, 403);
  await action(cv, receivedThird, 'result', { message: 'Không dùng trả kết quả web cho đơn giấy.' }, 403);
  let r = await action(cv, receivedThird, 'complete', { message: 'Đã xử lý hồ sơ giấy thực tế (mẫu).' });
  assert.equal(r.status, 'COMPLETED'); assert.equal(r.statusLabel, 'Đã xử lý'); assert(r.receivedAt);
  const seenByOtherStaff = await call(`/requests/${r.id}`, cvOther); assert.deepEqual(seenByOtherStaff.actions, []);
  await action(cvOther, r, 'cancel', { message: 'Không phụ trách' }, 403);
  detail = await call(`/requests/${r.id}`, sv); assert.equal(detail.revisions.length, 1);
  assert.equal(detail.revisions[0].payload.changeDescription, payload.changeDescription);
  await action(cv, third.request, 'cancel', { message: 'Dùng phiên bản cũ' }, 409);

  const raceRequest = await create(sv, 'DonSV01', { reasonCode: 'LOST_OR_DAMAGED', changeDescription: '' });
  const race = await Promise.all([cv, cvOther].map(token => fetch(base + `/requests/${raceRequest.request.id}/actions`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ action: 'receive', version: 1, idempotencyKey: randomUUID() }),
  })));
  const raceStatuses = race.map(response => response.status).sort();
  assert.deepEqual(raceStatuses, [200, 409]); checks++;
  let raceDetail = await call(`/requests/${raceRequest.request.id}`, sv);
  assert.equal(raceDetail.events.filter(event => event.type === 'RECEIVE').length, 1);
  raceDetail=await printRequest(raceDetail.assignedStaffId === 'staff-ctsv' ? cv : cvOther,raceDetail);
  await action(raceDetail.assignedStaffId === 'staff-ctsv' ? cv : cvOther, raceDetail, 'complete');

  for (const [type, value] of [
    ['DonSV03', { expectedTerm: catalog.nextTerm }], ['DonSV04', { targetTerm: catalog.currentTerm, reason: 'Lý do hoãn thử nghiệm.' }],
    ['DonSV05', { reviewTerm: catalog.nextTerm, reason: 'Lý do xét khuyến học thử nghiệm.' }],
    ['DonSV07', { programCode: catalog.programs[0].code, startTerm: catalog.nextTerm }],
    ['DonSV06', { reasonCode: 'LH001', reasonDetail: 'Đơn thử nghiệm, không có hiệu lực thật.' }],
  ]) { await create(sv, type, value); }
  await call('/requests', sv, { typeCode: 'DonSV03', payload: { expectedTerm: '9999' }, idempotencyKey: randomUUID() }, 400);
  await call(`/requests/${third.request.id}/actions`, cv, { action: 'approve', version: r.version, idempotencyKey: randomUUID() }, 400);

  // The document and account-support flows use separate typed local details.
  const transcript = { documentCode: '04', quantity: 2, feeMode: 'PAID', serviceSpeed: 'NORMAL',
    periodTerm: catalog.currentTerm, academicYear: '', additionalInfo: 'Bảng điểm học kỳ - kiểm thử local.' };
  assert(catalog.documents.some(document => document.code === '04'));
  await call('/requests', sv, { typeCode: 'CONFIRMATION', payload: { ...transcript, unitFee: 1 }, idempotencyKey: randomUUID() }, 400);
  await call('/requests', sv, { typeCode: 'CONFIRMATION', payload: { ...transcript, documentCode: '14' }, idempotencyKey: randomUUID() }, 400);
  const doc = await create(sv, 'CONFIRMATION', transcript);
  assert.equal(doc.request.department, 'DT'); assert.equal(doc.request.catalogSnapshot.quantity, 2);
  assert.equal(doc.request.catalogSnapshot.totalFee, doc.request.catalogSnapshot.unitFee * 2);
  await call(`/requests/${doc.request.id}`, cv, undefined, 404);
  let document = await action(dt, doc.request, 'receive');
  await action(dt, document, 'requestInfo', { message: 'Không được chuyển loại giấy sau khi gửi.', requiredFields: ['documentCode'] }, 403);
  await action(dt, document, 'requestInfo', { message: 'Không yêu cầu năm học ở form bảng điểm học kỳ.', requiredFields: ['academicYear'] }, 403);
  await action(dt,document,'start',{},403);
  await action(dt,document,'external',{message:'Không có bước phụ.'},403);
  await action(sv,document,'supplement',{payload:transcript},403);
  const printedAt = new Date().toISOString(), pickupAt = new Date(Date.now() + 86400000).toISOString();
  await action(dt, document, 'result', { printedAt, pickupAt }, 400);
  await action(dt, document, 'result', {}, 403);
  const printResponse=await fetch(base+'/requests/'+document.id+'/print',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+dt},body:JSON.stringify({version:document.version,idempotencyKey:randomUUID()})});
  assert.equal(printResponse.status,200);assert.equal(printResponse.headers.get('content-type'),'application/pdf');await printResponse.arrayBuffer();checks++;
  document=await call('/requests/'+document.id,sv);assert(document.printedAt);assert.equal(document.status,'RECEIVED');assert.equal(document.pickupAt,null);
  const processCommand = { action: 'result', version: document.version, idempotencyKey: randomUUID() };
  document = await call(`/requests/${document.id}/actions`, dt, processCommand);
  assert(document.processedAt); assert(document.pickupAt); assert(document.printedAt);
  assert.equal(new Date(document.pickupAt) - new Date(document.processedAt), 2 * 86400000);
  assert.equal(document.appointment.status, 'SCHEDULED'); assert.equal(document.deliveredAt, null);
  const retried = await call(`/requests/${document.id}/actions`, dt, processCommand);
  assert.equal(retried.pickupAt, document.pickupAt); assert.equal(retried.version, document.version);
  await action(dt, document, 'result', {}, 403);
  await action(dt,document,'complete',{},403);assert.equal(document.status,'COMPLETED');assert(document.completedAt);assert.equal(document.deliveredAt,null);assert.equal(document.appointment.status,'SCHEDULED');assert.deepEqual(document.actions,[]);
  const nvqs = await create(sv, 'CONFIRMATION', { ...transcript, documentCode: '13', feeMode: 'FREE', additionalInfo: 'Xin xác nhận hoãn NVQS (mẫu).' });
  assert.equal(nvqs.request.department, 'CTSV'); assert.equal(nvqs.request.catalogSnapshot.eligibilityVerified, false);
  await action(cv, nvqs.request, 'cancel', { message: 'Hủy hồ sơ xác nhận mẫu bởi chuyên viên.' });

  const presetCancel = await create(sv, 'DonSV01', payload);
  await action(cv, presetCancel.request, 'cancel', { cancelReasonCode: 'UNKNOWN' }, 400);
  await action(cv, presetCancel.request, 'cancel', {}, 400);
  await action(sv, presetCancel.request, 'cancel', { cancelReasonCode: 'DUPLICATE' }, 400);
  const presetCancelled = await action(cv, presetCancel.request, 'cancel', { cancelReasonCode: 'DUPLICATE', message: 'Vui lòng theo dõi đơn trước.' });
  assert(presetCancelled.cancelReason.includes(catalog.cancellationReasons.find(reason => reason.code === 'DUPLICATE').name));
  detail = await call(`/requests/${presetCancelled.id}`, sv);
  assert.equal(detail.events.at(-1).details.cancelReasonCode, 'DUPLICATE');
  assert.equal(detail.events.at(-1).details.additionalMessage, 'Vui lòng theo dõi đơn trước.');

  const support = {};
  await call('/requests', sv, { typeCode: 'LMS_SUPPORT', payload: { ...support, MatKhauEmail: 'not-accepted' }, idempotencyKey: randomUUID() }, 400);
  const ticket = await create(sv, 'LMS_SUPPORT', support);
  assert.equal(ticket.request.department, 'IT');
  await call(`/requests/${ticket.request.id}`, cv, undefined, 404);
  await call(`/requests/${ticket.request.id}`, other, undefined, 404);
  let supportRequest = await action(lms, ticket.request, 'receive');
  assert.deepEqual(supportRequest.actions, ['result','cancel']);
  await action(lms, supportRequest, 'requestInfo', { message: 'Không yêu cầu thêm thông tin.', requiredFields: ['description'] }, 403);
  await action(sv, supportRequest, 'supplement', { payload: {} }, 403);
  await action(lms, supportRequest, 'result', {}, 400);
  supportRequest = await action(lms, supportRequest, 'result', { message: 'QA-FAKE-LMS-PASSWORD' });
  const supportDetail = await call(`/requests/${supportRequest.id}`, sv);
  assert.equal(supportDetail.revisions.length, 1); assert.equal(supportDetail.status, 'COMPLETED');
  assert(supportDetail.completedAt); assert.equal(supportDetail.resultSummary, 'QA-FAKE-LMS-PASSWORD');
  assert(!supportDetail.events.some(event => event.message.includes('QA-FAKE-LMS-PASSWORD')));
  const supportList = await call('/requests', sv);
  assert.equal(supportList.find(item => item.id === supportDetail.id).resultSummary, null);
  assert(!JSON.stringify(supportList).includes('QA-FAKE-LMS-PASSWORD'));

  const typed = (await queryLocalDatabase(`SELECT
    (SELECT COUNT(*) FROM svc_demo.DeNghiVanBan WHERE ID IN (?,?)) AS documents,
    (SELECT COUNT(*) FROM svc_demo.DeNghiEmail WHERE ID=?) AS support`, [doc.request.id, nvqs.request.id, ticket.request.id])).first[0];
  assert.equal(typed.documents, 2); assert.equal(typed.support, 1);
  console.log(`Live local workflow passed: ${checks} HTTP/concurrency checks; ${created.size} isolated requests.`);
} finally {
  // Only delete IDs generated by this smoke run, in the explicitly named local demo schema.
  await cleanupRequests([...created]);
  await disconnectLocalDatabase();
}

