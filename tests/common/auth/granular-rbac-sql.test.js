import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {createOrganizationRepository} from '../../../src/common/auth/repositories/organization.repository.js';
import {createOrganizationService} from '../../../src/admin/modules/organization/services/organization.service.js';
import {queryLocalDatabase as query,transactionLocalDatabase as transaction,disconnectLocalDatabase} from '../../../src/infrastructure/database/local-sql-server.js';
import {localDatabaseGuardSql,assertLocalDemoTarget} from '../../../src/infrastructure/database/local-write-guard.js';
import {hashPassword} from '../../../src/common/auth/services/password.service.js';
import {createAuthService} from '../../../src/common/auth/services/auth.service.js';
import {createAuthRepository} from '../../../src/common/auth/repositories/auth.repository.js';
import {createAuthStore} from '../../../src/common/auth/stores/auth.store.js';
import {createLocalPermissionContext} from '../../../src/common/auth/middlewares/auth.middleware.js';
test('granular SQL grants isolate every form, roles revoke sessions, and managers remain within their department', {skip:process.env.GRANULAR_RBAC_DB_TEST!=='1',timeout:60000},async()=>{
 assertLocalDemoTarget();const repo=createOrganizationRepository(),service=createOrganizationService(repo),ids=[],roleIds=[];const suffix=randomUUID(),password='Fixture!'+randomUUID();
 const store=createAuthStore(),auth=createAuthService({repository:createAuthRepository(),store,config:{nodeEnv:'test',jwt:{secret:'granular-fixture-key-at-least-32-bytes',issuer:'fixture',adminAudience:'admin',staffAudience:'staff',expiresIn:'15m'},auth:{refreshTtlSeconds:600},microsoftSso:{}}});
 try{
  const rootId=randomUUID();ids.push(rootId);await transaction(`${localDatabaseGuardSql}INSERT auth.LocalAccounts(Id,Username,DisplayName,PasswordHash,Channel)VALUES(?,?,N'Granular fixture root',?,'admin');INSERT auth.AccountProfiles(AccountId,AccessLevel)VALUES(?,'super_admin');`,[rootId,'grb-root-'+suffix,await hashPassword(password),rootId]);
  const root={authorizationStatus:'active',organization:await repo.authorization(rootId)};
  async function create(actor,name,level,field,permissions=[],roleIds=[]){const data=await service.saveAccount(actor,null,{username:'grb-'+name+'-'+suffix,displayName:'Granular fixture '+name,password,accessLevel:level,fieldCode:field,permissions,roleIds,active:true});ids.push(data.accountId);return data;}
  const manager=await create(root,'manager','department_admin','DT'),managerActor={authorizationStatus:'active',organization:await repo.authorization(manager.accountId)};
  const catalog=await service.catalog(root),paper=catalog.permissions.filter(p=>p.key.startsWith('work:DonSV'));
  const cert=catalog.permissions.filter(p=>p.key.startsWith('work:certifications:'));
  assert(paper.length>=6&&cert.length>=2);assert(catalog.permissions.some(p=>p.key==='work:academic-leave:leave'));assert(catalog.permissions.some(p=>p.key==='work:academic-leave:return'));
  let role=await service.saveRole(root,null,{name:'Fixture selective role',description:'One paper and one certificate',fieldCode:'DT',active:true,permissions:[paper[0].key,cert[0].key,'work:academic-leave:leave']});roleIds.push(role.id);
  let specialist=await create(managerActor,'one-form','specialist','DT',[],[role.id]);
  const authorization=await repo.authorization(specialist.accountId);assert(authorization.permissions.includes(paper[0].key));assert(!authorization.permissions.includes(paper[1].key));assert(authorization.permissions.includes(cert[0].key));assert(!authorization.permissions.includes(cert[1].key));assert(!authorization.permissions.includes('work:academic-leave:return'));assert.deepEqual(authorization.taskIds,[1,3,4]);
  const tokens=await Promise.all(['admin','staff'].map(channel=>auth.loginWithPassword(channel,{username:specialist.username,password})));
  role=await service.saveRole(root,role.id,{name:role.name,description:role.description,fieldCode:'DT',active:false,permissions:role.permissions,revision:role.revision});
  for(const token of tokens)await assert.rejects(()=>auth.verifyToken(token.data.accessToken,token.data.channel),e=>e.statusCode===401);
  assert.deepEqual((await repo.authorization(specialist.accountId)).permissions,[]);
  await assert.rejects(()=>create(managerActor,'foreign','specialist','KT'),e=>e.statusCode===403);
  await assert.rejects(()=>service.saveRole(managerActor,null,{name:'Privilege escalation',fieldCode:'DT',active:true,permissions:[]}),e=>e.statusCode===403);
  await assert.rejects(()=>create(root,'wrong-tag','specialist','KT',[paper[0].key]),e=>e.statusCode===403);
  specialist=await service.saveAccount(managerActor,specialist.accountId,{displayName:specialist.displayName,accessLevel:'specialist',fieldCode:'DT',active:true,permissions:['work:academic-leave:return'],roleIds:[],revision:specialist.revision+1});
  const session=await auth.loginWithPassword('admin',{username:specialist.username,password});const context=await createLocalPermissionContext('academic-leave:review',auth,3)({method:'POST',headers:{authorization:'Bearer '+session.data.accessToken}});
  assert(context.scopePermissions.includes('work:academic-leave:return'));assert(!context.scopePermissions.includes('work:academic-leave:leave'));
  // Root can explicitly change a subordinate's system level and field, revoking old grants.
  const changed=await service.saveAccount(root,specialist.accountId,{displayName:'Moved fixture',accessLevel:'department_admin',fieldCode:'KT',active:true,permissions:[],roleIds:[],revision:specialist.revision});
  assert.equal(changed.fieldCode,'KT');assert.equal(changed.accessLevel,'department_admin');assert.deepEqual(changed.effectivePermissions,[]);
  await assert.rejects(()=>auth.verifyToken(session.data.accessToken,'admin'),e=>e.statusCode===401);
 }finally{
  try{if(ids.length){const marks=ids.map(()=>'?').join(',');await transaction(`${localDatabaseGuardSql}DECLARE @ids TABLE(Id uniqueidentifier,StaffId nvarchar(40));INSERT @ids SELECT AccountId,StaffAccountId FROM auth.AccountProfiles WHERE AccountId IN(${marks});DELETE auth.AccountSecurityEvents WHERE ActorId IN(SELECT Id FROM @ids) OR TargetId IN(SELECT Id FROM @ids);DELETE auth.AccountPermissions WHERE AccountId IN(SELECT Id FROM @ids);DELETE auth.AccountRoles WHERE AccountId IN(SELECT Id FROM @ids);DELETE auth.AccountTasks WHERE AccountId IN(SELECT Id FROM @ids);DELETE auth.AccountProfiles WHERE AccountId IN(SELECT Id FROM @ids);DELETE svc_demo.TaiKhoan WHERE MaHS IN(SELECT StaffId FROM @ids);DELETE auth.LocalAccounts WHERE Id IN(SELECT Id FROM @ids);`,ids);}for(const role of roleIds)await transaction(`${localDatabaseGuardSql}DELETE auth.RolePermissions WHERE RoleName=?;DELETE auth.RoleDefinitions WHERE RoleName=?;DELETE auth.Roles WHERE RoleName=?;`,[role,role,role]);}
  finally{store.close();await disconnectLocalDatabase();}
 }
});
