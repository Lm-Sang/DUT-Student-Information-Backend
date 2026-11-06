import { mkdir, writeFile } from 'node:fs/promises';
import { createHash, randomBytes } from 'node:crypto';
import { queryLocalDatabase, disconnectLocalDatabase } from '../src/infrastructure/database/local-sql-server.js';
import { assertLocalDemoTarget, localDatabaseGuardSql } from '../src/infrastructure/database/local-write-guard.js';
import { requestTypes } from '../src/modules/student-requests/domain/request-rules.js';
import { departmentToDatabase } from '../src/modules/student-requests/domain/request-fields.js';

assertLocalDemoTarget();
try {
  const existing = await queryLocalDatabase(`SELECT * FROM svc_demo.TaiKhoan; SELECT * FROM svc_demo.DonDeNghi; SELECT * FROM svc_demo.LichSuXuLyDon; SELECT * FROM svc_demo.CauHinh;`);
  const folder = `.data/backups/workflow-upgrade-${new Date().toISOString().replace(/[:.]/g,'-')}`;
  await mkdir(folder, { recursive: true });
  const snapshot = JSON.stringify(existing.results ?? existing, null, 2);
  await writeFile(`${folder}/rows.json`, snapshot);
  await writeFile(`${folder}/sha256.txt`, createHash('sha256').update(snapshot).digest('hex'));
  const statements = [localDatabaseGuardSql,
    `IF COL_LENGTH('svc_demo.TaiKhoan','PhienBanQuyen') IS NULL ALTER TABLE svc_demo.TaiKhoan ADD PhienBanQuyen int NOT NULL CONSTRAINT DF_TaiKhoan_PhienBanQuyen DEFAULT 1;`,
    `IF COL_LENGTH('svc_demo.TaiKhoan','NguonDanhTinh') IS NULL ALTER TABLE svc_demo.TaiKhoan ADD NguonDanhTinh varchar(20) NOT NULL CONSTRAINT DF_TaiKhoan_Nguon DEFAULT 'DEMO';`,
    `IF COL_LENGTH('svc_demo.TaiKhoan','MaHSTruong') IS NULL ALTER TABLE svc_demo.TaiKhoan ADD MaHSTruong nvarchar(40) NULL;`,
    `IF COL_LENGTH('svc_demo.DonDeNghi','NgayInGanNhat') IS NULL ALTER TABLE svc_demo.DonDeNghi ADD NgayInGanNhat datetime2(3) NULL;`,
    `IF COL_LENGTH('svc_demo.DonDeNghi','QuyTacHenTra') IS NULL ALTER TABLE svc_demo.DonDeNghi ADD QuyTacHenTra varchar(40) NULL;`,
    `IF COL_LENGTH('svc_demo.LichSuXuLyDon','MaCBTruoc') IS NULL ALTER TABLE svc_demo.LichSuXuLyDon ADD MaCBTruoc nvarchar(40) NULL,MaCBSau nvarchar(40) NULL,LyDoBanGiao nvarchar(2000) NULL,NgayIn datetime2(3) NULL;`,
    `IF OBJECT_ID('svc_demo.QuyenXuLy','U') IS NULL CREATE TABLE svc_demo.QuyenXuLy(MaHS nvarchar(40) NOT NULL REFERENCES svc_demo.TaiKhoan(MaHS),MaCongViec varchar(60) NOT NULL,QuyenNhanDon bit NOT NULL,QuyenXuLy bit NOT NULL,NgayCap datetime2(3) NOT NULL DEFAULT SYSUTCDATETIME(),NguoiCap nvarchar(40) NULL REFERENCES svc_demo.TaiKhoan(MaHS),CONSTRAINT PK_QuyenXuLy PRIMARY KEY(MaHS,MaCongViec));`,
    `IF OBJECT_ID('svc_demo.LichSuPhanQuyen','U') IS NULL CREATE TABLE svc_demo.LichSuPhanQuyen(ID bigint IDENTITY PRIMARY KEY,MaNguoiCap nvarchar(40) NOT NULL REFERENCES svc_demo.TaiKhoan(MaHS),MaChuyenVien nvarchar(40) NOT NULL REFERENCES svc_demo.TaiKhoan(MaHS),MaCongViec varchar(60) NOT NULL,DuocXuLy bit NOT NULL,NgayCap datetime2(3) NOT NULL DEFAULT SYSUTCDATETIME());`,
  ];
  for (const sql of statements) await queryLocalDatabase(`SET XACT_ABORT ON;${localDatabaseGuardSql}${sql}`);
  const constraints = (await queryLocalDatabase(`SELECT name FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID('svc_demo.TaiKhoan') AND definition LIKE '%VaiTro%';`)).first;
  for (const c of constraints) {
    if (!/^[\w-]+$/.test(c.name)) throw new Error('Unexpected role constraint name');
    await queryLocalDatabase(`${localDatabaseGuardSql}ALTER TABLE svc_demo.TaiKhoan DROP CONSTRAINT [${c.name}];`);
  }
  await queryLocalDatabase(`${localDatabaseGuardSql}ALTER TABLE svc_demo.TaiKhoan WITH CHECK ADD CONSTRAINT CK_TaiKhoan_VaiTro CHECK(VaiTro IN('STUDENT','STAFF','ADMIN'));`);
  await queryLocalDatabase(`${localDatabaseGuardSql}IF NOT EXISTS(SELECT 1 FROM svc_demo.TaiKhoan WHERE MaHS=N'admin-demo') INSERT svc_demo.TaiKhoan(MaHS,Hoten,VaiTro,MaDV,HieuLuc) VALUES(N'admin-demo',N'Quản trị viên (demo)','ADMIN',NULL,1);`);
  await queryLocalDatabase(`${localDatabaseGuardSql}IF NOT EXISTS(SELECT 1 FROM svc_demo.CauHinh WHERE MaCauHinh='workbookSigningKey') INSERT svc_demo.CauHinh(MaCauHinh,GiaTri) VALUES('workbookSigningKey',?);`,[randomBytes(32).toString('hex')]);
  const seeded = (await queryLocalDatabase(`SELECT 1 AS n FROM svc_demo.CauHinh WHERE MaCauHinh='workflowPermissionsInitialized';`)).first.length;
  if (!seeded) {
    for (const t of requestTypes.filter(t=>t.code!=='CONFIRMATION')) await queryLocalDatabase(`${localDatabaseGuardSql}INSERT svc_demo.QuyenXuLy(MaHS,MaCongViec,QuyenNhanDon,QuyenXuLy) SELECT MaHS,?,1,1 FROM svc_demo.TaiKhoan a WHERE a.VaiTro='STAFF' AND a.MaDV=? AND NOT EXISTS(SELECT 1 FROM svc_demo.QuyenXuLy q WHERE q.MaHS=a.MaHS AND q.MaCongViec=?);`,[t.code,departmentToDatabase(t.department),t.code]);
    await queryLocalDatabase(`${localDatabaseGuardSql}INSERT svc_demo.QuyenXuLy(MaHS,MaCongViec,QuyenNhanDon,QuyenXuLy) SELECT DISTINCT a.MaHS,'CONFIRMATION:'+v.MaVanBan,1,1 FROM svc_demo.TaiKhoan a JOIN svc_demo.Sys_VanBan v ON v.MaDVcap=a.MaDV JOIN svc_demo.CauHinh c ON c.MaCauHinh='currentTerm' AND c.GiaTri=v.IDCode WHERE a.VaiTro='STAFF' AND v.HieuLuc=1 AND NOT EXISTS(SELECT 1 FROM svc_demo.QuyenXuLy q WHERE q.MaHS=a.MaHS AND q.MaCongViec='CONFIRMATION:'+v.MaVanBan);
      INSERT svc_demo.CauHinh(MaCauHinh,GiaTri) VALUES('workflowPermissionsInitialized','1');`);
  }
  console.log('Local workflow upgrade complete; original requests/timestamps retained; backup:',folder);
} finally { await disconnectLocalDatabase(); }
