import { queryLocalDatabase as query, disconnectLocalDatabase } from '../src/infrastructure/database/local-sql-server.js';
import { assertLocalDemoTarget, localDatabaseGuardSql } from '../src/infrastructure/database/local-write-guard.js';
import { requestTypes } from '../src/modules/student-requests/domain/request-catalog.seed.js';
import { formFields } from '../src/modules/student-requests/dto/requests.dto.js';
import { departmentToDatabase } from '../src/modules/student-requests/domain/request-fields.js';

try {
  assertLocalDemoTarget();
  const params = [];
  const bind = value => { params.push(value); return '?'; };
  const statements = [
    `IF OBJECT_ID('svc_demo.LoaiDon','U') IS NULL CREATE TABLE svc_demo.LoaiDon(
      MaLoaiDon varchar(20) PRIMARY KEY,TenLoaiDon nvarchar(250) NOT NULL,Nhom varchar(30) NOT NULL,
      MaDV varchar(20) NOT NULL,CachNop varchar(20) NOT NULL CHECK(CachNop IN('PAPER_FORM','WEB')),
      MaMauDuLieu varchar(30) NOT NULL,MaMauIn varchar(30) NULL,BieuTuong varchar(30) NOT NULL DEFAULT 'file',
      MoTa nvarchar(1000) NOT NULL,HieuLuc bit NOT NULL DEFAULT 1,ThuTu int NOT NULL DEFAULT 0);`,
    `IF OBJECT_ID('svc_demo.TruongLoaiDon','U') IS NULL CREATE TABLE svc_demo.TruongLoaiDon(
      MaLoaiDon varchar(20) NOT NULL REFERENCES svc_demo.LoaiDon(MaLoaiDon),TenTruong varchar(60) NOT NULL,
      BatBuoc bit NOT NULL DEFAULT 0,ThuTu int NOT NULL,PRIMARY KEY(MaLoaiDon,TenTruong));`,
  ];
  for (const [index, type] of requestTypes.entries()) {
    statements.push(`IF NOT EXISTS(SELECT 1 FROM svc_demo.LoaiDon WHERE MaLoaiDon=${bind(type.code)})
      INSERT svc_demo.LoaiDon(MaLoaiDon,TenLoaiDon,Nhom,MaDV,CachNop,MaMauDuLieu,MaMauIn,BieuTuong,MoTa,ThuTu)
      VALUES(${[type.code,type.name,type.group,departmentToDatabase(type.department),type.submissionMode,type.code,
        type.submissionMode === 'PAPER_FORM' ? type.code : null,type.icon,type.description,index].map(bind).join(',')});`);
    for (const [order, field] of (formFields[type.code] || []).entries()) statements.push(`
      IF NOT EXISTS(SELECT 1 FROM svc_demo.TruongLoaiDon WHERE MaLoaiDon=${bind(type.code)} AND TenTruong=${bind(field)})
      INSERT svc_demo.TruongLoaiDon(MaLoaiDon,TenTruong,BatBuoc,ThuTu) VALUES(${bind(type.code)},${bind(field)},0,${bind(order)});`);
  }
  // The old fixed type CHECK prevents registering a new type in the catalog.
  statements.push(`DECLARE @drop nvarchar(max)=N'';
    SELECT @drop=@drop+N'ALTER TABLE svc_demo.DonDeNghi DROP CONSTRAINT '+QUOTENAME(name)+N';'
    FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID('svc_demo.DonDeNghi')
      AND (definition LIKE '%LoaiDon%' OR definition LIKE '%TypeCode%');
    EXEC sys.sp_executesql @drop;`);
  await query(`SET NOCOUNT ON;SET XACT_ABORT ON;${localDatabaseGuardSql}
    BEGIN TRY BEGIN TRANSACTION;${statements.join('\n')}COMMIT TRANSACTION;END TRY
    BEGIN CATCH IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;THROW;END CATCH;`, params);
  console.log('Local request catalog ready. Existing catalog edits are preserved when rerunning.');
} finally { await disconnectLocalDatabase(); }
