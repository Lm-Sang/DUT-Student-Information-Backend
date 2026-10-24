import sql from 'mssql';

import { connectDatabase } from '../../infrastructure/database/sql-server.js';

const visible = '(Hide IS NULL OR Hide = 0) AND Ngaydang <= GETDATE()';

export function createAnnouncementsRepository({ connect = connectDatabase } = {}) {
  return {
    async list({ pageIndex, pageSize }) {
      const pool = await connect('secondary', 'DATA_SV1');
      const count = await pool.request().query(`
        SELECT COUNT_BIG(*) AS totalRecords FROM dbo.ThongBao WHERE ${visible};
      `);
      const result = await pool.request()
        .input('offset', sql.Int, (pageIndex - 1) * pageSize)
        .input('pageSize', sql.Int, pageSize)
        .query(`
          SELECT ID, MaThongBao, Tieude, Ngaydang, Nguoidang, LinhVuc, LinhVucCT
          FROM dbo.ThongBao
          WHERE ${visible}
          ORDER BY Ngaydang DESC, ID DESC
          OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY;
        `);
      return { totalRecords: Number(count.recordset[0].totalRecords), rows: result.recordset };
    },

    async getById(id) {
      const pool = await connect('secondary', 'DATA_SV1');
      const result = await pool.request().input('id', sql.Int, id).query(`
        SELECT ID, MaThongBao, Tieude, CAST(Noidung AS nvarchar(max)) AS Noidung,
               Ngaydang, Nguoidang, LinhVuc, LinhVucCT
        FROM dbo.ThongBao
        WHERE ID = @id AND ${visible};
      `);
      return result.recordset[0] ?? null;
    },
  };
}
