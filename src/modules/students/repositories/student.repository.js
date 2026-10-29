import sql from 'mssql';
import {connectDatabase} from '../../../infrastructure/database/index.js';

export function createStudentRepository({connect = connectDatabase} = {}) {
  return Object.freeze({
    async findIdentityRowsByStudentCode(studentCode) {
      const pool = await connect('secondary', 'DATA_SV1');
      // MaHS is char(9); match its SQL type so IX_NhanThan_MaHS remains usable.
      const result = await pool.request().input('studentCode', sql.Char(9), studentCode).query(`
        SELECT TOP(2) MaHS AS studentCode,
          NULLIF(LTRIM(RTRIM(CCCD_So)), N'') AS citizenId,
          NULLIF(LTRIM(RTRIM(cmnd)), N'') AS legacyIdentityNumber
        FROM dbo.NhanThan WHERE MaHS = @studentCode`);
      return result.recordset;
    },
  });
}

export const studentRepository = createStudentRepository();
