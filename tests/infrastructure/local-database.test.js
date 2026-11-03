import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createLocalDatabase,localConnectionString} from '../../src/infrastructure/database/local-sql-server.js';
import {createTypeOrmConnection} from '../../src/infrastructure/database/typeorm-connection.js';
import {positionalSql,assertReadOnlySql} from '../../src/infrastructure/database/sql-parameters.js';

const config={host:'localhost',port:1433,name:'sv_dut',driver:'ODBC Driver 17 for SQL Server',encrypt:false,trustServerCertificate:true,queryTimeoutMs:30000};
function fixture({failures=0,gate=Promise.resolve(),multi=false}={}){
 const state={opens:0,closes:0,releases:0,queries:[],commits:0,rollbacks:0,begins:0};
 const createSource=options=>({options,subscribers:[],isInitialized:false,
  async initialize(){state.opens++;await gate;if(failures-->0)throw Error('temporary connection failure');this.isInitialized=true;return this;},
  async destroy(){state.closes++;this.isInitialized=false;},
  createQueryRunner(){const source=this;const runner={isTransactionActive:false,
   startTransaction:async isolation=>{assert.equal(isolation,'READ COMMITTED');state.begins++;runner.isTransactionActive=true;},
   commitTransaction:async()=>{state.commits++;runner.isTransactionActive=false;},
   rollbackTransaction:async()=>{state.rollbacks++;runner.isTransactionActive=false;},
   release:async()=>state.releases++,query:async(statement,parameters)=>{
    for(const sub of source.subscribers)sub.beforeQuery?.({query:statement,queryRunner:runner});
    state.queries.push([statement,parameters]);await Promise.resolve();
    if(statement==='SELECT fail')throw Error('query failed');
    const recordsets=multi?[[{value:parameters[0]}],[{second:1}]]:[[{value:parameters[0]}]];
    for(const sub of source.subscribers)sub.afterQuery?.({rawResults:{recordsets,rowsAffected:[0]},queryRunner:runner});
    return{records:recordsets[0]};}};return runner;
  },
 });return{state,createSource};
}
test('Windows connection escapes ODBC values without requiring a username/password',()=>{
 const text=localConnectionString(config);assert(text.includes('Trusted_Connection=Yes;Encrypt=No;TrustServerCertificate=Yes;'));
 assert(!/\b(?:Uid|Pwd|Password|User)\s*=/i.test(text));
 assert(localConnectionString({...config,name:'db};Pwd=injected'}).includes('Database={db}};Pwd=injected};'));
 for(const change of [{host:''},{name:'db\n'},{port:0}])assert.throws(()=>localConnectionString({...config,...change}));
});
test('TypeORM initialization is lazy/shared and every query releases its QueryRunner',async()=>{
 const f=fixture(),db=createLocalDatabase({config,createSource:f.createSource,driver:{}});
 assert.equal(f.state.opens,0);const opening=db.connect();assert.equal(db.connect(),opening);await opening;
 const marker="Tiếng Việt ' ; --";assert.deepEqual((await db.query('SELECT ? AS value',[marker])).first,[{value:marker}]);
 assert.deepEqual(f.state.queries,[['SELECT @0 AS value',[marker]]]);assert.equal(f.state.releases,1);
 await assert.rejects(()=>db.query('SELECT fail'),/query failed/);assert.equal(f.state.releases,2);
 await db.disconnect();await db.disconnect();assert.equal(f.state.closes,1);await db.connect();assert.equal(f.state.opens,2);await db.disconnect();
});
test('failed initialization is retryable; disconnect waits for an initialization already in flight',async()=>{
 const f=fixture({failures:1}),db=createLocalDatabase({config,createSource:f.createSource,driver:{}});
 await assert.rejects(db.connect(),/temporary/);await db.connect();assert.equal(f.state.opens,2);await db.disconnect();
 let release;const g=fixture({gate:new Promise(resolve=>release=resolve)}),waiting=createLocalDatabase({config,createSource:g.createSource,driver:{}});
 const opening=waiting.connect(),closing=waiting.disconnect();release();await Promise.all([opening,closing]);assert.equal(g.state.closes,1);
});
test('independent sources retain their own settings and concurrent multiple recordsets never mix',async()=>{
 const f=fixture({multi:true}),g=fixture(),a=createLocalDatabase({config,createSource:f.createSource,driver:{}}),b=createLocalDatabase({config:{...config,port:1434,name:'other'},createSource:g.createSource,driver:{}});
 const results=await Promise.all(Array.from({length:8},(_,i)=>a.query('SELECT ? AS value',[i])));
 results.forEach((result,i)=>{assert.equal(result.first[0].value,i);assert.equal(result.recordsets[1][0].second,1);});
 await b.query('SELECT ?',[9]);await a.disconnect();assert.equal(g.state.closes,0);assert.equal(b.source.options.port,1434);await b.disconnect();
});
test('bind lexer ignores quoted/comment markers and accepts TypeORM native parameters',()=>{
 assert.equal(positionalSql("SELECT '?' AS x,? AS v,[?] AS y -- ?\n /* ? */",['safe']),"SELECT '?' AS x,@0 AS v,[?] AS y -- ?\n /* ? */");
 assert.equal(positionalSql("SELECT 'it''s ?' AS x,?",[1]),"SELECT 'it''s ?' AS x,@0");
 assert.equal(positionalSql('SELECT @0',[1]),'SELECT @0');assert.throws(()=>positionalSql('SELECT ?',[]));
});
test('school sources reject writes before connecting and when using a DataSource QueryRunner directly',async()=>{
 const f=fixture(),db=createTypeOrmConnection({options:{type:'mssql'},readOnly:true,createSource:f.createSource});
 for(const sql of ["SELECT 1; DELETE FROM x","SELECT * INTO x FROM y",'EXEC p','/* hi */ UPDATE x SET a=1'])await assert.rejects(()=>db.query(sql),/SELECT-only/);
 assert.equal(f.state.opens,0);assert.doesNotThrow(()=>assertReadOnlySql("SELECT 'UPDATE' AS x -- DELETE\n"));
 const source=await db.connect(),runner=source.createQueryRunner();await assert.rejects(()=>runner.query('DROP TABLE x',[]),/SELECT-only/);assert.equal(f.state.queries.length,0);await runner.release();await db.disconnect();
 assert.equal(source.options.synchronize,false);assert.equal(source.options.migrationsRun,false);assert.equal(source.options.dropSchema,false);
});
test('write transactions commit on success and roll back before releasing a failed QueryRunner',async()=>{
 const f=fixture(),db=createLocalDatabase({config,createSource:f.createSource,driver:{}});
 await db.transaction('SELECT ?',[3]);assert.equal(f.state.begins,1);assert.equal(f.state.commits,1);assert.equal(f.state.rollbacks,0);
 await assert.rejects(()=>db.transaction('SELECT fail'),/query failed/);assert.equal(f.state.rollbacks,1);assert.equal(f.state.releases,2);await db.disconnect();
 const g=fixture(),wrong=createLocalDatabase({config:{...config,host:'school.example'},createSource:g.createSource,driver:{}});
 await assert.rejects(()=>wrong.transaction('SELECT 1'),/loopback/);assert.equal(g.state.begins,0);assert.equal(g.state.queries.length,0);await wrong.disconnect();
});
