import { AppError } from '../../../shared/errors/app-error.js';

export function validateUsername(value, maxLength = 64) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maxLength || /[\p{Cc}\p{Cf}]/u.test(value))
    throw new AppError(`Tên tài khoản cần từ 1 đến ${maxLength} ký tự và không chứa ký tự điều khiển.`, 400);
  return value.trim();
}

export function validatePassword(value, username) {
  if (typeof value !== 'string' || [...value].length <= 8 || value.length > 128
    || value.includes('\0') || !/\p{L}/u.test(value) || !/\p{N}/u.test(value))
    throw new AppError('Mật khẩu phải dài hơn 8 ký tự, tối đa 128 ký tự, có cả chữ và số.', 400);
  if (typeof username === 'string' && value.trim().toLowerCase() === username.trim().toLowerCase())
    throw new AppError('Mật khẩu không được giống tên tài khoản.', 400);
  return value;
}
