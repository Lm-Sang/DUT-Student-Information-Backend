import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {env} from '../src/config/env.js';
import {localConnectionString} from '../src/infrastructure/database/local-sql-server.js';
const {default:native}=await import('msnodesqlv8');
assert.equal(env.localDatabase.name,'Studentpage');
assert.ok(['localhost','127.0.0.1','::1'].includes(env.localDatabase.host));
const connection=await native.promises.open(localConnectionString(env.localDatabase));
const query=(sql,params=[])=>connection.promises.query(sql,params,{timeoutMs:30000});
const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const catalogTables=['Languages','CertificateTypes','CertificateLevels','RecognitionPolicies'];
const oldTables=['Applications','Submissions','EvidenceFiles','Reviews'];
const snapshot=async tables=>{
 const result={};for(const table of tables)result[table]=(await query('SELECT * FROM certification.['+table+'] WITH(TABLOCKX,HOLDLOCK) ORDER BY Id')).first;
 return result;
};
let active=false;
try {
 if((await query("SELECT OBJECT_ID('certification.StudentCertificates') AS id")).first[0].id){console.log('Already migrated; no changes.');}
 else {
  await query('SET XACT_ABORT ON; BEGIN TRANSACTION;');active=true;
  const catalog=await snapshot(catalogTables),old=await snapshot(oldTables);
  const itBefore={};
  for(const table of ['tmCNTTChungChi','tmCNTTChungChi_SV','tmCNTTChungChi_File'])
    itBefore[table]=(await query('SELECT * FROM dbo.['+table+'] ORDER BY ID')).first;
  const schema=(await query(`SELECT t.name AS tableName,c.column_id,c.name,ty.name AS type,c.max_length,c.precision,c.scale,
    c.is_nullable,c.is_identity,c.collation_name,dc.name AS defaultName,dc.definition AS defaultDefinition
    FROM sys.tables t JOIN sys.columns c ON c.object_id=t.object_id JOIN sys.types ty ON ty.user_type_id=c.user_type_id
    LEFT JOIN sys.default_constraints dc ON dc.object_id=c.default_object_id
    WHERE SCHEMA_NAME(t.schema_id)='certification' ORDER BY t.name,c.column_id;
    SELECT OBJECT_NAME(parent_object_id) AS parent,name,definition FROM sys.check_constraints WHERE SCHEMA_NAME(schema_id)='certification';
    SELECT OBJECT_NAME(fk.parent_object_id) AS parent,fk.name,OBJECT_NAME(fk.referenced_object_id) AS target,
      COL_NAME(fk.parent_object_id,fkc.parent_column_id) AS parentColumn,COL_NAME(fk.referenced_object_id,fkc.referenced_column_id) AS targetColumn
      FROM sys.foreign_keys fk JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id=fk.object_id WHERE SCHEMA_NAME(fk.schema_id)='certification';
    SELECT name,definition FROM sys.sql_modules m JOIN sys.objects o ON o.object_id=m.object_id WHERE SCHEMA_NAME(o.schema_id)='certification';
    SELECT OBJECT_NAME(i.object_id) AS tableName,i.name,i.is_primary_key,i.is_unique,i.type_desc,ic.key_ordinal,
      c.name AS columnName,ic.is_descending_key,i.filter_definition FROM sys.indexes i JOIN sys.index_columns ic
      ON ic.object_id=i.object_id AND ic.index_id=i.index_id JOIN sys.columns c ON c.object_id=ic.object_id AND c.column_id=ic.column_id
      WHERE OBJECT_SCHEMA_NAME(i.object_id)='certification' ORDER BY tableName,i.name,ic.key_ordinal;`)).results;
  const backup={createdAt:new Date().toISOString(),database:'Studentpage',catalog,workflow:old,schema};
  await mkdir('.data/backups',{recursive:true});
  const backupPath='.data/backups/certifications-before-compact-'+new Date().toISOString().replaceAll(':','-')+'.json';
  await writeFile(backupPath,JSON.stringify(backup,null,2)+'\n',{flag:'wx'});
  assert.equal(digest(JSON.parse(await readFile(backupPath,'utf8'))),digest(backup));
  await query(await readFile('docs/sql/certifications-compact.sql','utf8'));
  const rows=(await query('SELECT * FROM certification.StudentCertificates ORDER BY Id')).first;
  const files=(await query('SELECT * FROM certification.EvidenceFiles ORDER BY Id')).first;
  assert.equal(rows.length,old.Applications.length);
  for(const app of old.Applications){
    const latest=old.Submissions.filter(s=>s.ApplicationId===app.Id).sort((a,b)=>b.Sequence-a.Sequence)[0];
    assert.ok(latest);
    const row=rows.find(r=>r.Id===app.Id);assert.ok(row);
    for(const key of ['ActorReference','ActorSource','StudentCode','CohortYear','CreatedAt'])assert.deepEqual(row[key],app[key],key);
    for(const key of ['CertificateTypeId','FullName','ClassName','ResultJson','CatalogSnapshotJson','IssuedOn','Notes','ExpiresAt'])assert.deepEqual(row[key],latest[key],key);
    assert.equal(row.Status,latest.Status==='submitted'?app.Status:'uploading');
    const review=latest.Status==='submitted'?old.Reviews.find(r=>r.SubmissionId===latest.Id):null;
    assert.equal(row.ReviewerReference,review?.ReviewerReference??null);
    assert.equal(row.ReviewReason,review?.Reason??null);
    assert.deepEqual(row.ReviewedAt,review?.ReviewedAt??null);
    const selected=old.EvidenceFiles.filter(f=>f.SubmissionId===latest.Id);
    assert.equal(files.filter(f=>f.CertificateId===app.Id).length,selected.length);
    for(const oldFile of selected){const file=files.find(f=>f.Id===oldFile.Id);assert.ok(file);
      for(const key of ['ObjectKey','Bucket','Status','InspectionJson','OriginalFileName','DeclaredContentType','DeclaredSizeBytes'])assert.deepEqual(file[key],oldFile[key],key);}
  }
  assert.equal(digest(await snapshot(catalogTables)),digest(catalog));
  for(const table of Object.keys(itBefore))assert.equal(digest((await query('SELECT * FROM dbo.['+table+'] ORDER BY ID')).first),digest(itBefore[table]));
  const tables=(await query("SELECT name FROM sys.tables WHERE SCHEMA_NAME(schema_id)='certification' ORDER BY name")).first.map(t=>t.name);
  assert.deepEqual(tables,['CertificateLevels','CertificateTypes','EvidenceFiles','Languages','RecognitionPolicies','StudentCertificates']);
  await query('COMMIT TRANSACTION;');active=false;
  console.log(JSON.stringify({backupPath,certificates:rows.length,files:files.length,reviewed:rows.filter(r=>r.ReviewedAt).length,
    tables,catalogUnchanged:true,itUnchanged:true}));
 }
} catch(error){if(active)await query('IF XACT_STATE()<>0 ROLLBACK TRANSACTION;').catch(()=>{});throw error;}
finally {await connection.promises.close();}
