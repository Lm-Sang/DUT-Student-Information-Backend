import {queryLocalDatabase} from '../../src/infrastructure/database/local-sql-server.js';
import {assertLocalDemoTarget,localDatabaseGuardSql} from '../../src/infrastructure/database/local-write-guard.js';
export async function cleanupRbacFixtures(actors=[],roles=[]){
 if(!actors.length&&!roles.length)return;
 if(actors.some(id=>!/^qa-[\w:-]+$|^cv:[a-f0-9-]{36}$/i.test(id))||roles.some(id=>! /^[a-f0-9-]{36}$/i.test(id)))throw Error('Unsafe QA cleanup identifier');
 assertLocalDemoTarget();const params=[...actors,...roles];
 await queryLocalDatabase(`SET NOCOUNT ON;SET XACT_ABORT ON;${localDatabaseGuardSql}
 DECLARE @actors TABLE(ID nvarchar(40) PRIMARY KEY);DECLARE @roles TABLE(ID varchar(64) PRIMARY KEY);
 ${actors.length?'INSERT @actors VALUES '+actors.map(()=>'(?)').join(',')+';':''}${roles.length?'INSERT @roles VALUES '+roles.map(()=>'(?)').join(',')+';':''}
 IF EXISTS(SELECT 1 FROM @actors t JOIN svc_demo.TaiKhoan a ON a.MaHS=t.ID WHERE a.MaHS NOT LIKE 'qa-%' AND NOT EXISTS(SELECT 1 FROM svc_demo.DangNhapChuyenVien c WHERE c.MaHS=a.MaHS AND c.TenDangNhap LIKE 'qa-rbac-%')) THROW 51999,'Not a QA account',1;
 IF EXISTS(SELECT 1 FROM @roles t JOIN svc_demo.VaiTroRBAC r ON r.MaRole=t.ID WHERE r.TenRole NOT LIKE 'QA RBAC %') THROW 51999,'Not a QA role',1;
 INSERT @roles SELECT r.MaRole FROM svc_demo.VaiTroRBAC r JOIN @actors a ON r.MaRole='legacy:'+a.ID WHERE NOT EXISTS(SELECT 1 FROM @roles t WHERE t.ID=r.MaRole);
 BEGIN TRY BEGIN TRANSACTION;
 DELETE svc_demo.TaiKhoanVaiTro WHERE MaHS IN(SELECT ID FROM @actors) OR MaRole IN(SELECT ID FROM @roles);
 DELETE svc_demo.PhienBanVaiTroQuyen WHERE MaRole IN(SELECT ID FROM @roles);DELETE svc_demo.PhienBanVaiTro WHERE MaRole IN(SELECT ID FROM @roles);
 DELETE svc_demo.VaiTroQuyen WHERE MaRole IN(SELECT ID FROM @roles);
 DELETE svc_demo.LichSuRBAC WHERE MaRole IN(SELECT ID FROM @roles) OR MaTaiKhoan IN(SELECT ID FROM @actors) OR MaNguoiThucHien IN(SELECT ID FROM @actors);
 DELETE svc_demo.VaiTroRBAC WHERE MaRole IN(SELECT ID FROM @roles);
 DELETE svc_demo.DangNhapChuyenVien WHERE MaHS IN(SELECT ID FROM @actors);
 DELETE svc_demo.LichSuPhanQuyen WHERE MaChuyenVien IN(SELECT ID FROM @actors);DELETE svc_demo.QuyenXuLy WHERE MaHS IN(SELECT ID FROM @actors);
 DELETE svc_demo.NhanThan WHERE MaHS IN(SELECT ID FROM @actors);DELETE svc_demo.TaiKhoan WHERE MaHS IN(SELECT ID FROM @actors);
 COMMIT TRANSACTION;END TRY BEGIN CATCH IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;THROW;END CATCH;`,params);
}
