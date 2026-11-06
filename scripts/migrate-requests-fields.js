import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { queryLocalDatabase as query, disconnectLocalDatabase } from '../src/infrastructure/database/local-sql-server.js';
import { assertLocalDemoTarget, localDatabaseGuardSql } from '../src/infrastructure/database/local-write-guard.js';
import { allPayloadColumns, paperColumns } from '../src/modules/student-requests/domain/request-fields.js';
import { tables, payloadType } from './lib/requests-schema.js';

const quote = text => "N'" + text.replaceAll("'", "''") + "'";
const exec = sql => `EXEC sys.sp_executesql ${quote(sql)};`;
const jsonValue = (alias, key, column) => ['MienPhi','Khan','XacNhanChuTaiKhoan'].includes(column)
  ? `CASE WHEN JSON_VALUE(${alias},'$.${key}') IN ('FREE','RUSH','true') THEN 1 ELSE 0 END`
  : `TRY_CONVERT(${payloadType(column)},JSON_VALUE(${alias},'$.${key}'))`;
try {
  assertLocalDemoTarget();
  const existing = (await query("SELECT t.name FROM sys.tables t JOIN sys.schemas s ON s.schema_id=t.schema_id WHERE s.name='svc_demo'")).first.map(r => r.name);
  const legacy = existing.includes('Request');
  if (legacy && existing.includes('DonDeNghi')) throw new Error('Both schema generations exist; migration stopped without changes.');
  if (legacy) {
    // Verified backup precedes removal of obsolete JSON columns and cached PDFs.
    const folder = `.data/backups/requests-fields-${new Date().toISOString().replace(/[:.]/g,'-')}`;
    await mkdir(folder, { recursive: true });
    const backup = {};
    for (const [, old] of tables) if (existing.includes(old)) backup[old] = (await query(`SELECT * FROM svc_demo.[${old}]`)).first;
    if (existing.includes('RequestFile')) backup.RequestFile = (await query('SELECT * FROM svc_demo.RequestFile')).first;
    const bytes = Buffer.from(JSON.stringify(backup));
    await writeFile(`${folder}/rows.json`, bytes);
    const stored = await readFile(`${folder}/rows.json`);
    if (!stored.equals(bytes)) throw new Error('Backup verification failed');
    await writeFile(`${folder}/legacy-schema.sql`, await readFile('scripts/queries/requests-demo-local.sql'));
    await writeFile(`${folder}/manifest.json`, JSON.stringify({ database: 'sv_dut', sha256: createHash('sha256').update(stored).digest('hex'),
      rows: Object.fromEntries(Object.entries(backup).map(([name, rows]) => [name, rows.length])) }, null, 2));
    console.log(`Verified local backup: ${folder}`);
  }
  const sql = [localDatabaseGuardSql, "IF SCHEMA_ID('svc_demo') IS NULL EXEC('CREATE SCHEMA svc_demo');"];
  const restoreChecks=[];
  if (legacy) {
    const checks=(await query("SELECT OBJECT_NAME(parent_object_id) AS Bang,name,definition FROM sys.check_constraints WHERE SCHEMA_NAME(schema_id)='svc_demo'")).first;
    for (const check of checks) {
      sql.push(exec(`ALTER TABLE svc_demo.[${check.Bang}] DROP CONSTRAINT [${check.name}];`));
      const spec=tables.find(t=>t[1]===check.Bang);
      if(!spec||/Json|FeeMode|ServiceSpeed/.test(check.definition)||check.name==='CK_DemoCancellation')continue;
      let definition=check.definition;
      for(const [col,,old]of spec[2])if(old)definition=definition.replace(new RegExp(`\\b${old}\\b`,'g'),col);
      definition=definition.replaceAll("'DT'","'115'").replaceAll("'CTSV'","'120'");
      restoreChecks.push(exec(`ALTER TABLE svc_demo.[${spec[0]}] ADD CONSTRAINT [${check.name}] CHECK ${definition};`));
    }
    sql.push(exec('ALTER TABLE svc_demo.DocumentRequest DROP COLUMN TotalFee;'));
  }
  for (const [name, old, columns] of tables) {
    if (legacy && existing.includes(old)) {
      sql.push(`EXEC sys.sp_rename N'svc_demo.${old}', N'${name}';`);
      const oldCols = (await query(`SELECT name FROM sys.columns WHERE object_id=OBJECT_ID('svc_demo.${old}')`)).first.map(r => r.name);
      for (const [column, type, previous] of columns) {
        if(legacy && name==='DeNghiVanBan' && previous==='TotalFee') {sql.push(exec(`ALTER TABLE svc_demo.DeNghiVanBan ADD ThanhTien ${type};`));continue;}
        if (previous && oldCols.includes(previous)) {
          if (previous !== column) sql.push(`EXEC sys.sp_rename N'svc_demo.${name}.${previous}', N'${column}', N'COLUMN';`);
        } else if (!oldCols.includes(column)) sql.push(exec(`ALTER TABLE svc_demo.${name} ADD [${column}] ${type};`));
      }
    } else {
      const constraints = name === 'Sys_VanBan' ? ',PRIMARY KEY(IDCode,MaVanBan)' : name === 'LichSuNoiDungDon' ? ',UNIQUE(IDDon,LanBoSung)' : name === 'ChongGuiTrung' ? ',UNIQUE(MaHS,MaThaoTac)' : '';
      sql.push(exec(`IF OBJECT_ID('svc_demo.${name}') IS NULL CREATE TABLE svc_demo.${name} (${columns.map(([c,t]) => `[${c}] ${t}`).join(',')}${constraints});`));
    }
  }
  const childTables = [
    `His_InDon (ID uniqueidentifier PRIMARY KEY REFERENCES svc_demo.DonDeNghi(ID),${Object.values(paperColumns).map(c=>`[${c}] ${payloadType(c)} NULL`).join(',')})`,
    'TruongCanBoSung (IDDon uniqueidentifier REFERENCES svc_demo.DonDeNghi(ID),TenTruong nvarchar(60) NOT NULL,PRIMARY KEY(IDDon,TenTruong))',
    'LichSuTruongDuLieu (IDLichSu bigint REFERENCES svc_demo.LichSuXuLyDon(ID),TenTruong nvarchar(60) NOT NULL,LoaiThayDoi varchar(30) NOT NULL,PRIMARY KEY(IDLichSu,TenTruong,LoaiThayDoi))',
    `KetQuaHocTapHocKy (MaHS nvarchar(40) REFERENCES svc_demo.NhanThan(MaHS),IDCode nvarchar(12) NOT NULL,ThuTu int NOT NULL,TenKH nvarchar(150) NULL,
      SoTinChi decimal(10,2) NULL,SoTinChiHocLai decimal(10,2) NULL,DiemTBCHB decimal(10,2) NULL,DiemTBC decimal(10,2) NULL,DiemTBCTL decimal(10,2) NULL,CoDiemDuoi5 nvarchar(20) NULL,DiemRL decimal(10,2) NULL,PRIMARY KEY(MaHS,IDCode))`,
  ];
  for (const ddl of childTables) { const name = ddl.split(' ')[0]; sql.push(exec(`IF OBJECT_ID('svc_demo.${name}') IS NULL CREATE TABLE svc_demo.${ddl};`)); }
  for (const column of Object.values(allPayloadColumns)) sql.push(exec(`IF COL_LENGTH('svc_demo.LichSuNoiDungDon','${column}') IS NULL ALTER TABLE svc_demo.LichSuNoiDungDon ADD [${column}] ${payloadType(column)} NULL;`));
  if (legacy) {
    // Drop only constraints that refer to obsolete columns or old department values.
    sql.push(exec(`DECLARE @drop nvarchar(max)=N'';
      SELECT @drop=@drop+N'ALTER TABLE svc_demo.'+QUOTENAME(OBJECT_NAME(parent_object_id))+N' DROP CONSTRAINT '+QUOTENAME(name)+N';'
      FROM sys.check_constraints WHERE SCHEMA_NAME(schema_id)='svc_demo'
       AND (definition LIKE '%Json%' OR definition LIKE '%FeeMode%' OR definition LIKE '%ServiceSpeed%' OR definition LIKE '%Department%' OR definition LIKE '%MaDV%' OR name LIKE '%Department%' OR name='CK_DemoCancellation');
      SELECT @drop=@drop+N'ALTER TABLE svc_demo.'+QUOTENAME(OBJECT_NAME(parent_object_id))+N' DROP CONSTRAINT '+QUOTENAME(name)+N';'
      FROM sys.default_constraints WHERE parent_object_id=OBJECT_ID('svc_demo.DonDeNghi') AND COL_NAME(parent_object_id,parent_column_id)='RequiredFieldsJson';
      EXEC sys.sp_executesql @drop;`));
    sql.push(exec(`UPDATE svc_demo.Sys_VanBan SET KhongMienPhi=1-CONVERT(int,KhongMienPhi);
      UPDATE svc_demo.Sys_VanBan SET MaDVcap=CASE MaDVcap WHEN 'DT' THEN '115' WHEN 'CTSV' THEN '120' ELSE MaDVcap END;
      UPDATE svc_demo.TaiKhoan SET MaDV=CASE MaDV WHEN 'DT' THEN '115' WHEN 'CTSV' THEN '120' ELSE MaDV END;
      UPDATE svc_demo.DonDeNghi SET MaDV=CASE MaDV WHEN 'DT' THEN '115' WHEN 'CTSV' THEN '120' ELSE MaDV END;
      UPDATE svc_demo.DeNghiVanBan SET MienPhi=CASE WHEN FeeMode='FREE' THEN 1 ELSE 0 END,Khan=CASE WHEN ServiceSpeed='RUSH' THEN 1 ELSE 0 END;
      INSERT svc_demo.His_InDon(ID,${Object.values(paperColumns).join(',')})
      SELECT ID,${Object.entries(paperColumns).map(([k,c])=>jsonValue('PayloadJson',k,c)).join(',')} FROM svc_demo.DonDeNghi WHERE LoaiDon LIKE 'DonSV%';
      UPDATE h SET LoaiDon=r.LoaiDon,${Object.entries(allPayloadColumns).map(([k,c])=>`h.[${c}]=${jsonValue('h.PayloadJson',k,c)}`).join(',')}
      FROM svc_demo.LichSuNoiDungDon h JOIN svc_demo.DonDeNghi r ON r.ID=h.IDDon;
      INSERT svc_demo.TruongCanBoSung(IDDon,TenTruong) SELECT r.ID,j.value FROM svc_demo.DonDeNghi r CROSS APPLY OPENJSON(r.RequiredFieldsJson) j;
      UPDATE svc_demo.LichSuXuLyDon SET MaLyDoHuy=JSON_VALUE(DetailsJson,'$.cancelReasonCode'),LyDoMau=JSON_VALUE(DetailsJson,'$.presetReason'),NoiDungThem=JSON_VALUE(DetailsJson,'$.additionalMessage'),
        NgayXuLy=TRY_CONVERT(datetime2(3),JSON_VALUE(DetailsJson,'$.processedAt'),127),NgayHenTra=TRY_CONVERT(datetime2(3),JSON_VALUE(DetailsJson,'$.pickupAt'),127),
        NoiTraHS=JSON_VALUE(DetailsJson,'$.pickupLocation'),QuyTacHenTra=JSON_VALUE(DetailsJson,'$.appointmentPolicy');
      INSERT svc_demo.LichSuTruongDuLieu(IDLichSu,TenTruong,LoaiThayDoi)
      SELECT e.ID,j.value,'YEU_CAU_BO_SUNG' FROM svc_demo.LichSuXuLyDon e CROSS APPLY OPENJSON(e.DetailsJson,'$.requiredFields') j
      UNION ALL SELECT e.ID,j.value,'DA_THAY_DOI' FROM svc_demo.LichSuXuLyDon e CROSS APPLY OPENJSON(e.DetailsJson,'$.changedFields') j;
      UPDATE svc_demo.NhanThan SET Hoten=JSON_VALUE(ProfileJson,'$.name'),SoThe=JSON_VALUE(ProfileJson,'$.studentNumber'),Lop=JSON_VALUE(ProfileJson,'$.className'),
        NgaySinh=TRY_CONVERT(date,JSON_VALUE(ProfileJson,'$.dateOfBirth'),103),SoCCCD=JSON_VALUE(ProfileJson,'$.identityNumber'),DienThoai=JSON_VALUE(ProfileJson,'$.phone'),
        NoiSinh=JSON_VALUE(ProfileJson,'$.birthPlace'),GioiTinh=JSON_VALUE(ProfileJson,'$.gender'),DanToc=JSON_VALUE(ProfileJson,'$.ethnicity'),TenNganhTQ=JSON_VALUE(ProfileJson,'$.programName'),
        LoaiAnh=JSON_VALUE(ProfileJson,'$.photoKind'),NguonDuLieu=JSON_VALUE(ProfileJson,'$.source'),
        TongTinChiChuongTrinh=TRY_CONVERT(decimal(10,2),JSON_VALUE(ProfileJson,'$.academic.requiredCredits')),
        TinChiTichLuy=TRY_CONVERT(decimal(10,2),JSON_VALUE(ProfileJson,'$.academic.earnedCredits')),
        DiemTBCTL=TRY_CONVERT(decimal(10,2),JSON_VALUE(ProfileJson,'$.academic.cumulativeGpa')),DiemTBRL=TRY_CONVERT(decimal(10,2),JSON_VALUE(ProfileJson,'$.academic.conductAverage'));
      INSERT svc_demo.KetQuaHocTapHocKy(MaHS,IDCode,ThuTu,TenKH,SoTinChi,SoTinChiHocLai,DiemTBCHB,DiemTBC,DiemTBCTL,CoDiemDuoi5,DiemRL)
      SELECT p.MaHS,JSON_VALUE(j.value,'$.termCode'),CONVERT(int,j.[key]),JSON_VALUE(j.value,'$.termName'),TRY_CONVERT(decimal(10,2),JSON_VALUE(j.value,'$.credits')),
        TRY_CONVERT(decimal(10,2),JSON_VALUE(j.value,'$.repeatedCredits')),TRY_CONVERT(decimal(10,2),JSON_VALUE(j.value,'$.scholarshipAverage')),TRY_CONVERT(decimal(10,2),JSON_VALUE(j.value,'$.gpa')),
        TRY_CONVERT(decimal(10,2),JSON_VALUE(j.value,'$.cumulativeGpa')),JSON_VALUE(j.value,'$.hasLowGrade'),TRY_CONVERT(decimal(10,2),JSON_VALUE(j.value,'$.conductScore'))
      FROM svc_demo.NhanThan p CROSS APPLY OPENJSON(p.ProfileJson,'$.semesterResults') j;
      DECLARE @photo nvarchar(max),@student nvarchar(40); DECLARE photos CURSOR LOCAL FAST_FORWARD FOR
       SELECT p.MaHS,x.Photo FROM svc_demo.NhanThan p CROSS APPLY OPENJSON(p.ProfileJson) WITH(Photo nvarchar(max) '$.photoBase64') x WHERE x.Photo IS NOT NULL;
      OPEN photos; FETCH NEXT FROM photos INTO @student,@photo; WHILE @@FETCH_STATUS=0 BEGIN
       UPDATE svc_demo.NhanThan SET AnhSinhVien=CAST(N'' AS xml).value('xs:base64Binary(sql:variable("@photo"))','varbinary(max)') WHERE MaHS=@student;
       FETCH NEXT FROM photos INTO @student,@photo; END; CLOSE photos; DEALLOCATE photos;
      IF (SELECT COUNT(*) FROM svc_demo.His_InDon)<>(SELECT COUNT(*) FROM svc_demo.DonDeNghi WHERE LoaiDon LIKE 'DonSV%') THROW 51005,'Paper row migration mismatch',1;
      IF EXISTS(SELECT 1 FROM svc_demo.NhanThan WHERE Hoten IS NULL OR SoThe IS NULL) THROW 51005,'Profile migration mismatch',1;`));
    for (const [table, columns] of [['DonDeNghi',['PayloadJson','RequiredFieldsJson','CatalogSnapshotJson']],['LichSuNoiDungDon',['PayloadJson']],['LichSuXuLyDon',['DetailsJson']],['NhanThan',['ProfileJson']],['DeNghiVanBan',['FeeMode','ServiceSpeed']]]) {
      for (const col of columns) sql.push(exec(`ALTER TABLE svc_demo.${table} DROP COLUMN [${col}];`));
    }
    sql.push(exec("IF OBJECT_ID('svc_demo.RequestFile') IS NOT NULL DROP TABLE svc_demo.RequestFile;"));
  }
  sql.push(exec('ALTER TABLE svc_demo.Sys_VanBan ALTER COLUMN KhongMienPhi bit NULL;'));
  sql.push(...restoreChecks);
  sql.push(exec(`IF NOT EXISTS(SELECT 1 FROM sys.check_constraints WHERE name='CK_DonDeNghi_Huy') ALTER TABLE svc_demo.DonDeNghi ADD CONSTRAINT CK_DonDeNghi_Huy CHECK(
    TrangThai<>'CANCELLED' OR (VaiTroNguoiHuy IN ('STUDENT','STAFF') AND NguoiHuy IS NOT NULL AND NgayHuy IS NOT NULL AND (VaiTroNguoiHuy='STUDENT' OR NULLIF(LTRIM(RTRIM(LyDoHuy)),'') IS NOT NULL)));
    IF EXISTS(SELECT 1 FROM sys.columns c JOIN sys.tables t ON t.object_id=c.object_id WHERE SCHEMA_NAME(t.schema_id)='svc_demo' AND c.name LIKE '%Json%') THROW 51005,'JSON column remains',1;`));
  const schema = `SET NOCOUNT ON; SET XACT_ABORT ON; BEGIN TRY BEGIN TRANSACTION;\n${sql.join('\n')}\nCOMMIT TRANSACTION; END TRY BEGIN CATCH IF @@TRANCOUNT>0 ROLLBACK TRANSACTION; THROW; END CATCH;`;
  await query(schema);
  console.log('Normalized Vietnamese fields in local sv_dut. No PDF/JSON columns remain in svc_demo.');
} finally { await disconnectLocalDatabase(); }
