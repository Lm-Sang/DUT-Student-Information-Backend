import sql from 'mssql';
import { connectDatabase } from '../../../infrastructure/database/index.js';

export function createStudentRepository({ connect = connectDatabase } = {}) {
  return Object.freeze({
    async findIdentityRowsByStudentCode(studentCode) {
      const pool = await connect('secondary', 'DATA_SV1');
      const result = await pool.request().input('studentCode', sql.Char(9), studentCode).query(`
        SELECT TOP(2) MaHS AS studentCode, Hoten AS fullName, Lop AS className,
          CCCD_So AS citizenId, cmnd AS legacyIdentityNumber, dienthoai AS phoneNumber,
          ngay AS birthDay, thang AS birthMonth, nam AS birthYear
        FROM dbo.NhanThan WHERE MaHS = @studentCode`);
      return result.recordset;
    },
  });
}

export const studentRepository = createStudentRepository();
