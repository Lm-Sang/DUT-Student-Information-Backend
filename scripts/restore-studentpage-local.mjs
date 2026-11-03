import sql from 'msnodesqlv8';
import {writeFile} from 'node:fs/promises';
const database='Studentpage_Integration_20261103';
// Deliberately isolated local restore. Never uses REPLACE; existing target is reused.

const pool=new sql.Pool({connectionString:'Driver={ODBC Driver 17 for SQL Server};Server={localhost,1433};Database={master};Trusted_Connection=Yes;Encrypt=No;TrustServerCertificate=Yes;',floor:1,ceiling:1});
try {await pool.promises.open();const paths=(await pool.promises.query("SELECT CAST(SERVERPROPERTY('InstanceDefaultDataPath') AS nvarchar(4000)) AS d,CAST(SERVERPROPERTY('InstanceDefaultLogPath') AS nvarchar(4000)) AS l")).first[0];
const existing=(await pool.promises.query('SELECT name FROM sys.databases WHERE name=?',[database])).first;
if(!existing.length){const literal=s=>"N'"+s.replaceAll("'","''")+"'";await pool.promises.query(`RESTORE DATABASE [${database}] FROM DISK=N'D:\\PBL6_DUT\\DUT-Student-Information-Backend\\.data\\Studentpage.bak' WITH MOVE N'Studentpage' TO ${literal(paths.d+database+'.mdf')},MOVE N'Studentpage_log' TO ${literal(paths.l+database+'_log.ldf')},RECOVERY;`,[],{timeoutMs:120000});}
const r=await pool.promises.query(`SELECT t.name AS Bang,c.name AS Cot,ty.name AS Kieu,c.max_length AS DoDai,c.is_nullable AS ChoNull FROM ${database}.sys.tables t JOIN ${database}.sys.columns c ON c.object_id=t.object_id JOIN ${database}.sys.types ty ON ty.user_type_id=c.user_type_id ORDER BY t.name,c.column_id;`);
await writeFile('.data/research/studentpage-schema.json',JSON.stringify(r.first,null,2));console.log(JSON.stringify({database,tables:[...new Set(r.first.map(r=>r.Bang))]}));
}finally{await pool.promises.close()}
