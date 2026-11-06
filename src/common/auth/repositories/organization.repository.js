import { queryLocalDatabase, transactionLocalDatabase } from '../../../database.js';
import { assertLocalDemoTarget, localDatabaseGuardSql } from '../../../infrastructure/database/local-write-guard.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { organizationAuthorization } from '../rules/organization.js';

const profileColumns = `LOWER(CONVERT(varchar(36),p.AccountId)) AS accountId,p.StaffAccountId AS staffAccountId,
 p.AccessLevel AS accessLevel,p.FieldCode AS fieldCode,p.Revision AS revision,
 a.IsActive AS active,COALESCE(f.IsActive,1) AS fieldActive`;

export function createOrganizationRepository({ query = queryLocalDatabase,
  transaction = query === queryLocalDatabase ? transactionLocalDatabase : query, guard = assertLocalDemoTarget } = {}) {
  const read = async (sql, params = []) => (await query(sql, params)).first;
  async function authorization(accountId, channel = 'admin') {
    // A local account without an auth profile has no authority.
    const profiles = await read(`IF OBJECT_ID(N'auth.AccountProfiles',N'U') IS NOT NULL
      SELECT ${profileColumns} FROM auth.AccountProfiles p JOIN auth.LocalAccounts a ON a.Id=p.AccountId
      LEFT JOIN auth.Fields f ON f.FieldCode=p.FieldCode WHERE ${channel === 'staff' ? 'p.StaffAccountId' : 'CONVERT(nvarchar(40),p.AccountId)'}=?;`, [accountId]);
    if (!profiles[0]) return null;
    const profile = profiles[0];
    profile.active = Boolean(profile.active); profile.fieldActive = Boolean(profile.fieldActive);
    const [tasks, taskPermissions] = await Promise.all([
      read(`SELECT t.TaskId AS id,t.TaskCode AS code,t.FieldCode AS fieldCode,t.IsActive AS active
        FROM auth.AccountTasks a JOIN auth.Tasks t ON t.TaskId=a.TaskId WHERE a.AccountId=? ORDER BY t.TaskId`, [profile.accountId]),
      read(`SELECT DISTINCT p.TaskId AS taskId,p.PermissionName AS permission FROM auth.TaskPermissions p
        JOIN auth.AccountTasks a ON a.TaskId=p.TaskId WHERE a.AccountId=?`, [profile.accountId]),
    ]);
    return organizationAuthorization(profile, tasks.map(t => ({ ...t, active: Boolean(t.active) })), taskPermissions);
  }
  async function write(sql, params) {
    guard();
    try { return (await transaction(`SET NOCOUNT ON;SET XACT_ABORT ON;${localDatabaseGuardSql}${sql}`, params)).first; }
    catch (error) {
      if (/ORG_FORBIDDEN/.test(error.message)) throw new AppError('Permission denied', 403);
      if (/ORG_STALE/.test(error.message)) throw new AppError('Account changed; reload before saving', 409);
      if (/ORG_FIELD_IN_USE|REFERENCE constraint|FOREIGN KEY|duplicate key|UNIQUE|2601|2627/i.test(error.message)) throw new AppError('Field, username or task conflicts with existing data', 409);
      throw error;
    }
  }
  // Recheck authority under transaction locks. Never trust tags from a request body.
  function actorGuard(targetLevel, fieldCode) {
    return { sql: `DECLARE @actor uniqueidentifier=?,@level varchar(20)=?,@field varchar(10)=?;
      IF NOT EXISTS(SELECT 1 FROM auth.AccountProfiles p WITH(UPDLOCK,HOLDLOCK)
       JOIN auth.LocalAccounts a WITH(UPDLOCK,HOLDLOCK) ON a.Id=p.AccountId
       LEFT JOIN auth.Fields f WITH(UPDLOCK,HOLDLOCK) ON f.FieldCode=p.FieldCode
       WHERE p.AccountId=@actor AND a.IsActive=1 AND p.Revision=? AND
       ((p.AccessLevel='super_admin' AND @level='department_admin') OR
        (p.AccessLevel='department_admin' AND @level='specialist' AND p.FieldCode=@field AND f.IsActive=1)))
       THROW 51903,'ORG_FORBIDDEN',1;`, params: [targetLevel, fieldCode] };
  }
  return {
    authorization,
    async bootstrapSuperAdmin({ id, username, displayName, passwordHash, adoptExisting = false }) {
      return write(`IF EXISTS(SELECT 1 FROM auth.AccountProfiles WITH(UPDLOCK,HOLDLOCK) WHERE AccessLevel='super_admin')
        THROW 51903,'ORG_FORBIDDEN',1;
        DECLARE @existing uniqueidentifier=(SELECT Id FROM auth.LocalAccounts WITH(UPDLOCK,HOLDLOCK) WHERE Username=?);
        IF @existing IS NOT NULL BEGIN
          IF ?=0 OR EXISTS(SELECT 1 FROM auth.AccountProfiles WHERE AccountId=@existing)
            OR NOT EXISTS(SELECT 1 FROM auth.LocalAccounts WHERE Id=@existing AND Channel='admin') THROW 51903,'ORG_FORBIDDEN',1;
          UPDATE auth.LocalAccounts SET Username=?,DisplayName=?,PasswordHash=?,IsActive=1 WHERE Id=@existing;
        END ELSE BEGIN
          SET @existing=?;
          INSERT auth.LocalAccounts(Id,Username,DisplayName,PasswordHash,Channel) VALUES(@existing,?,?,?,'admin');
        END;
        INSERT auth.AccountProfiles(AccountId,AccessLevel) VALUES(@existing,'super_admin');
        INSERT auth.AccountSecurityEvents(ActorId,TargetId,Action) VALUES(@existing,@existing,'BOOTSTRAP_ROOT');
        SELECT LOWER(CONVERT(varchar(36),@existing)) AS accountId;`,
      [username, adoptExisting, username, displayName, passwordHash, id, username, displayName, passwordHash]);
    },
    fields: () => read('SELECT FieldCode AS fieldCode,FieldName AS name,IsActive AS active FROM auth.Fields ORDER BY FieldCode'),
    tasks: () => read(`SELECT t.TaskId AS id,t.TaskCode AS code,t.TaskName AS name,t.FieldCode AS fieldCode,t.IsActive AS active
      FROM auth.Tasks t JOIN auth.Fields f ON f.FieldCode=t.FieldCode WHERE t.IsActive=1 AND f.IsActive=1 ORDER BY t.TaskId`),
    async accounts(level, fieldCode) {
      const accounts = await read(`SELECT ${profileColumns},a.Username AS username,a.DisplayName AS displayName
        FROM auth.AccountProfiles p JOIN auth.LocalAccounts a ON a.Id=p.AccountId
        LEFT JOIN auth.Fields f ON f.FieldCode=p.FieldCode
        WHERE p.AccessLevel=? AND (? IS NULL OR p.FieldCode=?) ORDER BY a.Username`, [level, fieldCode, fieldCode]);
      const assignments = await read(`SELECT LOWER(CONVERT(varchar(36),x.AccountId)) AS accountId,x.TaskId AS taskId
        FROM auth.AccountTasks x JOIN auth.AccountProfiles p ON p.AccountId=x.AccountId
        WHERE p.AccessLevel=? AND (? IS NULL OR p.FieldCode=?)`, [level, fieldCode, fieldCode]);
      return accounts.map(a => ({ ...a, active: Boolean(a.active), fieldActive: Boolean(a.fieldActive), taskIds: assignments.filter(t => t.accountId === a.accountId).map(t => t.taskId).sort((x, y) => x - y) }));
    },
    async saveField(actor, code, name, active, remove = false) {
      return write(`IF NOT EXISTS(SELECT 1 FROM auth.AccountProfiles p WITH(UPDLOCK,HOLDLOCK)
        JOIN auth.LocalAccounts a WITH(UPDLOCK,HOLDLOCK) ON a.Id=p.AccountId
        WHERE a.Id=? AND a.IsActive=1 AND p.AccessLevel='super_admin' AND p.Revision=?) THROW 51903,'ORG_FORBIDDEN',1;
        ${remove ? 'DELETE auth.Fields WHERE FieldCode=?;' : `IF EXISTS(SELECT 1 FROM auth.Fields WITH(UPDLOCK,HOLDLOCK) WHERE FieldCode=?)
          UPDATE auth.Fields SET FieldName=?,IsActive=? WHERE FieldCode=?;
          ELSE INSERT auth.Fields(FieldCode,FieldName,IsActive) VALUES(?,?,?);`}`,
      [actor.accountId, actor.revision, ...(remove ? [code] : [code, name, active, code, code, name, active])]);
    },
    async saveAccount(actor, id, staffId, data, passwordHash, editing) {
      const guard = actorGuard(data.accessLevel, data.fieldCode);
      let sql = guard.sql + `IF NOT EXISTS(SELECT 1 FROM auth.Fields WITH(UPDLOCK,HOLDLOCK) WHERE FieldCode=@field AND IsActive=1) THROW 51903,'ORG_FORBIDDEN',1;
        DECLARE @id uniqueidentifier=?,@staff nvarchar(40)=?;`;
      const params = [actor.accountId, ...guard.params, actor.revision, id, staffId];
      if (editing) {
        sql += `IF NOT EXISTS(SELECT 1 FROM auth.AccountProfiles WITH(UPDLOCK,HOLDLOCK) WHERE AccountId=@id
          AND AccessLevel=@level AND FieldCode=@field AND Revision=?) THROW 51909,'ORG_STALE',1;
          UPDATE auth.AccountProfiles SET Revision=Revision+1 WHERE AccountId=@id;
          UPDATE auth.LocalAccounts SET DisplayName=?,IsActive=? WHERE Id=@id;
          UPDATE svc_demo.TaiKhoan SET Hoten=?,HieuLuc=?,PhienBanQuyen=PhienBanQuyen+1 WHERE MaHS=@staff;
          DELETE auth.AccountTasks WHERE AccountId=@id;`;
        params.push(data.revision, data.displayName, data.active, data.displayName, data.active);
        if (passwordHash !== undefined) {
          sql += `UPDATE auth.LocalAccounts SET PasswordHash=? WHERE Id=@id;
            INSERT auth.AccountSecurityEvents(ActorId,TargetId,Action) VALUES(@actor,@id,'RESET_PASSWORD');`;
          params.push(passwordHash);
        }
      } else {
        sql += `INSERT auth.LocalAccounts(Id,Username,DisplayName,PasswordHash,Channel,IsActive) VALUES(@id,?,?,?,'admin',?);
          INSERT svc_demo.TaiKhoan(MaHS,Hoten,VaiTro,MaDV,NguonDanhTinh,HieuLuc) VALUES(@staff,?,'STAFF',CASE @field WHEN 'DT' THEN '115' WHEN 'SV' THEN '120' ELSE @field END,'LOCAL',?);
          INSERT auth.AccountProfiles(AccountId,StaffAccountId,AccessLevel,FieldCode) VALUES(@id,@staff,@level,@field);`;
        params.push(data.username, data.displayName, passwordHash, data.active, data.displayName, data.active);
      }
      for (const taskId of data.taskIds) {
        sql += `IF NOT EXISTS(SELECT 1 FROM auth.Tasks WITH(UPDLOCK,HOLDLOCK) WHERE TaskId=? AND FieldCode=@field AND IsActive=1) THROW 51903,'ORG_FORBIDDEN',1;
          INSERT auth.AccountTasks(AccountId,TaskId,FieldCode) VALUES(@id,?,@field);`;
        params.push(taskId, taskId);
      }
      sql += `INSERT auth.AccountSecurityEvents(ActorId,TargetId,Action) VALUES(@actor,@id,'${editing?'UPDATE_ACCOUNT':'CREATE_ACCOUNT'}');`;
      return write(sql, params);
    },

  };
}

export const organizationRepository = createOrganizationRepository();
