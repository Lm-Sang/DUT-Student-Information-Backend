import { AppError } from '../../../shared/errors/app-error.js';

function object(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new AppError('Dữ liệu phải là một object.', 400);
  return value;
}
function text(value, name, { required = false, max = 2000 } = {}) {
  if (value === undefined || value === null) value = '';
  if (typeof value !== 'string' || value.length > max) throw new AppError(`${name} không hợp lệ hoặc vượt quá ${max} ký tự.`, 400);
  const result = value.trim();
  if (required && !result) throw new AppError(`Vui lòng nhập ${name}.`, 400);
  return result;
}

export const formFields = {
  DonSV01: ['reasonCode', 'changeDescription'], DonSV03: ['expectedTerm'],
  DonSV04: ['targetTerm', 'reason'], DonSV05: ['reviewTerm', 'reason'],
  DonSV07: ['programCode', 'startTerm'], DonSV06: ['reasonCode', 'reasonDetail'],
  CONFIRMATION: ['documentCode', 'additionalInfo', 'quantity', 'feeMode', 'serviceSpeed', 'periodTerm', 'academicYear'],
  LMS_SUPPORT: [],
};

export function supplementFields(typeCode, payload = {}) {
  return formFields[typeCode]?.filter(field => !['documentCode', 'supportCode', 'ownershipConfirmed'].includes(field)
    && (typeCode !== 'CONFIRMATION' || !['periodTerm','academicYear','serviceSpeed'].includes(field))) ?? [];
}

export function parsePayload(typeCode, value) {
  const input = object(typeCode === 'LMS_SUPPORT' ? value ?? {} : value);
  const fields = formFields[typeCode];
  if (!fields) throw new AppError('Loại đơn không hợp lệ.', 400);
  if (Object.keys(input).some(key => !fields.includes(key))) throw new AppError('Biểu mẫu chứa field không được phép.', 400);
  // No student-entered fields: owner comes from the authenticated session.
  // Keep the typed detail compatible with existing local rows and constraints.
  if (typeCode === 'LMS_SUPPORT') return { supportCode: '3', issueCode: 'RESET_PASSWORD',
    description: 'Đề nghị cấp lại mật khẩu DUT-LMS.', contactEmail: '', ownershipConfirmed: true };
  const payload = {};
  for (const field of fields) {
    if (field === 'quantity') {
      if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 20) throw new AppError('Số bản phải là số nguyên từ 1 đến 20 trong bản thử.', 400);
      payload.quantity = input.quantity;
    } else if (field === 'ownershipConfirmed') {
      if (input.ownershipConfirmed !== true) throw new AppError('Vui lòng xác nhận đây là tài khoản của bạn.', 400);
      payload.ownershipConfirmed = true;
    } else payload[field] = text(input[field], field, { max: /Term|Code/.test(field) ? 60 : field === 'contactEmail' ? 254 : 2000 });
  }
  if (typeCode === 'DonSV01') {
    if (!['LOST_OR_DAMAGED', 'CHANGE_INFO'].includes(payload.reasonCode)) throw new AppError('Chọn lý do cấp lại thẻ.', 400);
    if (payload.reasonCode === 'CHANGE_INFO' && !payload.changeDescription) throw new AppError('Vui lòng nhập thông tin cần thay đổi trên thẻ.', 400);
    if (payload.reasonCode !== 'CHANGE_INFO') payload.changeDescription = '';
  }
  if (typeCode === 'DonSV06' && !['LH001', 'LH002'].includes(payload.reasonCode)) throw new AppError('Chọn lý do thôi học.', 400);
  if (typeCode === 'DonSV05' && !payload.reason) throw new AppError('Vui lòng nhập lý do đề nghị.', 400);
  const termField = { DonSV03: 'expectedTerm', DonSV05: 'reviewTerm', DonSV07: 'startTerm' }[typeCode];
  if (termField && !payload[termField]) throw new AppError('Vui lòng chọn học kỳ.', 400);
  if (typeCode === 'DonSV07' && !payload.programCode) throw new AppError('Vui lòng chọn chương trình 2.', 400);
  if (typeCode === 'CONFIRMATION') {
    if (!/^\d{2}$/.test(payload.documentCode)) throw new AppError('Vui lòng chọn loại văn bản xác nhận.', 400);
    payload.serviceSpeed ||= 'NORMAL';
    if (!['FREE', 'PAID'].includes(payload.feeMode) || !['NORMAL', 'RUSH'].includes(payload.serviceSpeed)) throw new AppError('Lựa chọn phí hoặc hình thức cấp không hợp lệ.', 400);
    if (['01', '13', '18'].includes(payload.documentCode) && !payload.additionalInfo) throw new AppError('Vui lòng nhập lý do/thông tin bổ sung cho loại xác nhận này.', 400);
  }
  return payload;
}

