import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {queryLocalDatabase as query,connectDatabase,disconnectAllDatabases} from '../src/infrastructure/database/index.js';
const tables=['tmCNTTChungChi','tmCNTTChungChi_SV'];
const metadataSql=`SELECT t.name AS tableName,c.column_id,c.name,ty.name AS type,c.max_length,c.precision,c.scale,
 c.is_nullable,c.is_identity,c.collation_name,dc.definition AS defaultDefinition,
 CONVERT(int,ic.seed_value) AS seedValue,CONVERT(int,ic.increment_value) AS incrementValue
 FROM sys.tables t JOIN sys.schemas s ON s.schema_id=t.schema_id JOIN sys.columns c ON c.object_id=t.object_id
 JOIN sys.types ty ON ty.user_type_id=c.user_type_id LEFT JOIN sys.default_constraints dc ON dc.object_id=c.default_object_id
 LEFT JOIN sys.identity_columns ic ON ic.object_id=c.object_id AND ic.column_id=c.column_id
 WHERE s.name='dbo' AND t.name IN('tmCNTTChungChi','tmCNTTChungChi_SV') ORDER BY t.name,c.column_id`;
async function foreignDigest(){
 const rows=[];
 for(const table of ['Applications','Submissions','EvidenceFiles','Reviews','Languages','CertificateTypes','CertificateLevels','RecognitionPolicies'])
  rows.push((await query('SELECT * FROM certification.['+table+'] ORDER BY Id')).first);
 return createHash('sha256').update(JSON.stringify(rows)).digest('hex');
}
try {
 const before=await foreignDigest();
 const source=await connectDatabase('primary','tmProxDUT');
 const expected=(await source.request().query(metadataSql)).recordset;
 assert.equal(expected.length,13);
 await query((await readFile('docs/sql/it-certifications.sql','utf8')).replace(/^\uFEFF/,''));
 const actual=(await query(metadataSql)).first;
 assert.deepEqual(actual,expected,'Business columns must match source exactly');
 const catalog=(await source.request().query('SELECT ID,MaCC,TenCC FROM dbo.tmCNTTChungChi ORDER BY ID')).recordset;
 const current=(await query('SELECT COUNT(*) AS rows FROM dbo.tmCNTTChungChi')).first[0].rows;
 if(current===0)await query(`SET XACT_ABORT ON;BEGIN TRY BEGIN TRANSACTION;
   SET IDENTITY_INSERT dbo.tmCNTTChungChi ON;
   INSERT dbo.tmCNTTChungChi(ID,MaCC,TenCC) SELECT ID,MaCC,TenCC FROM OPENJSON(?) WITH(ID int,MaCC nvarchar(10),TenCC nvarchar(50));
   SET IDENTITY_INSERT dbo.tmCNTTChungChi OFF;COMMIT TRANSACTION;
   END TRY BEGIN CATCH IF XACT_STATE()<>0 ROLLBACK TRANSACTION;THROW;END CATCH;`,[JSON.stringify(catalog)]);
 assert.deepEqual((await query('SELECT ID,MaCC,TenCC FROM dbo.tmCNTTChungChi ORDER BY ID')).first,catalog);
 await query((await readFile('docs/sql/it-certifications-remove-empty-legacy.sql','utf8')).replace(/^\uFEFF/,''));
 assert.equal(await foreignDigest(),before,'Foreign-language data must remain unchanged');
 console.log(JSON.stringify({metadataMatchesSource:true,catalogRows:catalog.length,
   studentRows:(await query('SELECT COUNT(*) AS rows FROM dbo.tmCNTTChungChi_SV')).first[0].rows,
   fileRows:(await query('SELECT COUNT(*) AS rows FROM dbo.tmCNTTChungChi_File')).first[0].rows,
   oldSchemaRemoved:(await query("SELECT SCHEMA_ID('it_certification') AS id")).first[0].id===null,
   foreignLanguageDataUnchanged:true}));
}finally {await disconnectAllDatabases()}
