import { AppError } from '../../../shared/errors/app-error.js';

export const cancellationReasons = [
  { code: 'DUPLICATE', name: 'Yêu cầu trùng lặp.' },
  { code: 'INVALID_INFORMATION', name: 'Thông tin trong yêu cầu không chính xác.' },
  { code: 'MISSING_DOCUMENTS', name: 'Hồ sơ chưa đầy đủ theo yêu cầu.' },
  { code: 'NOT_ELIGIBLE', name: 'Chưa đáp ứng điều kiện giải quyết yêu cầu.' },
  { code: 'WRONG_REQUEST_TYPE', name: 'Loại yêu cầu chưa phù hợp với nội dung đề nghị.' },
];

export function cancellationFeedback(actor, command) {
  if (actor.role === 'STUDENT' && command.action === 'cancel' && !command.cancelReasonCode) return { message: '' };
  if (!command.cancelReasonCode) return { message: command.message };
  if (actor.role !== 'STAFF' || command.action !== 'cancel') throw new AppError('Lý do hủy có sẵn chỉ dành cho thao tác hủy của chuyên viên.', 400);
  const preset = cancellationReasons.find(reason => reason.code === command.cancelReasonCode);
  if (!preset) throw new AppError('Lý do hủy được chọn không hợp lệ.', 400);
  const message = [preset.name, command.message].filter(Boolean).join(' ');
  if (message.length > 2000) throw new AppError('Tổng lý do hủy và nội dung bổ sung vượt quá 2000 ký tự.', 400);
  return { message, cancelReasonCode: preset.code, presetReason: preset.name, additionalMessage: command.message || '' };
}

export function confirmationAppointment(processedAt, location) {
  const processed = new Date(processedAt);
  if (!Number.isFinite(processed.getTime())) throw new Error('Invalid processing time');
  return { processedAt: processed.toISOString(), pickupAt: new Date(processed.getTime() + 2 * 86400000).toISOString(),
    pickupLocation: location || 'Khu Hành chính một cửa', appointmentPolicy: 'TWO_CALENDAR_DAYS' };
}
