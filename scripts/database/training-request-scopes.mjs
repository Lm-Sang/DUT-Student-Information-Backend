// Explicit local test configuration: the training department handles all request
// categories in this portal. School catalogs and historical request rows stay intact.
import {transactionLocalDatabase,disconnectLocalDatabase} from '../../src/infrastructure/database/local-sql-server.js';
import {assertLocalDemoTarget,localDatabaseGuardSql} from '../../src/infrastructure/database/local-write-guard.js';
export async function configureTrainingRequestScopes(){
 assertLocalDemoTarget();
 return transactionLocalDatabase(`SET XACT_ABORT ON;${localDatabaseGuardSql}
 UPDATE svc_demo.LoaiDon SET MaDV='115' WHERE MaLoaiDon<>'CONFIRMATION' AND MaDV<>'115';
 UPDATE svc_demo.Sys_VanBan SET MaDVcap='115' WHERE MaDVcap<>'115';
 INSERT auth.TaskPermissions(TaskId,PermissionName)
 SELECT 4,p.permission FROM (
  SELECT CONVERT(nvarchar(100),'work:'+MaLoaiDon) permission FROM svc_demo.LoaiDon WHERE MaLoaiDon<>'CONFIRMATION' AND MaDV='115'
  UNION SELECT CONVERT(nvarchar(100),'work:CONFIRMATION:'+MaVanBan) FROM svc_demo.Sys_VanBan WHERE MaDVcap='115'
 )p WHERE NOT EXISTS(SELECT 1 FROM auth.TaskPermissions tp WHERE tp.TaskId=4 AND tp.PermissionName=p.permission);
 -- Any prior sessions must reload the expanded task definition.
 UPDATE auth.AccountProfiles SET Revision=Revision+1 WHERE AccessLevel='specialist' AND FieldCode='DT';
 SELECT COUNT(*) AS workScopes FROM auth.TaskPermissions WHERE TaskId=4 AND PermissionName LIKE 'work:%';`);
}
if(process.argv[1]?.replaceAll('\\','/').endsWith('/training-request-scopes.mjs')){
 try{const result=await configureTrainingRequestScopes();console.log(JSON.stringify({department:'DT',...result.first[0]}));}
 catch(error){console.error(error.message);process.exitCode=1;}
 finally{await disconnectLocalDatabase();}
}