export function parseCreate(body) {
  const input = object(body);
  if (Object.keys(input).some(key => !['typeCode', 'payload', 'idempotencyKey'].includes(key))) throw new AppError('Thông tin gửi đơn có field không được phép.', 400);
  const typeCode = text(input.typeCode, 'loại đơn', { required: true, max: 20 });
  return { typeCode, payload: parsePayload(typeCode, input.payload),
    idempotencyKey: text(input.idempotencyKey, 'mã chống gửi trùng', { required: true, max: 100 }) };
}

export function parseCommand(body) {
  const input = object(body);
  if (Object.keys(input).some(key => !['action', 'version', 'message', 'requiredFields', 'payload', 'idempotencyKey', 'pickupLocation', 'cancelReasonCode'].includes(key))) throw new AppError('Thao tác có field không được phép. Lịch nhận được tính sau ngày in 3 ngày.', 400);
  const action = text(input.action, 'thao tác', { required: true, max: 30 });
  if (!['receive', 'start', 'requestInfo', 'external', 'result', 'complete', 'cancel', 'supplement'].includes(action)) throw new AppError('Thao tác không hợp lệ.', 400);
  if (!Number.isInteger(input.version) || input.version < 1) throw new AppError('Phiên bản hồ sơ không hợp lệ.', 400);
  const requiredFields = input.requiredFields ?? [];
  if (!Array.isArray(requiredFields) || requiredFields.some(field => typeof field !== 'string') || requiredFields.length > 8) throw new AppError('Danh sách bổ sung không hợp lệ.', 400);
  const cancelReasonCode = text(input.cancelReasonCode, 'mã lý do hủy', { max: 40 });
  if (cancelReasonCode && action !== 'cancel') throw new AppError('Mã lý do hủy chỉ dùng khi hủy đơn.', 400);
  return { action, version: input.version, message: text(input.message, 'nội dung phản hồi'), requiredFields: [...new Set(requiredFields)],
    payload: input.payload, idempotencyKey: text(input.idempotencyKey, 'mã chống gửi trùng', { required: true, max: 100 }),
    pickupLocation: text(input.pickupLocation, 'nơi nhận', { max: 500 }),
    ...(cancelReasonCode ? { cancelReasonCode } : {}) };
}

export function parseId(value) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) throw new AppError('Mã hồ sơ không hợp lệ.', 400);
  return value;
}

export function parsePrintCommand(body) {
  const input = object(body);
  if (Object.keys(input).some(key => !['version', 'idempotencyKey'].includes(key))) throw new AppError('In đơn chỉ nhận phiên bản và mã thao tác; thời điểm xuất do server ghi.', 400);
  if (!Number.isInteger(input.version) || input.version < 1) throw new AppError('Phiên bản hồ sơ không hợp lệ.', 400);
  return { version: input.version, idempotencyKey: text(input.idempotencyKey, 'mã chống in trùng', { required: true, max: 100 }) };
}
