import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { queryLocalDatabase as query, disconnectLocalDatabase } from '../src/infrastructure/database/local-sql-server.js';
import { assertLocalDemoTarget } from '../src/infrastructure/database/local-write-guard.js';

// Read-only audit of local typed storage and the verified pre-migration backup.
try {
  assertLocalDemoTarget();
  const identity = (await query('SELECT DB_NAME() AS databaseName')).first[0];
  assert.equal(identity.databaseName, 'sv_dut');
  const columns = (await query(`SELECT t.name AS tableName,c.name AS columnName,ty.name AS sqlType
    FROM sys.tables t JOIN sys.schemas s ON s.schema_id=t.schema_id JOIN sys.columns c ON c.object_id=t.object_id
    JOIN sys.types ty ON ty.user_type_id=c.user_type_id WHERE s.name='svc_demo' ORDER BY t.name,c.column_id`)).first;
  assert.equal(columns.filter(c => /Json/i.test(c.columnName) || c.columnName === 'PdfBytes' || c.tableName === 'RequestFile').length, 0);
  const tableNames = [...new Set(columns.map(c => c.tableName))];
  const counts = (await query(`SELECT
    (SELECT COUNT(*) FROM svc_demo.DonDeNghi) AS requests,
    (SELECT COUNT(*) FROM svc_demo.DonDeNghi r LEFT JOIN svc_demo.His_InDon p ON p.ID=r.ID WHERE r.LoaiDon LIKE 'DonSV%' AND p.ID IS NULL) AS missingPaperFields,
    (SELECT COUNT(*) FROM svc_demo.DonDeNghi r LEFT JOIN svc_demo.DeNghiVanBan v ON v.ID=r.ID WHERE r.LoaiDon='CONFIRMATION' AND v.ID IS NULL) AS missingDocumentFields,
    (SELECT COUNT(*) FROM svc_demo.DonDeNghi r LEFT JOIN svc_demo.DeNghiEmail e ON e.ID=r.ID WHERE r.LoaiDon='LMS_SUPPORT' AND e.ID IS NULL) AS missingSupportFields,
    (SELECT COUNT(*) FROM svc_demo.DonDeNghi WHERE VaiTroNguoiHuy='STAFF' AND TrangThai='CANCELLED' AND NULLIF(LTRIM(RTRIM(LyDoHuy)),'') IS NULL) AS missingStaffCancelReason`)).first[0];
  for (const [key, value] of Object.entries(counts)) if (key !== 'requests') assert.equal(value, 0, key);
  const checks = (await query(`SELECT name FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID('svc_demo.DonDeNghi') AND is_disabled=0 AND name='CK_DonDeNghi_Huy'`)).first;
  assert.equal(checks.length, 1);
  const backups = [];
  for (const folder of await readdir('.data/backups').catch(() => [])) {
    if (!folder.startsWith('requests-fields-')) continue;
    const root = '.data/backups/' + folder;
    const manifest = JSON.parse(await readFile(root + '/manifest.json', 'utf8'));
    const bytes = await readFile(root + '/rows.json');
    assert.equal(createHash('sha256').update(bytes).digest('hex'), manifest.sha256);
    const oldIds = JSON.parse(bytes).Request?.map(row => row.Id) || [];
    if (oldIds.length) {
      const kept = (await query(`SELECT COUNT(*) AS count FROM svc_demo.DonDeNghi WHERE ID IN (${oldIds.map(() => '?').join(',')})`, oldIds)).first[0].count;
      assert.equal(kept, oldIds.length, 'pre-migration requests must remain available');
    }
    backups.push({ folder, verifiedHash: true, retainedRequests: oldIds.length });
  }
  console.log(JSON.stringify({ ...identity, counts, tableNames, noJsonOrPdfStorage: true, backups }, null, 2));
} finally { await disconnectLocalDatabase(); }
