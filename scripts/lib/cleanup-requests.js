import { queryLocalDatabase } from '../../src/infrastructure/database/local-sql-server.js';
import { assertLocalDemoTarget, localDatabaseGuardSql } from '../../src/infrastructure/database/local-write-guard.js';
export async function cleanupRequests(ids) {
  if(!ids.length)return;
  if(ids.some(id=>!/^[a-f0-9-]{36}$/i.test(id)))throw new Error('Invalid cleanup ID');
  assertLocalDemoTarget();
  await queryLocalDatabase(`SET NOCOUNT ON;SET XACT_ABORT ON;${localDatabaseGuardSql}
   DECLARE @ids TABLE(ID uniqueidentifier PRIMARY KEY);INSERT @ids VALUES ${ids.map(()=>'(?)').join(',')};
   BEGIN TRY BEGIN TRANSACTION;
   DELETE f FROM svc_demo.LichSuTruongDuLieu f JOIN svc_demo.LichSuXuLyDon e ON e.ID=f.IDLichSu JOIN @ids x ON x.ID=e.IDDon;
   DELETE FROM svc_demo.TruongCanBoSung WHERE IDDon IN(SELECT ID FROM @ids);
   DELETE FROM svc_demo.His_InDon WHERE ID IN(SELECT ID FROM @ids);
   DELETE FROM svc_demo.DeNghiVanBan WHERE ID IN(SELECT ID FROM @ids);
   DELETE FROM svc_demo.DeNghiEmail WHERE ID IN(SELECT ID FROM @ids);
   DELETE FROM svc_demo.ChongGuiTrung WHERE IDDon IN(SELECT ID FROM @ids);
   DELETE FROM svc_demo.LichSuXuLyDon WHERE IDDon IN(SELECT ID FROM @ids);
   DELETE FROM svc_demo.LichSuNoiDungDon WHERE IDDon IN(SELECT ID FROM @ids);
   DELETE FROM svc_demo.DonDeNghi WHERE ID IN(SELECT ID FROM @ids);
   COMMIT TRANSACTION;END TRY BEGIN CATCH IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;THROW;END CATCH;`,ids);
}
