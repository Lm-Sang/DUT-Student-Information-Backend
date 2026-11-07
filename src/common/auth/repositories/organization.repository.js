import {queryLocalDatabase,transactionLocalDatabase} from '../../../database.js';
import {assertLocalDemoTarget,localDatabaseGuardSql} from '../../../infrastructure/database/local-write-guard.js';
import {AppError} from '../../../shared/errors/app-error.js';
import {organizationAuthorization} from '../rules/organization.js';
const profileColumns=`LOWER(CONVERT(varchar(36),p.AccountId)) AS accountId,p.StaffAccountId staffAccountId,p.AccessLevel accessLevel,p.FieldCode fieldCode,p.Revision revision,a.IsActive active,COALESCE(f.IsActive,1) fieldActive`;
export function createOrganizationRepository({query=queryLocalDatabase,transaction=query===queryLocalDatabase?transactionLocalDatabase:query,guard=assertLocalDemoTarget}={}){
 const read=async(sql,params=[]) => (await query(sql,params)).first;
 async function write(sql,params=[]){guard();try{return (await transaction(`SET NOCOUNT ON;SET XACT_ABORT ON;${localDatabaseGuardSql}${sql}`,params)).first;}catch(e){if(/ORG_FORBIDDEN/.test(e.message))throw new AppError('Không có quyền trong phòng ban này.',403);if(/ORG_STALE/.test(e.message))throw new AppError('Dữ liệu đã thay đổi. Vui lòng tải lại.',409);if(/ORG_FIELD_IN_USE|REFERENCE constraint|FOREIGN KEY|duplicate key|UNIQUE|2601|2627/i.test(e.message))throw new AppError('Tài khoản, role, phòng hoặc quyền đang được sử dụng / không hợp lệ.',409);throw e;}}
 const managerGuard=`DECLARE @actor uniqueidentifier=?,@actorRevision int=?;
 IF NOT EXISTS(SELECT 1 FROM auth.AccountProfiles p WITH(UPDLOCK,HOLDLOCK) JOIN auth.LocalAccounts a WITH(UPDLOCK,HOLDLOCK) ON a.Id=p.AccountId LEFT JOIN auth.Fields f WITH(UPDLOCK,HOLDLOCK) ON f.FieldCode=p.FieldCode WHERE p.AccountId=@actor AND p.Revision=@actorRevision AND a.IsActive=1 AND (p.AccessLevel='super_admin' OR(p.AccessLevel='department_admin' AND f.IsActive=1))) THROW 51903,'ORG_FORBIDDEN',1;`;
 const rootGuard=managerGuard+`IF NOT EXISTS(SELECT 1 FROM auth.AccountProfiles WHERE AccountId=@actor AND AccessLevel='super_admin') THROW 51903,'ORG_FORBIDDEN',1;`;
 async function authorization(accountId,channel='admin'){
  const profiles=await read(`SELECT ${profileColumns} FROM auth.AccountProfiles p JOIN auth.LocalAccounts a ON a.Id=p.AccountId LEFT JOIN auth.Fields f ON f.FieldCode=p.FieldCode WHERE ${channel==='staff'?'p.StaffAccountId':'CONVERT(nvarchar(40),p.AccountId)'}=?`,[accountId]);
  if(!profiles[0])return null;const p=profiles[0];p.active=Boolean(p.active);p.fieldActive=Boolean(p.fieldActive);
  const [grants,roles,available]=await Promise.all([
   read(`SELECT e.PermissionName permission,COALESCE(d.TaskId,0) taskId FROM auth.vEffectivePermissions e LEFT JOIN auth.PermissionDefinitions d ON d.PermissionName=e.PermissionName WHERE e.AccountId=? ORDER BY e.PermissionName`,[p.accountId]),
   read(`SELECT r.RoleName id,r.DisplayName name,r.Revision revision FROM auth.AccountRoles a JOIN auth.RoleDefinitions r ON r.RoleName=a.RoleName AND r.IsActive=1 WHERE a.AccountId=? AND r.FieldCode=? ORDER BY r.RoleName`,[p.accountId,p.fieldCode]),
   read(`SELECT DISTINCT TaskId id FROM auth.PermissionDefinitions WHERE FieldCode=? AND IsActive=1 ORDER BY TaskId`,[p.fieldCode]),
  ]);
  return organizationAuthorization({...p,roleNames:roles.map(r=>r.id),roleRevisions:roles,availableTaskIds:available.map(t=>t.id)},grants);
 }
 return {authorization,
  async syncPermissionCatalog(actor){return write(rootGuard+'EXEC auth.RefreshPermissionCatalog;',[actor.accountId,actor.revision]);},
  async bootstrapSuperAdmin({id,username,displayName,passwordHash,adoptExisting=false}){
   return write(`IF EXISTS(SELECT 1 FROM auth.AccountProfiles WITH(UPDLOCK,HOLDLOCK) WHERE AccessLevel='super_admin') THROW 51903,'ORG_FORBIDDEN',1;
    DECLARE @existing uniqueidentifier=(SELECT Id FROM auth.LocalAccounts WITH(UPDLOCK,HOLDLOCK) WHERE Username=?);
    IF @existing IS NOT NULL BEGIN IF ?=0 OR EXISTS(SELECT 1 FROM auth.AccountProfiles WHERE AccountId=@existing) OR NOT EXISTS(SELECT 1 FROM auth.LocalAccounts WHERE Id=@existing AND Channel='admin') THROW 51903,'ORG_FORBIDDEN',1;
    UPDATE auth.LocalAccounts SET Username=?,DisplayName=?,PasswordHash=?,IsActive=1 WHERE Id=@existing;END
    ELSE BEGIN SET @existing=?;INSERT auth.LocalAccounts(Id,Username,DisplayName,PasswordHash,Channel)VALUES(@existing,?,?,?,'admin');END;
    INSERT auth.AccountProfiles(AccountId,AccessLevel)VALUES(@existing,'super_admin');INSERT auth.AccountSecurityEvents(ActorId,TargetId,Action)VALUES(@existing,@existing,'BOOTSTRAP_ROOT');SELECT LOWER(CONVERT(varchar(36),@existing)) accountId;`,[username,adoptExisting,username,displayName,passwordHash,id,username,displayName,passwordHash]);
  },
  fields:()=>read('SELECT FieldCode fieldCode,FieldName name,IsActive active FROM auth.Fields ORDER BY FieldCode'),
  tasks:()=>read(`SELECT TaskId id,TaskCode code,TaskName name,FieldCode fieldCode,IsActive active FROM auth.Tasks ORDER BY TaskId`),
  permissionCatalog:()=>read(`SELECT PermissionName [key],DisplayName name,GroupName [group],FieldCode fieldCode,TaskId taskId,ModuleCode module,IsActive active FROM auth.PermissionDefinitions ORDER BY TaskId,GroupName,DisplayName,PermissionName`),
  async roles(){
   const [roles,links]=await Promise.all([read('SELECT RoleName id,DisplayName name,Description description,FieldCode fieldCode,IsActive active,Revision revision FROM auth.RoleDefinitions ORDER BY DisplayName'),read('SELECT RoleName id,PermissionName permission FROM auth.RolePermissions')]);
   return roles.map(r=>({...r,active:Boolean(r.active),permissions:links.filter(l=>l.id===r.id).map(l=>l.permission).sort()}));
  },
  async accounts(level,fieldCode){
   const rows=await read(`SELECT ${profileColumns},a.Username username,a.DisplayName displayName FROM auth.AccountProfiles p JOIN auth.LocalAccounts a ON a.Id=p.AccountId LEFT JOIN auth.Fields f ON f.FieldCode=p.FieldCode WHERE (p.AccessLevel=? OR(? IS NULL AND p.AccessLevel<>'super_admin')) AND (? IS NULL OR p.FieldCode=?) ORDER BY a.Username`,[level,level,fieldCode,fieldCode]);
   const [direct,roles,effective]=await Promise.all([read('SELECT LOWER(CONVERT(varchar(36),AccountId)) accountId,PermissionName permission FROM auth.AccountPermissions'),read('SELECT LOWER(CONVERT(varchar(36),AccountId)) accountId,RoleName id FROM auth.AccountRoles'),read('SELECT LOWER(CONVERT(varchar(36),e.AccountId)) accountId,e.PermissionName permission,COALESCE(d.TaskId,0) taskId FROM auth.vEffectivePermissions e LEFT JOIN auth.PermissionDefinitions d ON d.PermissionName=e.PermissionName')]);
   return rows.map(r=>({...r,active:Boolean(r.active),fieldActive:Boolean(r.fieldActive),permissions:direct.filter(d=>d.accountId===r.accountId).map(d=>d.permission).sort(),roleIds:roles.filter(d=>d.accountId===r.accountId).map(d=>d.id).sort(),effectivePermissions:effective.filter(d=>d.accountId===r.accountId).map(d=>d.permission).sort(),taskIds:[...new Set(effective.filter(d=>d.accountId===r.accountId&&d.taskId).map(d=>d.taskId))].sort()}));
  },
  async saveField(actor,code,name,active,remove=false){return write(rootGuard+(remove?'DELETE auth.Fields WHERE FieldCode=?;':`IF EXISTS(SELECT 1 FROM auth.Fields WHERE FieldCode=?) UPDATE auth.Fields SET FieldName=?,IsActive=? WHERE FieldCode=?;ELSE INSERT auth.Fields(FieldCode,FieldName,IsActive)VALUES(?,?,?);`),[actor.accountId,actor.revision,...(remove?[code]:[code,name,active,code,code,name,active])]);},
  async saveAccount(actor,id,staffId,data,passwordHash,editing){
   let sql=managerGuard+`DECLARE @id uniqueidentifier=?,@staff nvarchar(40)=?,@level varchar(20)=?,@field varchar(10)=?;
    IF @id=@actor OR @level NOT IN('specialist','department_admin') OR NOT EXISTS(SELECT 1 FROM auth.Fields WHERE FieldCode=@field AND IsActive=1) THROW 51903,'ORG_FORBIDDEN',1;
    IF NOT EXISTS(SELECT 1 FROM auth.AccountProfiles WHERE AccountId=@actor AND(AccessLevel='super_admin' OR(AccessLevel='department_admin' AND @level='specialist' AND FieldCode=@field))) THROW 51903,'ORG_FORBIDDEN',1;`;
   const params=[actor.accountId,actor.revision,id,staffId,data.accessLevel,data.fieldCode];
   if(editing){sql+=`IF NOT EXISTS(SELECT 1 FROM auth.AccountProfiles WITH(UPDLOCK,HOLDLOCK) WHERE AccountId=@id AND AccessLevel<>'super_admin' AND Revision=? AND (EXISTS(SELECT 1 FROM auth.AccountProfiles WHERE AccountId=@actor AND AccessLevel='super_admin') OR(AccessLevel='specialist' AND FieldCode=@field))) THROW 51909,'ORG_STALE',1;
    DELETE auth.AccountTasks WHERE AccountId=@id;DELETE auth.AccountRoles WHERE AccountId=@id;DELETE auth.AccountPermissions WHERE AccountId=@id;
    UPDATE auth.AccountProfiles SET AccessLevel=@level,FieldCode=@field,Revision=Revision+1 WHERE AccountId=@id;
    UPDATE auth.LocalAccounts SET DisplayName=?,IsActive=? WHERE Id=@id;
    UPDATE svc_demo.TaiKhoan SET Hoten=?,MaDV=CASE @field WHEN 'DT' THEN '115' WHEN 'SV' THEN '120' ELSE @field END,HieuLuc=?,PhienBanQuyen=PhienBanQuyen+1 WHERE MaHS=@staff;`;
    params.push(data.revision,data.displayName,data.active,data.displayName,data.active);
    if(passwordHash!==undefined){sql+=`UPDATE auth.LocalAccounts SET PasswordHash=? WHERE Id=@id;INSERT auth.AccountSecurityEvents(ActorId,TargetId,Action)VALUES(@actor,@id,'RESET_PASSWORD');`;params.push(passwordHash);}
   }else{sql+=`INSERT auth.LocalAccounts(Id,Username,DisplayName,PasswordHash,Channel,IsActive)VALUES(@id,?,?,?,'admin',?);
    INSERT svc_demo.TaiKhoan(MaHS,Hoten,VaiTro,MaDV,NguonDanhTinh,HieuLuc)VALUES(@staff,?,'STAFF',CASE @field WHEN 'DT' THEN '115' WHEN 'SV' THEN '120' ELSE @field END,'LOCAL',?);
    INSERT auth.AccountProfiles(AccountId,StaffAccountId,AccessLevel,FieldCode)VALUES(@id,@staff,@level,@field);`;params.push(data.username,data.displayName,passwordHash,data.active,data.displayName,data.active);}
   for(const permission of data.permissions??[]){sql+=`IF @level<>'specialist' OR NOT EXISTS(SELECT 1 FROM auth.PermissionDefinitions WITH(UPDLOCK,HOLDLOCK) WHERE PermissionName=? AND FieldCode=@field AND IsActive=1) THROW 51903,'ORG_FORBIDDEN',1;INSERT auth.AccountPermissions(AccountId,PermissionName)VALUES(@id,?);`;params.push(permission,permission);}
   for(const role of data.roleIds??[]){sql+=`IF @level<>'specialist' OR NOT EXISTS(SELECT 1 FROM auth.RoleDefinitions WITH(UPDLOCK,HOLDLOCK) WHERE RoleName=? AND FieldCode=@field AND IsActive=1) THROW 51903,'ORG_FORBIDDEN',1;INSERT auth.AccountRoles(AccountId,RoleName)VALUES(@id,?);`;params.push(role,role);}
   sql+=`INSERT auth.AccountSecurityEvents(ActorId,TargetId,Action)VALUES(@actor,@id,'${editing?'UPDATE_ACCOUNT':'CREATE_ACCOUNT'}');`;
   return write(sql,params);
  },
  async saveRole(actor,id,data,editing){
   let sql=rootGuard+`DECLARE @role nvarchar(100)=?,@field varchar(10)=?;
    IF NOT EXISTS(SELECT 1 FROM auth.Fields WHERE FieldCode=@field AND IsActive=1)THROW 51903,'ORG_FORBIDDEN',1;`;
   const params=[actor.accountId,actor.revision,id,data.fieldCode];
   if(editing){sql+=`IF NOT EXISTS(SELECT 1 FROM auth.RoleDefinitions WITH(UPDLOCK,HOLDLOCK) WHERE RoleName=@role AND Revision=?)THROW 51909,'ORG_STALE',1;
    IF EXISTS(SELECT 1 FROM auth.AccountRoles a JOIN auth.AccountProfiles p ON p.AccountId=a.AccountId WHERE a.RoleName=@role AND p.FieldCode<>@field) THROW 51903,'ORG_FIELD_IN_USE',1;
    UPDATE auth.RoleDefinitions SET DisplayName=?,Description=?,FieldCode=@field,IsActive=?,Revision=Revision+1 WHERE RoleName=@role;DELETE auth.RolePermissions WHERE RoleName=@role;`;params.push(data.revision,data.name,data.description,data.active);
   }else{sql+=`INSERT auth.Roles(RoleName)VALUES(@role);INSERT auth.RoleDefinitions(RoleName,DisplayName,Description,FieldCode,IsActive)VALUES(@role,?,?,@field,?);`;params.push(data.name,data.description,data.active);}
   for(const permission of data.permissions){sql+=`IF NOT EXISTS(SELECT 1 FROM auth.PermissionDefinitions WITH(UPDLOCK,HOLDLOCK) WHERE PermissionName=? AND FieldCode=@field AND IsActive=1)THROW 51903,'ORG_FORBIDDEN',1;INSERT auth.RolePermissions(RoleName,PermissionName)VALUES(@role,?);`;params.push(permission,permission);}
   sql+=`UPDATE auth.AccountProfiles SET Revision=Revision+1 WHERE AccountId IN(SELECT AccountId FROM auth.AccountRoles WHERE RoleName=@role);INSERT auth.AccountSecurityEvents(ActorId,TargetId,Action)VALUES(@actor,@actor,'UPDATE_ROLE');`;return write(sql,params);
  },
  async updatePermissionTag(actor,key,data){return write(rootGuard+`DECLARE @key nvarchar(100)=?,@field varchar(10)=?;IF NOT EXISTS(SELECT 1 FROM auth.Fields WHERE FieldCode=@field AND IsActive=1)THROW 51903,'ORG_FORBIDDEN',1;
   UPDATE auth.PermissionDefinitions SET FieldCode=@field,IsActive=? WHERE PermissionName=@key;IF @@ROWCOUNT<>1 THROW 51909,'ORG_STALE',1;
   UPDATE auth.AccountProfiles SET Revision=Revision+1 WHERE AccessLevel='specialist';INSERT auth.AccountSecurityEvents(ActorId,TargetId,Action)VALUES(@actor,@actor,'UPDATE_PERMISSION');`,[actor.accountId,actor.revision,key,data.fieldCode,data.active]);},
 };
}
export const organizationRepository=createOrganizationRepository();
