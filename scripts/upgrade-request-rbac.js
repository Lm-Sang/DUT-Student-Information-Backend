import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {queryLocalDatabase as query,disconnectLocalDatabase} from '../src/infrastructure/database/local-sql-server.js';
import {assertLocalDemoTarget,localDatabaseGuardSql as guard} from '../src/infrastructure/database/local-write-guard.js';
import {createRequestsRepository} from '../src/modules/student-requests/repositories/requests.repository.js';
import {requestTypes} from '../src/modules/student-requests/domain/request-rules.js';
import {workCatalog} from '../src/modules/student-requests/domain/work-permissions.js';
import {functionPermissions,legacyFunctions} from '../src/modules/student-requests/domain/rbac.js';
import {effectivePermissionsViewSql} from '../src/modules/student-requests/repositories/rbac-views.js';

assertLocalDemoTarget();
try{
 const backup=await query('SELECT * FROM svc_demo.TaiKhoan;SELECT * FROM svc_demo.QuyenXuLy;');
 const folder='.data/backups/rbac-'+new Date().toISOString().replace(/[:.]/g,'-');await mkdir(folder,{recursive:true});
 const snapshot=JSON.stringify(backup.results);await writeFile(folder+'/rows.json',snapshot);await writeFile(folder+'/sha256.txt',createHash('sha256').update(snapshot).digest('hex'));
 const ddl=[
  `IF OBJECT_ID('svc_demo.QuyenRBAC','U') IS NULL CREATE TABLE svc_demo.QuyenRBAC(MaQuyen varchar(100) PRIMARY KEY,TenQuyen nvarchar(250) NOT NULL,Nhom nvarchar(100) NOT NULL);`,
  `IF OBJECT_ID('svc_demo.VaiTroRBAC','U') IS NULL CREATE TABLE svc_demo.VaiTroRBAC(MaRole varchar(64) PRIMARY KEY,TenRole nvarchar(150) NOT NULL UNIQUE,MoTa nvarchar(1000) NOT NULL,HieuLuc bit NOT NULL DEFAULT 1,PhienBan int NOT NULL DEFAULT 1,NgayTao datetime2(3) NOT NULL DEFAULT SYSUTCDATETIME(),NgayCapNhat datetime2(3) NOT NULL DEFAULT SYSUTCDATETIME(),NguoiTao nvarchar(40) NOT NULL REFERENCES svc_demo.TaiKhoan(MaHS));`,
  `IF OBJECT_ID('svc_demo.VaiTroQuyen','U') IS NULL CREATE TABLE svc_demo.VaiTroQuyen(MaRole varchar(64) NOT NULL REFERENCES svc_demo.VaiTroRBAC(MaRole),MaQuyen varchar(100) NOT NULL REFERENCES svc_demo.QuyenRBAC(MaQuyen),PRIMARY KEY(MaRole,MaQuyen));`,
  `IF OBJECT_ID('svc_demo.TaiKhoanVaiTro','U') IS NULL CREATE TABLE svc_demo.TaiKhoanVaiTro(MaHS nvarchar(40) NOT NULL REFERENCES svc_demo.TaiKhoan(MaHS),MaRole varchar(64) NOT NULL REFERENCES svc_demo.VaiTroRBAC(MaRole),NguoiGan nvarchar(40) NOT NULL REFERENCES svc_demo.TaiKhoan(MaHS),NgayGan datetime2(3) NOT NULL DEFAULT SYSUTCDATETIME(),PRIMARY KEY(MaHS,MaRole));`,
  `IF OBJECT_ID('svc_demo.DangNhapChuyenVien','U') IS NULL CREATE TABLE svc_demo.DangNhapChuyenVien(MaHS nvarchar(40) PRIMARY KEY REFERENCES svc_demo.TaiKhoan(MaHS),TenDangNhap varchar(64) NOT NULL UNIQUE,MatKhauBam varchar(200) NOT NULL,NgayTao datetime2(3) NOT NULL DEFAULT SYSUTCDATETIME());`,
  `IF OBJECT_ID('svc_demo.PhienBanVaiTro','U') IS NULL CREATE TABLE svc_demo.PhienBanVaiTro(MaRole varchar(64) NOT NULL REFERENCES svc_demo.VaiTroRBAC(MaRole),PhienBan int NOT NULL,TenRole nvarchar(150) NOT NULL,MoTa nvarchar(1000) NOT NULL,HieuLuc bit NOT NULL,NguoiSua nvarchar(40) NOT NULL REFERENCES svc_demo.TaiKhoan(MaHS),NgayLuu datetime2(3) NOT NULL DEFAULT SYSUTCDATETIME(),PRIMARY KEY(MaRole,PhienBan));`,
  `IF OBJECT_ID('svc_demo.PhienBanVaiTroQuyen','U') IS NULL CREATE TABLE svc_demo.PhienBanVaiTroQuyen(MaRole varchar(64) NOT NULL,PhienBan int NOT NULL,MaQuyen varchar(100) NOT NULL REFERENCES svc_demo.QuyenRBAC(MaQuyen),PRIMARY KEY(MaRole,PhienBan,MaQuyen),FOREIGN KEY(MaRole,PhienBan) REFERENCES svc_demo.PhienBanVaiTro(MaRole,PhienBan));`,
  `IF OBJECT_ID('svc_demo.LichSuRBAC','U') IS NULL CREATE TABLE svc_demo.LichSuRBAC(ID bigint IDENTITY PRIMARY KEY,MaNguoiThucHien nvarchar(40) NOT NULL REFERENCES svc_demo.TaiKhoan(MaHS),ThaoTac varchar(30) NOT NULL,MaRole varchar(64) NULL,MaTaiKhoan nvarchar(40) NULL,MoTa nvarchar(2000) NOT NULL,NgayLap datetime2(3) NOT NULL DEFAULT SYSUTCDATETIME());`,
 ];
 for(const statement of ddl)await query(guard+statement);
 const catalog=await createRequestsRepository().catalogs(),term=catalog.settings.find(s=>s.SettingKey==='currentTerm').SettingValue;
 const permissions=[...functionPermissions,...workCatalog(requestTypes,catalog.documents.filter(d=>d.termCode===term)).map(w=>({key:'work:'+w.key,name:w.name,group:'Phạm vi loại đơn'}))];
 for(const p of permissions)await query(guard+`IF NOT EXISTS(SELECT 1 FROM svc_demo.QuyenRBAC WHERE MaQuyen=?) INSERT svc_demo.QuyenRBAC VALUES(?,?,?);`,[p.key,p.key,p.name,p.group]);
 const view=effectivePermissionsViewSql;
 await query(guard+`EXEC(N'${view.replaceAll("'","''")}');`);
 const workView=`CREATE OR ALTER VIEW svc_demo.vQuyenXuLy AS SELECT MaHS,SUBSTRING(MaQuyen,6,60) AS MaCongViec,CONVERT(bit,1) AS QuyenNhanDon,CONVERT(bit,1) AS QuyenXuLy FROM svc_demo.vQuyenHieuLuc WHERE MaQuyen LIKE 'work:%'`;
 await query(guard+`EXEC(N'${workView.replaceAll("'","''")}');`);
 const seeded=(await query("SELECT 1 FROM svc_demo.CauHinh WHERE MaCauHinh='rbacInitialized'")).first.length;
 if(!seeded){
  const staff=(await query("SELECT MaHS,Hoten FROM svc_demo.TaiKhoan WHERE VaiTro='STAFF'")).first;
  for(const person of staff){
   const grants=(await query('SELECT MaCongViec FROM svc_demo.QuyenXuLy WHERE MaHS=? AND QuyenNhanDon=1 AND QuyenXuLy=1',[person.MaHS])).first;
   const role='legacy:'+person.MaHS,keys=[...legacyFunctions,...grants.map(g=>'work:'+g.MaCongViec)],params=[role,role,'Quyền cũ — '+person.Hoten.slice(0,90)+' ('+person.MaHS+')',role,person.MaHS];
   let statement=`IF NOT EXISTS(SELECT 1 FROM svc_demo.VaiTroRBAC WITH(UPDLOCK,HOLDLOCK) WHERE MaRole=?) BEGIN INSERT svc_demo.VaiTroRBAC(MaRole,TenRole,MoTa,NguoiTao) VALUES(?,?,N'Giữ nguyên cấu hình quyền trước RBAC.','admin-demo');INSERT svc_demo.TaiKhoanVaiTro(MaRole,MaHS,NguoiGan) VALUES(?,?,'admin-demo');`;
   for(const key of keys){statement+='INSERT svc_demo.VaiTroQuyen(MaRole,MaQuyen) VALUES(?,?);';params.push(role,key);}
   statement+=`INSERT svc_demo.PhienBanVaiTro SELECT MaRole,PhienBan,TenRole,MoTa,HieuLuc,'admin-demo',SYSUTCDATETIME() FROM svc_demo.VaiTroRBAC WHERE MaRole=?;INSERT svc_demo.PhienBanVaiTroQuyen SELECT MaRole,1,MaQuyen FROM svc_demo.VaiTroQuyen WHERE MaRole=?;`;params.push(role,role);
   await query('SET XACT_ABORT ON;'+guard+'BEGIN TRANSACTION;'+statement+'END;COMMIT TRANSACTION;',params);
  }
  await query(guard+"INSERT svc_demo.CauHinh(MaCauHinh,GiaTri) VALUES('rbacInitialized','1');");
 }
 console.log('RBAC local migration complete; legacy grants retained as saved roles. Backup: '+folder);
}finally{await disconnectLocalDatabase();}
