import {createTypeOrmConnection} from '../src/infrastructure/database/typeorm-connection.js';
import {windowsSqlDriver} from '../src/infrastructure/database/typeorm-driver.js';
import {localConnectionString} from '../src/infrastructure/database/local-sql-server.js';
import {positionalSql} from '../src/infrastructure/database/sql-parameters.js';
import {assertLocalDemoTarget} from '../src/infrastructure/database/local-write-guard.js';
import {env} from '../src/config/env.js';
import {writeFile} from 'node:fs/promises';
const database='Studentpage_Integration_20261103';
// Deliberately isolated local restore. Never uses REPLACE; existing target is reused.

const config={...env.localDatabase,host:'localhost',port:1433,name:'master'};
assertLocalDemoTarget({...config,name:database});
const pool=createTypeOrmConnection({beforeWrite:()=>assertLocalDemoTarget({...config,name:database}),options:{type:'mssql',driver:windowsSqlDriver(),host:config.host,port:config.port,database:'master',extra:{connectionString:localConnectionString(config)},options:{trustedConnection:true,useUTC:true},requestTimeout:120000,pool:{min:0,max:1}}});
const run=(statement,parameters=[])=>pool.query(positionalSql(statement,parameters),parameters);
try {await pool.connect();const paths=(await run("SELECT CAST(SERVERPROPERTY('InstanceDefaultDataPath') AS nvarchar(4000)) AS d,CAST(SERVERPROPERTY('InstanceDefaultLogPath') AS nvarchar(4000)) AS l")).first[0];
const existing=(await run('SELECT name FROM sys.databases WHERE name=?',[database])).first;
if(!existing.length){const literal=s=>"N'"+s.replaceAll("'","''")+"'";await run(`RESTORE DATABASE [${database}] FROM DISK=N'D:\\PBL6_DUT\\DUT-Student-Information-Backend\\.data\\Studentpage.bak' WITH MOVE N'Studentpage' TO ${literal(paths.d+database+'.mdf')},MOVE N'Studentpage_log' TO ${literal(paths.l+database+'_log.ldf')},RECOVERY;`,[],{timeoutMs:120000});}
const r=await run(`SELECT t.name AS Bang,c.name AS Cot,ty.name AS Kieu,c.max_length AS DoDai,c.is_nullable AS ChoNull FROM ${database}.sys.tables t JOIN ${database}.sys.columns c ON c.object_id=t.object_id JOIN ${database}.sys.types ty ON ty.user_type_id=c.user_type_id ORDER BY t.name,c.column_id;`);
await writeFile('.data/research/studentpage-schema.json',JSON.stringify(r.first,null,2));console.log(JSON.stringify({database,tables:[...new Set(r.first.map(r=>r.Bang))]}));
}finally{await pool.disconnect()}
