import { queryLocalDatabase } from '../../../../database.js';
import { AppError } from '../../../../shared/errors/app-error.js';

export function createProgressRepository({ query = queryLocalDatabase } = {}) {
  async function queryRows(sql, params) {
    try { return (await query(sql, params)).first; }
    catch (error) {
      if (/ORG_FORBIDDEN/.test(error.message)) throw new AppError('Permission denied', 403);
      throw error;
    }
  }
  return {
    async progress(actor, task, offset) {
      // Select only progress metadata, never request payloads, secrets or upload URLs.
      const summaries = {
        certifications: `SELECT CONVERT(varchar(36),Id) AS id,StudentCode AS studentCode,
          CASE WHEN Status='checking' THEN 'uploading' ELSE Status END AS status,SubmittedAt AS submittedAt
          FROM certification.StudentCertificates`,
        'it-certifications': `SELECT CONVERT(varchar(36),f.ApplicationId) AS id,c.MaHS AS studentCode,
          COALESCE(JSON_VALUE(done.ReviewJson,'$.Decision'),CASE WHEN done.Id IS NOT NULL THEN 'submitted' ELSE 'uploading' END) AS status,
          done.CompletedAt AS submittedAt
          FROM certification.tmCNTTChungChi_File f LEFT JOIN certification.tmCNTTChungChi_SV c ON c.ID=f.CertificateId
          OUTER APPLY(SELECT TOP(1) x.Id,x.ReviewJson,x.CompletedAt FROM certification.tmCNTTChungChi_File x
            WHERE x.ApplicationId=f.ApplicationId AND x.Status='completed' ORDER BY x.Sequence DESC,x.Id) done
          WHERE f.Id=(SELECT TOP(1) x.Id FROM certification.tmCNTTChungChi_File x WHERE x.ApplicationId=f.ApplicationId ORDER BY x.Sequence DESC,x.CreatedAt DESC,x.Id DESC)`,
        'academic-leave': `SELECT CONVERT(varchar(36),Id) AS id,StudentCode AS studentCode,Status AS status,CreatedAt AS submittedAt FROM academic_leave.Applications`,
        'student-requests': `SELECT CONVERT(varchar(36),r.ID) AS id,a.SoThe AS studentCode,r.TrangThai AS status,r.NgayDeNghi AS submittedAt,
          r.MaCBND AS assignedStaffId,r.LoaiDon AS typeCode FROM svc_demo.DonDeNghi r JOIN svc_demo.TaiKhoan a ON a.MaHS=r.MaHS
          WHERE r.MaDV=CASE ? WHEN 'DT' THEN '115' WHEN 'SV' THEN '120' ELSE ? END`,
      };
      const sql = summaries[task.code];
      if (!sql) throw new AppError('No progress reader registered for this task', 404);
      const rows = await queryRows(`IF NOT EXISTS(SELECT 1 FROM auth.AccountProfiles p JOIN auth.LocalAccounts a ON a.Id=p.AccountId
        JOIN auth.Fields f ON f.FieldCode=p.FieldCode JOIN auth.Tasks t ON t.FieldCode=p.FieldCode
        WHERE p.AccountId=? AND p.Revision=? AND p.AccessLevel='department_admin' AND a.IsActive=1 AND f.IsActive=1
        AND t.TaskId=? AND t.TaskCode=? AND t.IsActive=1) THROW 51903,'ORG_FORBIDDEN',1;
        SELECT * FROM (${sql}) progress ORDER BY submittedAt DESC,id DESC OFFSET ? ROWS FETCH NEXT 100 ROWS ONLY;`,
      [actor.accountId, actor.revision, task.id, task.code, ...(task.code === 'student-requests' ? [actor.fieldCode, actor.fieldCode] : []), offset]);
      return { taskId: task.id, fieldCode: actor.fieldCode, items: rows, offset, limit: 100 };
    },
  };
}
