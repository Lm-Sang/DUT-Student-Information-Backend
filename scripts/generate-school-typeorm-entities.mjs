// SELECT metadata only. No schema synchronization, migrations or writes on school databases.
import {mkdir,writeFile} from 'node:fs/promises';
import {connectDatabase,disconnectDatabases} from '../src/infrastructure/database/sql-server.js';
import {env} from '../src/config/env.js';
const sources=[
 ['secondary','DATA_SV1',['NhanThan','ThongBao','Ma_DanToc','Ma_DiaPhuongC1']],
 ['secondary','DATA_GVien1',['tmHoSoSV','tmLop','tmDiaPhuong','tmConfig','tmNganh','tmKehoach','tmNganhQG','tmHocPhan']],
 ['secondary','tmProxDUT',['tmHoSoSV','tmNganh','tmHocvuTK','tmHocvu','tmDiemkyhoc']],
 ['primary',env.curriculum.primaryDatabase,['tmNganh','DonVi','tmKhungCT','tmHocPhan']],
 ['primary',env.curriculum.requirementsDatabase,['tmHocphanDK','tmHocPhan']],
];
const groups={students:[],announcements:[],curriculum:[]};
try{
 for(const[account,database,tables]of sources){
  const source=await connectDatabase(account,database),request=source.request();
  const names=tables.map((name,i)=>{request.input('table'+i,name);return '@table'+i;});
  const result=await request.query(`SELECT s.name AS [schema],t.name AS [table],c.name AS [column],ty.name AS type,c.max_length AS length,c.precision,c.scale,c.is_nullable AS nullable,
   HAS_PERMS_BY_NAME(QUOTENAME(s.name)+'.'+QUOTENAME(t.name),'OBJECT','SELECT',c.name,'COLUMN') AS selectable,
   CAST(CASE WHEN EXISTS(SELECT 1 FROM sys.indexes i JOIN sys.index_columns ic ON ic.object_id=i.object_id AND ic.index_id=i.index_id WHERE i.object_id=t.object_id AND i.is_primary_key=1 AND ic.column_id=c.column_id) THEN 1 ELSE 0 END AS bit) AS [primary]
   FROM sys.tables t JOIN sys.schemas s ON s.schema_id=t.schema_id JOIN sys.columns c ON c.object_id=t.object_id JOIN sys.types ty ON ty.user_type_id=c.user_type_id
   WHERE s.name='dbo' AND t.name IN(${names.join(',')}) ORDER BY t.name,c.column_id`);
  for(const[table,columns]of Map.groupBy(result.first,c=>c.table)){
   const feature=table==='ThongBao'?'announcements':account==='primary'||['tmNganhQG','tmHocPhan','tmKehoach'].includes(table)?'curriculum':'students';
   const name=database+'_'+table,definition={name,tableName:table,schema:'dbo',database,synchronize:false,columns:{}};
   if(!columns.some(c=>c.primary))definition.type='view';
   for(const c of columns){
    const col={name:c.column,type:c.type,nullable:Boolean(c.nullable),insert:false,update:false};if(c.primary)col.primary=true;
    if(!c.selectable||/^(matkhau|password|passwordhash)$/i.test(c.column))col.select=false;
    if(['varchar','nvarchar','char','nchar','varbinary','binary'].includes(c.type))col.length=c.length===-1?'MAX':c.length/(['nvarchar','nchar'].includes(c.type)?2:1);
    if(['decimal','numeric'].includes(c.type)){col.precision=c.precision;col.scale=c.scale;}
    if(['datetime2','datetimeoffset','time'].includes(c.type))col.precision=c.scale;
    definition.columns[c.column]=col;
   }
   const dir=new URL(`../src/modules/${feature}/entities/`,import.meta.url);await mkdir(dir,{recursive:true});
   await writeFile(new URL(`${name}.entity.js`,dir),`import {EntitySchema} from 'typeorm';\n// School metadata mapping. SELECT only; the DataSource also rejects all writes.\nexport const ${name}=new EntitySchema(${JSON.stringify(definition,null,2)});\n`);
   groups[feature].push(name);
  }
 }
 for(const[feature,names]of Object.entries(groups))await writeFile(new URL(`../src/modules/${feature}/entities/index.js`,import.meta.url),names.map(n=>`import {${n}} from './${n}.entity.js';`).join('\n')+`\nexport const ${feature}Entities=[${names.join(',')}];\n`);
 console.log(JSON.stringify(Object.fromEntries(Object.entries(groups).map(([feature,names])=>[feature,names.length]))));
}finally{await disconnectDatabases();}
