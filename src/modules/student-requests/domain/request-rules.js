import {hasPermission,actionPermission} from './rbac.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { canWork } from './work-permissions.js';

export const paperRequestCodes = ['DonSV01', 'DonSV03', 'DonSV04', 'DonSV05', 'DonSV07', 'DonSV06'];
export const isPaperRequest = code => paperRequestCodes.includes(code);

export const requestTypes = [
  { code: 'DonSV01', name: 'Cấp lại thẻ sinh viên', department: 'CTSV', icon: 'card', description: 'Mất, hỏng thẻ hoặc cần thay đổi thông tin.' },
  { code: 'DonSV03', name: 'Xét công nhận tốt nghiệp', department: 'DT', icon: 'graduation', description: 'Đăng ký học kỳ dự kiến tốt nghiệp.' },
  { code: 'DonSV04', name: 'Hoãn công nhận tốt nghiệp', department: 'DT', icon: 'calendar', description: 'Đơn theo mẫu cố định để học cải thiện; tự động điền hồ sơ sinh viên.' },
  { code: 'DonSV05', name: 'Xét học bổng khuyến học', department: 'CTSV', icon: 'award', description: 'Đề nghị xét học bổng theo học kỳ, kèm lý do.' },
  { code: 'DonSV07', name: 'Đăng ký chương trình 2', department: 'DT', icon: 'books', description: 'Chọn chương trình đào tạo và kỳ bắt đầu.' },
  { code: 'DonSV06', name: 'Giải quyết thủ tục thôi học', department: 'DT', icon: 'file', description: 'Đề nghị thôi học theo nguyện vọng hoặc chuyển trường.' },
  { code: 'CONFIRMATION', name: 'Cấp văn bản xác nhận', department: 'BY_DOCUMENT', icon: 'file', description: 'Bảng điểm, xác nhận sinh viên, vay vốn, hoãn NVQS và kết quả rèn luyện.' },
  { code: 'LMS_SUPPORT', name: 'Cấp lại mật khẩu DUT-LMS', department: 'IT', icon: 'card', description: 'Bấm gửi yêu cầu. Chuyên viên sẽ phản hồi mật khẩu trong chi tiết yêu cầu.' },
].map(type => ({ ...type, group: isPaperRequest(type.code) ? 'PETITION' : type.code === 'CONFIRMATION' ? 'CONFIRMATION' : 'LMS',
  submissionMode: isPaperRequest(type.code) ? 'PAPER_FORM' : 'WEB',
  formTemplateStatus: isPaperRequest(type.code) ? 'READY' : null }));

export const statuses = {
  SUBMITTED: 'Đã gửi', RECEIVED: 'Đã tiếp nhận', PROCESSING: 'Đang xử lý',
  NEEDS_INFO: 'Cần bổ sung', EXTERNAL_PROCESSING: 'Đang làm thủ tục bên ngoài',
  READY: 'Có kết quả', COMPLETED: 'Hoàn thành', CANCELLED: 'Đã hủy',
};

export function typeOf(code) {
  const type = requestTypes.find(item => item.code === code);
  if (!type) throw new AppError('Loại đơn không hợp lệ.', 400);
  return type;
}

// Catalog order, not MAX(code), determines the following semester (including summer).
export function visibleTerms(terms, currentCode) {
  const ordered = [...terms].sort((a, b) => a.sortOrder - b.sortOrder);
  const current = ordered.findIndex(term => term.code === currentCode);
  if (current < 0) throw new AppError('Chưa có kỳ hiện tại trong danh mục local. Hãy đồng bộ danh mục.', 503);
  const next = ordered[current + 1]?.code ?? null;
  return ordered.slice(0, current + 2).filter(term => term.selectable || term.code === currentCode || term.code === next)
    .map(term => ({ ...term, isCurrent: term.code === currentCode, isNext: term.code === next }));
}

export function canRead(actor, request) {
  return actor.role === 'ADMIN' || (actor.role === 'STUDENT' ? request.studentId === actor.id
    : actor.role === 'STAFF' && hasPermission(actor,'requests.view') && (request.assignedStaffId === actor.id || canWork(actor, request)));
}

export function canPrintConfirmation(actor, row) {
  return row.TypeCode === 'CONFIRMATION' && canPrintRequest(actor, row);
}

export function canPrintRequest(actor, row) {
  return row.TypeCode === 'CONFIRMATION' && hasPermission(actor,'requests.print') && hasPermission(actor,'requests.view') && canWork(actor, row)
    && row.AssignedStaffId === actor.id && ['RECEIVED','PROCESSING','NEEDS_INFO','EXTERNAL_PROCESSING','READY','COMPLETED'].includes(row.Status);
}

