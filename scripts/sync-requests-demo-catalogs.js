import { syncTypedCatalogs } from './lib/sync-typed-catalogs.js';
import { readFileSync } from 'node:fs';
import { connectDatabase, disconnectDatabases } from '../src/infrastructure/database/sql-server.js';
import { queryLocalDatabase, disconnectLocalDatabase } from '../src/infrastructure/database/local-sql-server.js';
import { assertLocalDemoTarget, localDatabaseGuardSql } from '../src/infrastructure/database/local-write-guard.js';
import { normalizeDocuments } from '../src/modules/student-requests/domain/document-rules.js';

try {
  assertLocalDemoTarget();
  let terms, programs, currentTerm, source, documentRows, supportRows;
  if (process.argv.includes('--snapshot')) {
    const evidence = JSON.parse(readFileSync(new URL('../docs/data/student-requests-planning-evidence.json', import.meta.url), 'utf8'));
    terms = evidence.semester.catalog;
    programs = evidence.secondProgram.catalogExamples;
    currentTerm = evidence.semester.portal[0].KyHientai;
    source = 'Local research snapshot 2026-10-24 (partial programs)';
    const extra = JSON.parse(readFileSync(new URL('../docs/data/document-support-catalogs.json', import.meta.url), 'utf8'));
    documentRows = extra.documentTypes;
    supportRows = extra.supportTypes;
  } else {
    const pool = await connectDatabase('secondary', 'DATA_GVien1');
    const result = await pool.request().query(`
      SELECT IDCode,TenKH,Hientai FROM dbo.tmKehoach;
      SELECT MaNganhTQ,TenNganhTQ,CapDT,Huy,[Lock] FROM dbo.tmNganhTQ;
      SELECT KyHientai FROM DATA_SV1.dbo.KSoat_Sys;
      SELECT KyHienTai FROM DATA_SV1.dbo.DKyHoc_KSoat_Sys;
      SELECT ID,IDCode,MaVanBan,TenVanBan,LePhiThuong,LePhiNhanh,HieuLuc,KhongMienPhi,SoLuongMien_Ngay,
        ThongTinDinhKem,MaDVcap,KhongCapNeuKhongHoc,Caohoc,Nhanluc FROM dbo.Sys_VanBan
        WHERE IDCode=(SELECT KyHientai FROM DATA_SV1.dbo.KSoat_Sys);
      SELECT MaEmail,TenDenghi,HieuLuc FROM dbo.Sys_Email;`);
    [terms, programs] = result.recordsets;
    [documentRows, supportRows] = result.recordsets.slice(4);
    if (result.recordsets[2].length !== 1 || result.recordsets[3].length !== 1) throw new Error('Ambiguous current semester configuration.');
    currentTerm = result.recordsets[2][0].KyHientai;
    if (currentTerm !== result.recordsets[3][0].KyHienTai) throw new Error('Portal and registration semester disagree; local catalog not changed.');
    source = 'School SELECT: DATA_GVien1.tmKehoach, tmNganhTQ, Sys_VanBan, Sys_Email; DATA_SV1.KSoat_Sys';
  }
  const normalizedTerms = terms.filter(t => /^\d{4}$/.test(t.IDCode)).map(t => ({ code: t.IDCode,
    name: t.TenKH, selectable: t.Hientai === 1,
    sortOrder: Number(t.IDCode.slice(0, 2)) * 10 + (t.IDCode.endsWith('21') ? 3 : Number(t.IDCode[2])) }));
  const index = normalizedTerms.sort((a, b) => a.sortOrder - b.sortOrder).findIndex(t => t.code === currentTerm);
  if (index < 0 || !normalizedTerms[index + 1]) throw new Error('Missing current or following semester in source; local catalog not changed.');
  const normalizedPrograms = programs.map(p => ({ code: p.MaNganhTQ, name: p.TenNganhTQ,
    active: p.CapDT.trim() === 'CD01' && p.Huy === 0 && p.Lock === 0 }));
  const documents = normalizeDocuments(documentRows);
  const supportSystems = supportRows.map(row => ({ code: row.MaEmail, name: row.TenDenghi, active: row.HieuLuc === 1 }));
  if (!documents.length || !supportSystems.some(system => system.code === '3' && system.active)) throw new Error('Missing active document/LMS catalogue; local catalog not changed.');
  await syncTypedCatalogs({ terms: normalizedTerms, programs: normalizedPrograms, documents, supportSystems, currentTerm, source });
  console.log(JSON.stringify({ localDatabase: 'sv_dut', currentTerm, nextTerm: normalizedTerms[index + 1].code,
    terms: normalizedTerms.length, activePrograms: normalizedPrograms.filter(p => p.active).length,
    documentTypes: documents.length, lms: supportSystems.find(system => system.code === '3')?.active, source }));
} finally { await Promise.allSettled([disconnectDatabases(), disconnectLocalDatabase()]); }

