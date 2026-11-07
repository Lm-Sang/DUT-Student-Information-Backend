import { readFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { transactionLocalDatabase, disconnectLocalDatabase } from '../../src/infrastructure/database/local-sql-server.js';
import { assertLocalDemoTarget, localDatabaseGuardSql } from '../../src/infrastructure/database/local-write-guard.js';
import { organizationPermissionsViewSql } from '../../src/common/student-requests/repositories/rbac-views.js';

try {
  const { positionals, values } = parseArgs({ allowPositionals: true, options: {
    username: { type: 'string' }, level: { type: 'string' }, field: { type: 'string' },
    tasks: { type: 'string', default: '' }, staff: { type: 'string' },
  } });
  assertLocalDemoTarget();
  if (positionals.length !== 1 || !['init', 'tag'].includes(positionals[0])) throw new Error('Usage: organization-db.mjs init | tag --username NAME --level super_admin|department_admin|specialist [--field DT] [--tasks 1,2] [--staff STAFF_ID]');
  if (positionals[0] === 'init') {
    const sql = await readFile(new URL('../database/sql/auth-organization-schema.sql', import.meta.url), 'utf8');
    await transactionLocalDatabase(localDatabaseGuardSql+sql);
    const {upgradeGranularRbac}=await import('./granular-rbac-db.mjs');
    await upgradeGranularRbac();
    console.log('Local auth organization schema and request permission view are ready. No account roles were changed.');
  } else {
    const taskIds = values.tasks ? values.tasks.split(',').map(Number) : [];
    if (!values.username || !['super_admin', 'department_admin', 'specialist'].includes(values.level)
      || values.level === 'super_admin' && values.field !== undefined
      || values.level !== 'super_admin' && !/^[A-Z]{2,10}$/.test(values.field ?? '')
      || taskIds.some(t => !Number.isSafeInteger(t) || t < 1) || new Set(taskIds).size !== taskIds.length || taskIds.length > 100
      || values.level !== 'specialist' && taskIds.length) throw new Error('Invalid role, department or numeric task tags.');
    let sql = `DECLARE @id uniqueidentifier=(SELECT Id FROM auth.LocalAccounts WITH(UPDLOCK,HOLDLOCK) WHERE Username=? AND Channel='admin'),
      @level varchar(20)=?,@field varchar(10)=?,@staff nvarchar(40)=?;
      IF @id IS NULL THROW 51904,'Admin account not found',1;
      IF @staff IS NOT NULL AND NOT EXISTS(SELECT 1 FROM svc_demo.TaiKhoan a
        WHERE a.MaHS=@staff AND a.NguonDanhTinh='LOCAL' AND a.VaiTro='STAFF'
        AND a.MaDV=CASE @field WHEN 'DT' THEN '115' WHEN 'SV' THEN '120' ELSE @field END) THROW 51904,'Matching local staff account not found',1;
      INSERT auth.AccountProfiles(AccountId,StaffAccountId,AccessLevel,FieldCode) VALUES(@id,@staff,@level,@field);
      UPDATE auth.LocalAccounts SET DisplayName=DisplayName WHERE Id=@id;`;
    const params = [values.username, values.level, values.field ?? null, values.staff ?? null];
    for (const taskId of taskIds) {
      sql += `IF NOT EXISTS(SELECT 1 FROM auth.Tasks WHERE TaskId=? AND FieldCode=@field AND IsActive=1) THROW 51904,'Task outside department',1;
        INSERT auth.AccountTasks(AccountId,TaskId,FieldCode) VALUES(@id,?,@field);`;
      params.push(taskId, taskId);
    }
    await transactionLocalDatabase(`SET XACT_ABORT ON;${localDatabaseGuardSql}${sql}`, params);
    console.log('Account tagged. Existing sessions will require a fresh login.');
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { await disconnectLocalDatabase(); }
