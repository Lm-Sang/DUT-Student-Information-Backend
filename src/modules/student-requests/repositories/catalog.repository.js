import { queryLocalDatabase } from '../../../infrastructure/database/local-sql-server.js';
import { assertLocalDemoTarget } from '../../../infrastructure/database/local-write-guard.js';

// Data-driven names, availability, routing and validation/renderer profile.
// A profile names supported code; database text is never executed as code/path.
export function createRequestCatalogRepository({ query = queryLocalDatabase, guard = assertLocalDemoTarget } = {}) {
  return {
    async list({ includeInactive = false } = {}) {
      guard();
      const rows = (await query(`SELECT MaLoaiDon AS code,TenLoaiDon AS name,Nhom AS [group],
        CASE MaDV WHEN '115' THEN 'DT' WHEN '120' THEN 'CTSV' ELSE MaDV END AS department,
        CachNop AS submissionMode,MaMauDuLieu AS validationProfile,MaMauIn AS templateCode,
        BieuTuong AS icon,MoTa AS description,HieuLuc AS active,ThuTu AS sortOrder
        FROM svc_demo.LoaiDon ${includeInactive ? '' : 'WHERE HieuLuc=1'} ORDER BY ThuTu,MaLoaiDon`)).first;
      const fields = (await query('SELECT MaLoaiDon,TenTruong,BatBuoc,ThuTu FROM svc_demo.TruongLoaiDon ORDER BY MaLoaiDon,ThuTu')).first;
      return rows.map(row => ({ ...row, active: Boolean(row.active), formTemplateStatus: row.templateCode ? 'READY' : null,
        fields: fields.filter(field => field.MaLoaiDon === row.code).map(field => ({ key: field.TenTruong, required: Boolean(field.BatBuoc) })) }));
    },
  };
}
