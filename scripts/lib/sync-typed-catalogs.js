import { queryLocalDatabase } from '../../src/infrastructure/database/local-sql-server.js';
import { assertLocalDemoTarget, localDatabaseGuardSql } from '../../src/infrastructure/database/local-write-guard.js';
import { departmentToDatabase } from '../../src/modules/student-requests/domain/request-fields.js';

export async function syncTypedCatalogs({terms,programs,documents,supportSystems,currentTerm,source}) {
  assertLocalDemoTarget();const params=[];const sql=[];
  function merge(table,keys,rows){for(const row of rows){const cols=Object.keys(row);params.push(...Object.values(row).map(v=>typeof v==='boolean'?Number(v):v??null));
    sql.push(`MERGE svc_demo.${table} WITH(HOLDLOCK) AS t USING(SELECT ${cols.map(c=>`? AS [${c}]`).join(',')}) AS s ON ${keys.map(k=>`t.[${k}]=s.[${k}]`).join(' AND ')}
     WHEN MATCHED THEN UPDATE SET ${cols.filter(c=>!keys.includes(c)).map(c=>`t.[${c}]=s.[${c}]`).join(',')},NgayDongBo=SYSUTCDATETIME()
     WHEN NOT MATCHED THEN INSERT(${cols.map(c=>`[${c}]`).join(',')}) VALUES(${cols.map(c=>`s.[${c}]`).join(',')});`);}}
  sql.push('UPDATE svc_demo.tmNganhTQ SET HieuLuc=0;UPDATE svc_demo.Sys_VanBan SET HieuLuc=0;UPDATE svc_demo.Sys_Email SET HieuLuc=0;');
  merge('tmKehoach',['IDCode'],terms.map(t=>({IDCode:t.code,TenKH:t.name,ThuTu:t.sortOrder,Hientai:t.selectable})));
  merge('tmNganhTQ',['MaNganhTQ'],programs.map(p=>({MaNganhTQ:p.code,TenNganhTQ:p.name,HieuLuc:p.active})));
  merge('Sys_VanBan',['IDCode','MaVanBan'],documents.map(d=>({IDCode:d.termCode,MaVanBan:d.code,ID:d.sourceId,TenVanBan:d.name,MaDVcap:departmentToDatabase(d.department),
    ThongTinDinhKem:d.guidance,LePhiThuong:d.normalFee,LePhiNhanh:d.rushFee,KhongMienPhi:d.feePolicyKnown===false?null:!d.freeAllowed,SoLuongMien_Ngay:d.dailyFreeQuota,KhongCapNeuKhongHoc:d.registrationRequired,HieuLuc:true})));
  merge('Sys_Email',['MaEmail'],supportSystems.map(s=>({MaEmail:s.code,TenDenghi:s.name,HieuLuc:s.active})));
  merge('CauHinh',['MaCauHinh'],[{MaCauHinh:'currentTerm',GiaTri:currentTerm},{MaCauHinh:'catalogSource',GiaTri:source}]);
  await queryLocalDatabase(`SET NOCOUNT ON;SET XACT_ABORT ON;${localDatabaseGuardSql} BEGIN TRY BEGIN TRANSACTION;${sql.join('\n')}COMMIT TRANSACTION;END TRY BEGIN CATCH IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;THROW;END CATCH;`,params);
}