function scopedActions(actor, request) {
  if (!canRead(actor, request) || ['COMPLETED', 'CANCELLED'].includes(request.status)) return [];
  if (actor.role === 'ADMIN' || actor.role === 'STAFF' && !canWork(actor, request)) return [];
  if (request.typeCode === 'LMS_SUPPORT') {
    if (actor.role === 'STUDENT') return ['cancel'];
    if (request.assignedStaffId && request.assignedStaffId !== actor.id) return [];
    if (request.status === 'SUBMITTED') return ['receive', 'cancel'];
    // Old requests waiting for information can be answered without asking the student to fill anything.
    return request.status === 'READY' ? ['complete', 'cancel'] : ['result', 'cancel'];
  }
  if (isPaperRequest(request.typeCode)) {
    if (actor.role === 'STUDENT') return ['cancel'];
    if (request.assignedStaffId && request.assignedStaffId !== actor.id) return [];
    return request.status === 'SUBMITTED' ? ['receive', 'cancel'] : ['complete', 'cancel'];
  }
  if (request.typeCode === 'CONFIRMATION') {
    if (request.status === 'READY') return []; // Historical processed requests stay closed without rewriting their history.
    if (actor.role === 'STUDENT') return ['cancel'];
    if (request.assignedStaffId && request.assignedStaffId !== actor.id) return [];
    if (request.status === 'SUBMITTED') return ['receive','cancel'];
    return [...(request.printedAt ? ['result'] : []),'cancel'];
  }
  if (actor.role === 'STUDENT') {
    return [...(request.status === 'NEEDS_INFO' ? ['supplement'] : []),
      ...(['SUBMITTED', 'RECEIVED', 'PROCESSING', 'NEEDS_INFO'].includes(request.status) ? ['cancel'] : [])];
  }
  if (request.assignedStaffId && request.assignedStaffId !== actor.id) return [];
  if (request.status === 'SUBMITTED') return ['receive', 'cancel'];
  if (request.status === 'NEEDS_INFO') return ['cancel'];
  if (request.status === 'READY') return ['complete', 'cancel'];
  return ['start', 'requestInfo', 'external', 'result', 'cancel'].filter(action => !(
    action === 'start' && request.status === 'PROCESSING'
    || action === 'external' && request.status === 'EXTERNAL_PROCESSING'
    || action === 'result' && request.typeCode === 'CONFIRMATION' && !request.printedAt
  ));
}

export function actionsFor(actor,request){return scopedActions(actor,request).filter(action=>actor.role!=='STAFF'||hasPermission(actor,actionPermission(action)));}

export function transition(actor, request, command) {
  if (!actionsFor(actor, request).includes(command.action)) throw new AppError('Không được thực hiện thao tác này ở trạng thái hiện tại hoặc đơn đang do chuyên viên khác phụ trách.', 403);
  const required = command.action === 'cancel' && actor.role === 'STAFF' || ['requestInfo', 'external'].includes(command.action)
    || command.action === 'result' && request.typeCode !== 'CONFIRMATION';
  if (required && !command.message) throw new AppError('Vui lòng nhập nội dung phản hồi/lý do.', 400);
  if (command.action === 'requestInfo' && !command.requiredFields.length) throw new AppError('Chọn ít nhất một thông tin cần sinh viên bổ sung.', 400);
  const next = { receive: 'RECEIVED', start: 'PROCESSING', requestInfo: 'NEEDS_INFO',
    external: 'EXTERNAL_PROCESSING', result: 'READY', complete: 'COMPLETED',
    cancel: 'CANCELLED', supplement: 'PROCESSING' }[command.action];
  const eventType = command.action === 'cancel' ? `CANCELLED_BY_${actor.role}` : command.action.toUpperCase();
  const defaults = { receive: 'Chuyên viên đã tiếp nhận hồ sơ.', start: 'Chuyên viên bắt đầu xử lý.',
    complete: 'Chuyên viên xác nhận đã hoàn tất và trả kết quả.', supplement: 'Sinh viên đã gửi thông tin bổ sung.' };
  if (isPaperRequest(request.typeCode)) defaults.complete = 'Chuyên viên đánh dấu đã xử lý hồ sơ thực tế.';
  if (request.typeCode === 'CONFIRMATION') {
    defaults.result = 'Chuyên viên xác nhận đã xử lý. Lịch nhận giấy được tính từ lần in đầu tiên.';
    defaults.complete = 'Chuyên viên xác nhận đã trả văn bản cho sinh viên.';
  }
  return { status: ['LMS_SUPPORT','CONFIRMATION'].includes(request.typeCode) && command.action === 'result' ? 'COMPLETED' : next, eventType, message: command.action === 'cancel' && actor.role === 'STUDENT'
    ? 'Sinh viên đã hủy đơn.' : command.message || defaults[command.action] };
}
