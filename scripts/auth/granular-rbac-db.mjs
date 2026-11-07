import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {transactionLocalDatabase,disconnectLocalDatabase} from '../../src/infrastructure/database/local-sql-server.js';
import {assertLocalDemoTarget,localDatabaseGuardSql} from '../../src/infrastructure/database/local-write-guard.js';
import {assignedPermissionsViewSql,effectiveAuthPermissionsViewSql,workflowPermissionsViewSql} from '../../src/common/auth/repositories/authorization-views.js';
export async function upgradeGranularRbac(){
 assertLocalDemoTarget();const sql=await readFile(new URL('../database/sql/granular-rbac.sql',import.meta.url),'utf8');
 await transactionLocalDatabase(localDatabaseGuardSql+sql+[assignedPermissionsViewSql,effectiveAuthPermissionsViewSql,workflowPermissionsViewSql].map(v=>`EXEC(N'${v.replaceAll("'","''")}');`).join('\n'));
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){try{await upgradeGranularRbac();console.log('Local granular auth roles and permissions ready.');}catch(e){console.error(e.message);process.exitCode=1;}finally{await disconnectLocalDatabase();}}
