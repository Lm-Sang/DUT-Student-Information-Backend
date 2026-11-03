// Schema metadata only. Never synchronizes or writes SQL; generated mappings retain DB names.
import {mkdir,writeFile} from 'node:fs/promises';
import {queryLocalDatabase as query,disconnectLocalDatabase} from '../src/infrastructure/database/local-sql-server.js';
import {assertLocalDemoTarget} from '../src/infrastructure/database/local-write-guard.js';

assertLocalDemoTarget();
const owners={auth:'auth',svc_demo:'student-requests',academic_leave:'academic-leave',certification:'certifications'};
try {
 const columns=(await query(`SELECT s.name AS [schema],t.name AS [table],c.name AS [column],ty.name AS type,c.max_length AS length,c.precision,c.scale,c.is_nullable AS nullable,c.is_identity AS [identity],c.is_computed AS computed,cc.definition AS expression,dc.definition AS [default],
 CAST(CASE WHEN EXISTS(SELECT 1 FROM sys.indexes i JOIN sys.index_columns ic ON ic.object_id=i.object_id AND ic.index_id=i.index_id WHERE i.object_id=t.object_id AND i.is_primary_key=1 AND ic.column_id=c.column_id) THEN 1 ELSE 0 END AS bit) AS [primary]
 FROM sys.objects t JOIN sys.schemas s ON s.schema_id=t.schema_id JOIN sys.columns c ON c.object_id=t.object_id JOIN sys.types ty ON ty.user_type_id=c.user_type_id
 LEFT JOIN sys.computed_columns cc ON cc.object_id=c.object_id AND cc.column_id=c.column_id LEFT JOIN sys.default_constraints dc ON dc.object_id=c.default_object_id
 WHERE t.type IN('U','V') AND s.name IN('auth','svc_demo','academic_leave','certification') ORDER BY s.name,t.name,c.column_id`)).first;
 const fks=(await query(`SELECT s.name AS [schema],t.name AS [table],fk.name,c.name AS [column],rs.name AS targetSchema,rt.name AS targetTable,rc.name AS targetColumn
 FROM sys.foreign_keys fk JOIN sys.foreign_key_columns f ON f.constraint_object_id=fk.object_id JOIN sys.tables t ON t.object_id=f.parent_object_id JOIN sys.schemas s ON s.schema_id=t.schema_id
 JOIN sys.columns c ON c.object_id=t.object_id AND c.column_id=f.parent_column_id JOIN sys.tables rt ON rt.object_id=f.referenced_object_id JOIN sys.schemas rs ON rs.schema_id=rt.schema_id JOIN sys.columns rc ON rc.object_id=rt.object_id AND rc.column_id=f.referenced_column_id
 WHERE s.name IN('auth','svc_demo','academic_leave','certification') ORDER BY fk.name,f.constraint_column_id`)).first;
 const tables=Map.groupBy(columns,c=>c.schema+'.'+c.table);
 for(const [schema,feature]of Object.entries(owners)) {
  const dir=new URL(`../src/modules/${feature}/entities/`,import.meta.url);await mkdir(dir,{recursive:true});
  const names=[];
  for(const [table,cols]of tables){
   if(cols[0].schema!==schema)continue;
   const name=schema+'_'+cols[0].table;names.push(name);
   const definition={name,tableName:cols[0].table,schema,synchronize:false,columns:{}};
   if(!cols.some(c=>c.primary))definition.type='view'; // No invented primary keys on legacy tables.
   for(const c of cols){
    const column={name:c.column,type:c.type,nullable:Boolean(c.nullable)};
    if(c.primary)column.primary=true;
    if(c.identity)column.generated='increment';
    if(['varchar','nvarchar','char','nchar','varbinary','binary'].includes(c.type))column.length=c.length===-1?'MAX':c.length/(['nvarchar','nchar'].includes(c.type)?2:1);
    if(['numeric','decimal'].includes(c.type)){column.precision=c.precision;column.scale=c.scale;}
    if(['datetime2','datetimeoffset','time'].includes(c.type))column.precision=c.scale;
    if(c.computed||['timestamp','rowversion'].includes(c.type)){column.insert=false;column.update=false;}
    definition.columns[c.column]=column;
   }
   const foreignKeys=Map.groupBy(fks.filter(f=>f.schema+'.'+f.table===table),f=>f.name);
   for(const [fk,parts]of foreignKeys){
    const first=parts[0],target=first.targetSchema+'.'+first.targetTable;
    if(!tables.has(target))continue;
    definition.relations??={};definition.relations[fk]={type:'many-to-one',target:first.targetSchema+'_'+first.targetTable,
     joinColumn:parts.map(p=>({name:p.column,referencedColumnName:p.targetColumn})),createForeignKeyConstraints:false};
   }
   await writeFile(new URL(`${cols[0].table}.entity.js`,dir),`import {EntitySchema} from 'typeorm';\n\n// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.\nexport const ${name}=new EntitySchema(${JSON.stringify(definition,null,2)});\n`);
  }
  await writeFile(new URL('index.js',dir),names.map(n=>`import {${n}} from './${n.slice(schema.length+1)}.entity.js';`).join('\n')+`\nexport const ${schema.replace('_','')}Entities=[${names.join(',')}];\n`);
 }
 console.log(JSON.stringify({tables:tables.size,columns:columns.length,foreignKeys:fks.length}));
} finally{await disconnectLocalDatabase();}
