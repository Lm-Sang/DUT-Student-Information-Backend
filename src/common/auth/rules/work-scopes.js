import {AppError} from '../../../shared/errors/app-error.js';
export function hasWorkflowScope(actor,module,key){
 if(actor?.role==='student'||actor?.monitoring||actor?.scopePermissions===undefined)return true;
 return actor.scopePermissions.includes(`work:${module}:${key}`);
}
export function assertWorkflowScope(actor,module,key){if(!hasWorkflowScope(actor,module,key))throw new AppError('Bạn chưa được phân công xử lý loại hồ sơ này.',403);}
// Module and key expressions below are code-owned SQL fragments; actor grants
// and account IDs come from verified server context in a bound JSON parameter.
export function workflowScopeSql(module,key){return `(JSON_QUERY(@input,'$.actor.scopePermissions') IS NULL OR JSON_VALUE(@input,'$.actor.monitoring')='true' OR EXISTS(SELECT 1 FROM OPENJSON(@input,'$.actor.scopePermissions') scopeGrant WHERE scopeGrant.value=CONCAT(N'work:${module}:',${key})))`;}
export function workflowWriteGuardSql(module,key,error){return `IF JSON_VALUE(@input,'$.actor.accountId') IS NOT NULL AND NOT EXISTS(SELECT 1 FROM auth.vAssignedPermissions p WHERE p.AccountId=TRY_CONVERT(uniqueidentifier,JSON_VALUE(@input,'$.actor.accountId')) AND p.PermissionName=CONCAT(N'work:${module}:',${key})) THROW ${error},'WORK_SCOPE_FORBIDDEN',1;`;}
