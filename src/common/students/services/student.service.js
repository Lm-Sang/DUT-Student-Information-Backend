import { AppError } from '../../../shared/errors/app-error.js';
import { studentRepository } from '../repositories/student.repository.js';

const clean = (value, max) => typeof value === 'string' && value.trim().length <= max
  && !/[\u0000-\u001f\u007f]/.test(value) ? value.trim() || null : null;
export const citizenId = value => typeof value === 'string' && /^\d{12}$/.test(value.trim()) ? value.trim() : null;
const birthday = value => {
  const date = typeof value === 'string' ? value.slice(0,10) : '';
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && date.slice(0,4)!=='0000' && Number.isFinite(Date.parse(date))
    && new Date(date).toISOString().slice(0,10)===date ? date : null;
};
const rowBirthday = row => birthday(row.birthday) || birthday(`${String(row.birthYear??'').trim()}-${String(row.birthMonth??'').trim().padStart(2,'0')}-${String(row.birthDay??'').trim().padStart(2,'0')}`);

export function createStudentService({ repository = studentRepository } = {}) {
  function validate(actor) {
    if (actor?.role !== 'student' || typeof actor.studentCode !== 'string' || !/^\d{9}$/.test(actor.studentCode))
      throw new AppError('Cần MSSV từ hồ sơ sinh viên đã xác thực.', 403);
  }
  async function read(actor) {
    validate(actor);
    let rows;
    try { rows = await repository.findIdentityRowsByStudentCode(actor.studentCode); }
    catch { throw new AppError('Chưa đọc được thông tin sinh viên từ DB trường. Vui lòng thử lại.', 503); }
    if (rows.some(row => String(row.studentCode).trim() !== actor.studentCode))
      throw new AppError('Dữ liệu sinh viên không khớp MSSV đã xác thực.', 502);
    return rows;
  }
  return Object.freeze({
    async getIdentityForAuthenticatedStudent(actor) {
      const rows = await read(actor);
      if (rows.length !== 1) return { status: rows.length ? 'ambiguous' : 'not_found', cccd: null, source: 'DATA_SV1.dbo.NhanThan' };
      const row = rows[0], primary = citizenId(row.citizenId), legacy = citizenId(row.legacyIdentityNumber);
      return { status: primary || legacy ? 'found' : 'missing', cccd: primary || legacy,
        source: 'DATA_SV1.dbo.NhanThan' + (primary ? '.CCCD_So' : legacy ? '.cmnd' : '') };
    },
    // Actor fields must come from the verified SSO/profile adapter, never the request body.
    async getCertificationProfile(actor) {
      validate(actor);
      const result = { studentCode: actor.studentCode, fullName: clean(actor.name, 150),
        className: clean(actor.className, 50), cccd: citizenId(actor.cccd) };
      if (result.fullName && result.className && result.cccd) return result;
      const rows = await read(actor);
      if (rows.length > 1) throw new AppError('MSSV có nhiều hồ sơ trong DB trường; cần đối chiếu thông tin.', 409);
      const row = rows[0];
      if (row) {
        result.fullName ||= clean(row.fullName, 150);
        result.className ||= clean(row.className, 50);
        result.cccd ||= citizenId(row.citizenId) || citizenId(row.legacyIdentityNumber);
      }
      return result;
    },
    async getApplicationProfile(actor) {
      validate(actor);
      const result={studentCode:actor.studentCode,fullName:clean(actor.name,150),className:clean(actor.className,50),
        cccd:citizenId(actor.cccd),birthday:birthday(actor.birthday),phoneNumber:clean(actor.phoneNumber,30),
        cccdSource:citizenId(actor.cccd)?'sso':null};
      if(['fullName','className','cccd','birthday','phoneNumber'].every(field=>result[field]))return result;
      const rows=await read(actor);
      if(rows.length>1)throw new AppError('MSSV có nhiều hồ sơ trong DB trường; cần đối chiếu thông tin.',409);
      if(rows[0]){
        const row=rows[0],primary=citizenId(row.citizenId),legacy=citizenId(row.legacyIdentityNumber);
        result.fullName ||= clean(row.fullName,150);
        result.className ||= clean(row.className,50);
        result.birthday ||= rowBirthday(row);
        result.phoneNumber ||= clean(row.phoneNumber,30);
        if(!result.cccd){result.cccd=primary||legacy;result.cccdSource=primary?'DATA_SV1.dbo.NhanThan.CCCD_So':legacy?'DATA_SV1.dbo.NhanThan.cmnd':null;}
      }
      return result;
    },
  });
}

export const studentService = createStudentService();
