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
