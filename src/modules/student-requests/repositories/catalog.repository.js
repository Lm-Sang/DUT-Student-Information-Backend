import { queryLocalDatabase } from '../../../database.js';
import { assertLocalDemoTarget } from '../../../infrastructure/database/local-write-guard.js';
import {selectEntity,selectRows} from '../../../infrastructure/database/typeorm-repository.js';

// Data-driven names, availability, routing and validation/renderer profile.
// A profile names supported code; database text is never executed as code/path.
export function createRequestCatalogRepository({ query = queryLocalDatabase, guard = assertLocalDemoTarget } = {}) {
  return {
    async list({ includeInactive = false } = {}) {
      guard();
      const types=selectEntity('svc_demo.LoaiDon','ld').select(['ld.MaLoaiDon AS code','ld.TenLoaiDon AS name','ld.Nhom AS [group]',
        "CASE ld.MaDV WHEN '115' THEN 'DT' WHEN '120' THEN 'CTSV' ELSE ld.MaDV END AS department",
        'ld.CachNop AS submissionMode','ld.MaMauDuLieu AS validationProfile','ld.MaMauIn AS templateCode','ld.BieuTuong AS icon','ld.MoTa AS description','ld.HieuLuc AS active','ld.ThuTu AS sortOrder'])
        .orderBy('ld.ThuTu').addOrderBy('ld.MaLoaiDon');
      if(!includeInactive)types.where('ld.HieuLuc=1');
      const [rows,fields]=await Promise.all([selectRows(types,query),selectRows(selectEntity('svc_demo.TruongLoaiDon','f').select(['f.MaLoaiDon AS MaLoaiDon','f.TenTruong AS TenTruong','f.BatBuoc AS BatBuoc','f.ThuTu AS ThuTu']).orderBy('f.MaLoaiDon').addOrderBy('f.ThuTu'),query)]);
      return rows.map(row => ({ ...row, active: Boolean(row.active), formTemplateStatus: row.templateCode ? 'READY' : null,
        fields: fields.filter(field => field.MaLoaiDon === row.code).map(field => ({ key: field.TenTruong, required: Boolean(field.BatBuoc) })) }));
    },
  };
}
