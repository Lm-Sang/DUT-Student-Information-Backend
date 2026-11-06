import { AppError } from '../../../shared/errors/app-error.js';

export function requireStudentInformation(student) {
  const fields = ['fullName', 'studentCode', 'className', 'cccd'].filter(field =>
    typeof student[field] !== 'string' || !student[field].trim()
    || (field === 'studentCode' && !/^\d{9}$/.test(student[field]))
    || (field === 'cccd' && !/^\d{12}$/.test(student[field])));
  if (fields.length) throw new AppError('Hồ sơ sinh viên thiếu họ tên, MSSV, lớp hoặc CCCD. Cần cập nhật thông tin tại trường trước khi nộp.',
    422, { code: 'CERT_STUDENT_INFORMATION_REQUIRED', fields });
  return student;
}

// Snapshots keep the submitted identity stable. Legacy rows are supplemented by
// a read-only school lookup only after the application ownership check.
export async function supplementStudentInformation(dto, resolveProfile) {
  if (dto.fullName && dto.className && /^\d{12}$/.test(dto.cccd ?? '')) return dto;
  const student = await resolveProfile({ role: 'student', studentCode: dto.studentCode,
    name: dto.fullName, className: dto.className, cccd: dto.cccd });
  return { ...dto, ...student };
}
