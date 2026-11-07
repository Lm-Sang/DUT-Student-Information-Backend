import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {localEntities,schoolEntities,localDataSource} from '../../src/database.js';
import {javascriptFiles,projectRoot} from '../../scripts/lib/files.js';
test('all mapped local tables and views preserve SQL names without connecting or synchronizing',()=>{
 assert.equal(localDataSource.isInitialized,false);assert.equal(localEntities.length,60);assert.equal(schoolEntities.length,23);
 for(const name of ['PermissionDefinitions','RoleDefinitions','vAssignedPermissions','vEffectivePermissions'])assert(localEntities.some(entity=>entity.options.schema==='auth'&&entity.options.tableName===name),name+' must be mapped');
 for(const entity of [...localEntities,...schoolEntities]){
  assert.equal(entity.options.synchronize,false);assert(entity.options.tableName);assert(entity.options.schema);
  for(const[name,column]of Object.entries(entity.options.columns))assert.equal(column.name,name);
 }
 assert.equal(localDataSource.getRepository('svc_demo_DonDeNghi').metadata.tableName,'DonDeNghi');
 assert(localDataSource.getRepository('svc_demo_His_InDon').metadata.relations.some(relation=>relation.inverseEntityMetadata.name==='svc_demo_DonDeNghi'));
 for(const entity of schoolEntities)for(const[name,column]of Object.entries(entity.options.columns))if(/^(matkhau|password|passwordhash)$/i.test(name))assert.equal(column.select,false);
});
test('features and maintenance scripts never open native SQL connections outside TypeORM infrastructure',()=>{
 const violations=[];
 for(const folder of ['src/student','src/admin','src/common','src/public','scripts'])for(const file of javascriptFiles(join(projectRoot,folder))){
  if(file.includes('__tests__'))continue;
  const text=readFileSync(file,'utf8');if(/(?:from\s*|import\s*\(|require\s*\()\s*['"](?:mssql|msnodesqlv8)(?:\/[^'"]*)?['"]/.test(text))violations.push(file);
 }
 assert.deepEqual(violations,[]);
});
