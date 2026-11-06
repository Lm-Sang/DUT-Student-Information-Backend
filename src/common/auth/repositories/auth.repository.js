import { queryLocalDatabase, transactionLocalDatabase } from '../../../database.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { createHash } from 'node:crypto';
import { createOrganizationRepository } from './organization.repository.js';
import { assertLocalDemoTarget, localDatabaseGuardSql } from '../../../infrastructure/database/local-write-guard.js';
import { selectEntity, selectOne } from '../../../infrastructure/database/typeorm-repository.js';

const columns = `LOWER(CONVERT(varchar(36), a.Id)) AS id,a.Username AS username,
 a.DisplayName AS displayName,a.PasswordHash AS passwordHash,a.Channel AS storedChannel,
 a.IsActive AS isActive,CONVERT(varchar(18),CAST(a.[Version] AS binary(8)),1) AS accountVersion`;
const version = account => createHash('sha256').update(JSON.stringify([
  account.accountVersion,account.passwordHash,account.channel,account.isActive,account.organization,
])).digest('hex');

export function createAuthRepository({query=queryLocalDatabase,
  transaction=query===queryLocalDatabase?transactionLocalDatabase:query,guard=assertLocalDemoTarget}={}) {
  const organization=createOrganizationRepository({query,transaction,guard});
  async function find(column,value,channel='admin') {
    if(column==='Id'&&(typeof value!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value)))return null;
    try {
      const row=await selectOne(selectEntity('auth.LocalAccounts','a').select(columns)
        .where(`a.${column}=:value`,{value}).andWhere("a.Channel='admin'"),query);
      if(!row)return null;
      const profile=await organization.authorization(row.id);
      if(!profile)return null;
      // The staff endpoint is a compatibility channel for canonical auth specialists.
      // It never reads demo credentials, role tables or grants.
      if(channel==='staff'&&(profile.accessLevel!=='specialist'||!profile.staffAccountId))return null;
      const account={...row,channel,organization:profile,roles:[profile.accessLevel],permissions:profile.permissions,
        requestActorId:profile.staffAccountId??null,
        isActive:Boolean(row.isActive)&&profile.active&&(profile.accessLevel==='super_admin'||profile.fieldActive)};
      if(!account.displayName?.trim())throw new Error('Invalid local account');
      return {...account,version:version(account)};
    } catch {throw new AppError('Local auth account/profile database is not ready',503);}
  }
  return Object.freeze({
    findLocalByUsername:username=>find('Username',username),
    findLocalById:id=>find('Id',id),
    findStaffByUsername:username=>find('Username',username,'staff'),
    findStaffById:id=>find('Id',id,'staff'),
    async updateStaffPassword({actor,account,passwordHash,reset=false}) {
      guard();
      try {
        await transaction(`SET NOCOUNT ON;SET XACT_ABORT ON;${localDatabaseGuardSql}
          DECLARE @actor uniqueidentifier=?,@target uniqueidentifier=?;
          IF NOT EXISTS(SELECT 1 FROM auth.LocalAccounts a WITH(UPDLOCK,HOLDLOCK)
            JOIN auth.AccountProfiles p WITH(UPDLOCK,HOLDLOCK) ON p.AccountId=a.Id
            LEFT JOIN auth.Fields f WITH(UPDLOCK,HOLDLOCK) ON f.FieldCode=p.FieldCode
            WHERE a.Id=@actor AND a.IsActive=1 AND a.[Version]=CONVERT(binary(8),?,1) AND a.PasswordHash=?
              AND p.Revision=? AND (p.AccessLevel='super_admin' OR f.IsActive=1)) THROW 51201,'PASSWORD_ACTOR_STALE',1;
          ${reset?`IF @actor=@target OR NOT EXISTS(SELECT 1 FROM auth.AccountProfiles p WITH(UPDLOCK,HOLDLOCK)
            JOIN auth.AccountProfiles target WITH(UPDLOCK,HOLDLOCK) ON target.AccountId=@target
            JOIN auth.Fields f WITH(UPDLOCK,HOLDLOCK) ON f.FieldCode=target.FieldCode AND f.IsActive=1
            WHERE p.AccountId=@actor AND ((p.AccessLevel='super_admin' AND target.AccessLevel='department_admin')
              OR(p.AccessLevel='department_admin' AND target.AccessLevel='specialist' AND p.FieldCode=target.FieldCode)))
            THROW 51202,'PASSWORD_FORBIDDEN',1;`:'IF @actor<>@target THROW 51202,\'PASSWORD_FORBIDDEN\',1;'}
          UPDATE auth.LocalAccounts SET PasswordHash=? WHERE Id=@target AND PasswordHash=? AND IsActive=1;
          IF @@ROWCOUNT<>1 THROW 51203,'PASSWORD_TARGET_STALE',1;
          UPDATE auth.AccountProfiles SET Revision=Revision+1 WHERE AccountId=@target;
          INSERT auth.AccountSecurityEvents(ActorId,TargetId,Action) VALUES(@actor,@target,?);`,
          [actor.id,account.id,actor.accountVersion,actor.passwordHash,actor.organization.revision,passwordHash,account.passwordHash,
            reset?'RESET_PASSWORD':'CHANGE_PASSWORD']);
      } catch(error) {
        if(/PASSWORD_FORBIDDEN/.test(error.message))throw new AppError('Permission denied',403);
        if(/PASSWORD_ACTOR_STALE/.test(error.message))throw new AppError('Account changed; sign in again',401);
        if(/PASSWORD_TARGET_STALE/.test(error.message))throw new AppError('Account changed; reload before saving',409);
        throw new AppError('Unable to update the local auth password',503);
      }
    },
    async createLocalAccount({id,username,displayName,passwordHash,channel,roles=[],permissions=[]}) {
      if(channel!=='admin'||roles.length||permissions.length)throw new AppError('Create accounts through auth organization roles and tasks; arbitrary role/permission grants are disabled',400);
      return organization.bootstrapSuperAdmin({id,username,displayName,passwordHash});
    },
  });
}
export const authRepository=createAuthRepository();
