import { sqlTypes as sql } from '../../../infrastructure/database/typeorm-types.js';
import { connectDatabase } from '../../../database.js';
import { AppError } from '../../../shared/errors/app-error.js';

const text = value => String(value ?? '').trim();
const score = (value, max) => value != null && value !== '' && Number.isFinite(Number(value))
  && Number(value) >= 0 && Number(value) <= max ? Number(value) : null;

// Only accepts the verified actor's number, never a student ID supplied by the browser.
export function createStudentGradesReader({ connect = connectDatabase } = {}) {
  return async studentNumber => {
    if (!/^\d{9}$/.test(studentNumber ?? '')) throw new AppError('MSSV đã xác thực không hợp lệ.', 403);
    try {
      const pool = await connect('secondary', 'tmProxDUT');
      const identity = await pool.request().input('number', sql.NVarChar(30), studentNumber).query(`
        SELECT TOP(2) MaHS,SoTheSV FROM dbo.tmHoSoSV WHERE SoTheSV=@number ORDER BY MaHS;`);
      const rows = identity.recordset;
      if (rows.length !== 1 || !text(rows[0].MaHS) || text(rows[0].SoTheSV) !== studentNumber)
        throw new AppError('Chưa xác định được duy nhất hồ sơ điểm của sinh viên.', 409, { code: 'STUDENT_PROFILE_MISMATCH' });
      const result = await pool.request().input('id', sql.NVarChar(30), text(rows[0].MaHS)).query(`
        SELECT TOP(2001) d.ID,d.IDCode,d.MaHP,d.MalopHP,d.Diem,d.DiemC,d.Diem4,d.HocLai,
          COALESCE(d.SoTC,c.Credits) AS Credits,c.CourseName,t.TermName
        FROM dbo.tmDiemkyhoc d
        OUTER APPLY(SELECT CASE WHEN COUNT(DISTINCT TenHP)=1 THEN MAX(TenHP) END AS CourseName,
          CASE WHEN COUNT(DISTINCT SoTC)=1 THEN MAX(SoTC) END AS Credits FROM dbo.tmHocPhan WHERE MaHP=d.MaHP) c
        OUTER APPLY(SELECT CASE WHEN COUNT(DISTINCT TenKH)=1 THEN MAX(TenKH) END AS TermName
          FROM DATA_GVien1.dbo.tmKehoach WHERE IDCode=d.IDCode) t
        WHERE d.MaHS=@id ORDER BY d.IDCode,d.MaHP,d.ID;`);
      if (result.recordset.length > 2000) throw new AppError('Bảng điểm vượt giới hạn đọc; cần kiểm tra dữ liệu nguồn.', 502);
      return { studentNumber, courses: result.recordset.map(row => ({
        id: String(row.ID), termCode: text(row.IDCode), termName: text(row.TermName) || text(row.IDCode),
        courseCode: text(row.MaHP), classCode: text(row.MalopHP), name: text(row.CourseName) || null,
        credits: score(row.Credits, 100), score10: score(row.Diem, 10), score4: score(row.Diem4, 4),
        letter: text(row.DiemC) || null, retake: row.HocLai == null ? null : Boolean(row.HocLai),
      })) };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Chưa đọc được bảng điểm từ dữ liệu trường. Vui lòng thử lại.', 503);
    }
  };
}
