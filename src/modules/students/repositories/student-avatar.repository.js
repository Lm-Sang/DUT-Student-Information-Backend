import { sqlTypes as sql } from '../../../infrastructure/database/typeorm-types.js';
import { connectDatabase } from '../../../database.js';
import { AppError } from '../../../shared/errors/app-error.js';

export const maxStudentAvatarBytes = 5 * 1024 * 1024;

/** Only the verified student's portrait field, never document scans or demo photos. */
export function createStudentAvatarReader({ connect = connectDatabase } = {}) {
  return async number => {
    if (!/^\d{9}$/.test(number ?? '')) throw new AppError('MSSV đã xác thực không hợp lệ.', 403);
    let schoolId = null;
    for (const database of ['tmProxDUT', 'DATA_GVien1']) {
      const pool = await connect('secondary', database);
      const result = await pool.request().input('number', sql.NVarChar(30), number)
        .input('maxBytes', sql.Int, maxStudentAvatarBytes).query(`
          SELECT TOP(2) h.MaHS,h.SoTheSV,
            CASE WHEN DATALENGTH(h.Anh) BETWEEN 1 AND @maxBytes THEN CONVERT(varbinary(max),h.Anh) END AS Photo
          FROM dbo.tmHoSoSV h WHERE h.SoTheSV=@number ORDER BY h.MaHS;`);
      const rows = result.recordset;
      if (!rows.length) continue;
      const row = rows[0];
      const id = String(row.MaHS ?? '').trim();
      if (rows.length !== 1 || !id || String(row.SoTheSV).trim() !== number || (schoolId && id !== schoolId))
        throw new AppError('Ảnh không khớp duy nhất hồ sơ sinh viên.', 409, { code: 'STUDENT_PROFILE_MISMATCH' });
      schoolId = id;
      if (Buffer.isBuffer(row.Photo) && row.Photo.length && row.Photo.length <= maxStudentAvatarBytes) return row.Photo;
    }
    return null;
  };
}
