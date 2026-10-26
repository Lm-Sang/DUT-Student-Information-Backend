import { assertLocalDemoTarget } from '../src/infrastructure/database/local-write-guard.js';

assertLocalDemoTarget();
const base = 'http://127.0.0.1:3003/api/demo/student-requests';
async function call(path, token, body) {
  const response = await fetch(base + path, { method: body ? 'POST' : 'GET', headers: {
    'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }, body: body ? JSON.stringify(body) : undefined });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || `HTTP ${response.status}`);
  return result.data;
}
const sessions = {};
for (const id of ['student-a', 'student-b', 'staff-ctsv', 'staff-dt', 'staff-lms']) sessions[id] = (await call('/session', null, { actorId: id })).token;
const catalog = await call('/catalogs', sessions['student-a']);
async function sample(key, typeCode, payload, student = 'student-a') {
  return call('/requests', sessions[student], { typeCode, payload, idempotencyKey: `sample-v1-${key}` });
}
async function step(request, actor, action, from, extra = {}) {
  if (request.status !== from) return request;
  return call(`/requests/${request.id}/actions`, sessions[actor], { action, version: request.version,
    idempotencyKey: `sample-v1-${request.id}-${action}`, ...extra });
}
await sample('card-info', 'DonSV01', { reasonCode: 'CHANGE_INFO', changeDescription: 'Dữ liệu mẫu: cần cập nhật thông tin in trên thẻ.' });
await sample('graduation', 'DonSV03', { expectedTerm: catalog.nextTerm });
const scholarship = await sample('student-cancel', 'DonSV05', { reviewTerm: catalog.currentTerm, reason: 'Đề nghị xét học bổng khuyến học (dữ liệu mẫu).' });
await step(scholarship, 'student-a', 'cancel', 'SUBMITTED', { message: 'Sinh viên hủy hồ sơ mẫu vì chọn nhầm học kỳ.' });
const program = await sample('staff-cancel', 'DonSV07', { programCode: catalog.programs[0].code, startTerm: catalog.nextTerm });
await step(program, 'staff-dt', 'cancel', 'SUBMITTED', { message: 'Chuyên viên hủy hồ sơ mẫu để minh họa phản hồi: thông tin đề nghị chưa phù hợp, vui lòng trao đổi trước khi lập lại.' });
let done = await sample('completed-card', 'DonSV01', { reasonCode: 'LOST_OR_DAMAGED', changeDescription: '' });
done = await step(done, 'staff-ctsv', 'receive', 'SUBMITTED');
if(done.status==='RECEIVED'&&!done.printedAt){
  const response=await fetch(base+'/requests/'+done.id+'/print',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+sessions['staff-ctsv']},body:JSON.stringify({version:done.version,idempotencyKey:'sample-paper-print-'+done.id})});
  if(!response.ok)throw new Error('Sample paper print failed');await response.arrayBuffer();done=await call('/requests/'+done.id,sessions['student-a']);
}
await step(done, 'staff-ctsv', 'complete', 'RECEIVED', { message: 'Chuyên viên đánh dấu đã xử lý hồ sơ thực tế (mẫu).' });
await sample('student-b', 'DonSV06', { reasonCode: 'LH001', reasonDetail: 'Hồ sơ mẫu thuộc sinh viên B, không hiển thị cho sinh viên A.' }, 'student-b');
let confirmation = await sample('confirmation-nvqs', 'CONFIRMATION', { documentCode: '13', additionalInfo: 'Đề nghị xác nhận hoãn NVQS để thử luồng cấp văn bản (dữ liệu mẫu).', quantity: 1, feeMode: 'FREE', serviceSpeed: 'NORMAL', periodTerm: '', academicYear: '' });
confirmation = await step(confirmation, 'staff-ctsv', 'receive', 'SUBMITTED');
if(confirmation.status==='RECEIVED'&&!confirmation.printedAt){
  const response=await fetch(base+'/requests/'+confirmation.id+'/print',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+sessions['staff-ctsv']},body:JSON.stringify({version:confirmation.version,idempotencyKey:'sample-print-'+confirmation.id})});
  if(!response.ok)throw new Error('Could not prepare sample confirmation printout');await response.arrayBuffer();
  confirmation=await call('/requests/'+confirmation.id,sessions['student-a']);
}
await step(confirmation, 'staff-ctsv', 'result', 'RECEIVED', { message: 'Văn bản mẫu đã xử lý và được hẹn trả sau 2 ngày.', pickupLocation: 'Khu Hành chính một cửa (mẫu)' });
const year = 2000 + Number(catalog.currentTerm.slice(0, 2));
let transcript = await sample('confirmation-transcript', 'CONFIRMATION', { documentCode: '05', additionalInfo: 'Bảng điểm năm học dùng thử.', quantity: 2, feeMode: 'FREE', serviceSpeed: 'NORMAL', periodTerm: '', academicYear: `${year}-${year + 1}` });
transcript = await step(transcript, 'staff-dt', 'receive', 'SUBMITTED');
await step(transcript, 'staff-dt', 'cancel', 'RECEIVED', { message: 'Nội dung đề nghị chưa rõ. Vui lòng lập lại với mục đích cấp bảng điểm đầy đủ.' });
let lms = await sample('lms-password-v2', 'LMS_SUPPORT', {});
lms = await step(lms, 'staff-lms', 'receive', 'SUBMITTED');
await step(lms, 'staff-lms', 'result', 'RECEIVED', { message: 'MAT-KHAU-LMS-DEMO' });
console.log('Nine fictional sample requests are ready. Existing samples are retained when rerunning.');
