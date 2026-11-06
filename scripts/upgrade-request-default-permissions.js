import {mkdir,writeFile} from 'node:fs/promises';
import {queryLocalDatabase as query,disconnectLocalDatabase} from '../src/infrastructure/database/local-sql-server.js';
import {assertLocalDemoTarget,localDatabaseGuardSql as guard} from '../src/infrastructure/database/local-write-guard.js';
import {effectivePermissionsViewSql} from '../src/modules/student-requests/repositories/rbac-views.js';

assertLocalDemoTarget();
try{
 const before=(await query("SELECT OBJECT_DEFINITION(OBJECT_ID('svc_demo.vQuyenHieuLuc')) AS definition")).first[0]?.definition;
 if(!before)throw new Error('Initialize RBAC before upgrading default permissions.');
 const folder='.data/backups/rbac-defaults-'+new Date().toISOString().replace(/[:.]/g,'-');
 await mkdir(folder,{recursive:true});await writeFile(folder+'/vQuyenHieuLuc.sql',before);
 await query(guard+`SET XACT_ABORT ON;BEGIN TRY BEGIN TRANSACTION;EXEC(N'${effectivePermissionsViewSql.replaceAll("'","''")}');COMMIT TRANSACTION;END TRY BEGIN CATCH IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;THROW;END CATCH;`);
 console.log('Default specialist operations enabled locally; role assignments, scopes and history retained. View backup: '+folder);
}finally{await disconnectLocalDatabase();}
