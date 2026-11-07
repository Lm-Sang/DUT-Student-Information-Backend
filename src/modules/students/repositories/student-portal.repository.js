import { sqlTypes as sql } from '../../../infrastructure/database/typeorm-types.js';
import { connectDatabase } from '../../../database.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { createStudentScheduleReader } from './student-schedule.repository.js';
export { parseSchoolSchedule } from '../domain/school-schedule.js';

const text=value=>String(value??'').trim();
export function createStudentPortalRepository({connect=connectDatabase}={}) {
  const readSchedule=createStudentScheduleReader({connect});
  async function registry(number) {
    if(!/^\d{9}$/.test(number??''))throw new AppError('MSSV đã xác thực không hợp lệ.',403);
    const pool=await connect('secondary','tmProxDUT');
    const result=await pool.request().input('number',sql.NVarChar(30),number).query(`
      SELECT TOP(2) h.MaHS,h.SoTheSV,h.MaNganh FROM dbo.tmHoSoSV h WHERE h.SoTheSV=@number ORDER BY h.MaHS;`);
    const rows=result.recordset;
    if(rows.length!==1||!text(rows[0].MaHS)||text(rows[0].SoTheSV)!==number)
      throw new AppError('Chưa xác định được duy nhất hồ sơ học tập của sinh viên.',409,{code:'STUDENT_PROFILE_MISMATCH'});
    return {pool,schoolId:text(rows[0].MaHS),programId:/^\d{7}$/.test(text(rows[0].MaNganh))?text(rows[0].MaNganh):null};
  }
  return {
    async currentProgram(number) {const {programId}=await registry(number);return programId;},
    async schedule(number) {
      const {schoolId}=await registry(number);
      return readSchedule(number,schoolId);
    },
  };
}
