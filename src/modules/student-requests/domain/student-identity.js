import {AppError} from '../../../shared/errors/app-error.js';

// DUT issues student Microsoft accounts as SotheSV@sv1.dut.udn.vn (nine digits).
// Only call this with the identity from the verified application JWT.
export function studentNumberFromIdentity(identity) {
  const account=typeof identity?.microsoftId==='string'?identity.microsoftId.trim().toLowerCase():'';
  const match=/^(\d{9})@sv1\.dut\.udn\.vn$/.exec(account);
  if(!match)throw new AppError('Hãy dùng tài khoản Microsoft sinh viên do trường cấp (MSSV@sv1.dut.udn.vn).',403,{code:'STUDENT_ACCOUNT_REQUIRED'});
  return match[1];
}
