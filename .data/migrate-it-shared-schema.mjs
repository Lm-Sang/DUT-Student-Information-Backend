import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {env} from '../src/config/env.js';
import {localConnectionString} from '../src/infrastructure/database/local-sql-server.js';
const {default:native}=await import('msnodesqlv8');
assert.equal(env.localDatabase.name,'Studentpage');
assert.ok(['localhost','127.0.0.1','::1'].includes(env.localDatabase.host));
const connection=await native.promises.open(localConnectionString(env.localDatabase));
const q=(sql,params=[])=>connection.promises.query(sql,params,{timeoutMs:30000});
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const it=['tmCNTTChungChi','tmCNTTChungChi_SV','tmCNTTChungChi_File'];
const language=['Languages','CertificateTypes','CertificateLevels','RecognitionPolicies','StudentCertificates','EvidenceFiles'];
async function snapshot(schema,tables){const rows={};for(const table of tables)rows[table]=(await q('SELECT * FROM ['+schema+'].['+table+'] WITH(HOLDLOCK) ORDER BY ID')).first;return rows;}
async function columns(schema){return(await q(`SELECT t.name AS tableName,c.column_id,c.name,ty.name AS type,c.max_length,c.precision,c.scale,
 c.is_nullable,c.is_identity,c.collation_name FROM sys.tables t JOIN sys.columns c ON c.object_id=t.object_id
 JOIN sys.types ty ON ty.user_type_id=c.user_type_id WHERE SCHEMA_NAME(t.schema_id)=? AND t.name LIKE 'tmCNTTChungChi%'
 ORDER BY t.name,c.column_id`,[schema])).first;}
let active=false;
try {
 await q('SET XACT_ABORT ON; BEGIN TRANSACTION;');active=true;
 const source=(await q("SELECT COUNT(*) AS n FROM sys.tables WHERE schema_id=SCHEMA_ID('dbo') AND name IN('tmCNTTChungChi','tmCNTTChungChi_SV','tmCNTTChungChi_File')")).first[0].n;
 assert.equal(source,3,'Expected the three known dbo tables before migration');
 for(const table of it)await q('SELECT COUNT(*) AS n FROM dbo.['+table+'] WITH(TABLOCKX,HOLDLOCK)');
 const data=await snapshot('dbo',it),metadata=await columns('dbo'),foreign=await snapshot('certification',language);
 const objects=(await q("SELECT name,object_id FROM sys.tables WHERE schema_id=SCHEMA_ID('dbo') AND name IN('tmCNTTChungChi','tmCNTTChungChi_SV','tmCNTTChungChi_File') ORDER BY name")).first;
 const backup={createdAt:new Date().toISOString(),database:'Studentpage',schema:'dbo',data,columns:metadata,objects};
 await mkdir('.data/backups',{recursive:true});
 const backupPath='.data/backups/it-before-shared-schema-'+new Date().toISOString().replaceAll(':','-')+'.json';
 await writeFile(backupPath,JSON.stringify(backup,null,2)+'\n',{flag:'wx'});
 assert.equal(hash(JSON.parse(await readFile(backupPath,'utf8'))),hash(backup));
 await q(await readFile('docs/sql/it-certifications.sql','utf8'));
 assert.equal(hash(await snapshot('certification',it)),hash(data));
 assert.deepEqual(await columns('certification'),metadata);
 assert.equal(hash(await snapshot('certification',language)),hash(foreign));
 assert.deepEqual((await q("SELECT name,object_id FROM sys.tables WHERE schema_id=SCHEMA_ID('certification') AND name IN('tmCNTTChungChi','tmCNTTChungChi_SV','tmCNTTChungChi_File') ORDER BY name")).first,objects);
 assert.equal((await q("SELECT COUNT(*) AS n FROM sys.tables WHERE schema_id=SCHEMA_ID('dbo') AND name IN('tmCNTTChungChi','tmCNTTChungChi_SV','tmCNTTChungChi_File')")).first[0].n,0);
 const relationships=(await q(`SELECT f.name,OBJECT_NAME(f.parent_object_id) AS child,OBJECT_NAME(f.referenced_object_id) AS parent,
   f.is_disabled,f.is_not_trusted FROM sys.foreign_keys f WHERE f.name IN('FK_CNTTStudent_Catalog','FK_CNTTFile_Student')
   AND f.schema_id=SCHEMA_ID('certification') ORDER BY f.name`)).first;
 assert.equal(relationships.length,2);assert.ok(relationships.every(f=>!f.is_disabled&&!f.is_not_trusted));
 await q('COMMIT TRANSACTION;');active=false;
 console.log(JSON.stringify({backupPath,sharedSchema:'certification',catalogRows:data.tmCNTTChungChi.length,
  studentRows:data.tmCNTTChungChi_SV.length,fileRows:data.tmCNTTChungChi_File.length,
  relationships,dataPreserved:true,columnsPreserved:true,foreignLanguageUnchanged:true}));
}catch(error){if(active)await q('IF XACT_STATE()<>0 ROLLBACK TRANSACTION;').catch(()=>{});throw error;}
finally{await connection.promises.close();}
