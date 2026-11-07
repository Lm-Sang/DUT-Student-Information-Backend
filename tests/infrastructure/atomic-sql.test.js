import {test} from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
import {withLocalTransaction,queryLocalDatabase as q,transactionLocalDatabase as t,disconnectLocalDatabase} from '../../src/infrastructure/database/local-sql-server.js';
test('local TypeORM unit shares a runner across repository calls and rolls back nested mutations',{skip:process.env.GRANULAR_RBAC_DB_TEST!=='1'},async()=>{
 const id=randomUUID();try{
 await assert.rejects(()=>withLocalTransaction(async()=>{await t("INSERT auth.LocalAccounts(Id,Username,DisplayName,PasswordHash,Channel)VALUES(?,?,N'Fixture',N'fixture-only','admin')",[id,'atomic-'+id]);assert.equal((await q('SELECT DisplayName name FROM auth.LocalAccounts WHERE Id=?',[id])).first[0].name,'Fixture');await t("UPDATE auth.LocalAccounts SET DisplayName=N'Changed' WHERE Id=?",[id]);throw Error('Rollback batch');}),/Rollback batch/);
 assert.equal((await q('SELECT COUNT(*) n FROM auth.LocalAccounts WHERE Id=?',[id])).first[0].n,0);
 }finally{await t('DELETE auth.LocalAccounts WHERE Id=?',[id]);await disconnectLocalDatabase();}
});
