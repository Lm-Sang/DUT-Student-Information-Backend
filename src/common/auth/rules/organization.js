import { AppError } from '../../../shared/errors/app-error.js';
import { validateUsername, validatePassword } from './credentials.js';

export const managementPermissions = Object.freeze({
  super_admin: ['organization.fields.manage', 'organization.admins.manage'],
  department_admin: ['organization.specialists.manage', 'organization.progress.view'],
});

// Only effective per-type grants from auth views establish workflow authority.
export function organizationAuthorization(profile, granularGrants = []) {
  if (!profile) return null;
  const enabled = profile.active && (profile.accessLevel === 'super_admin' || profile.fieldActive);
  const specialist = enabled && profile.accessLevel === 'specialist';
  const permissions = !enabled ? [] : specialist
    ? [...new Set(granularGrants.map(p=>p.permission))].sort()
    : [...(managementPermissions[profile.accessLevel] ?? [])];
  const taskIds = specialist ? [...new Set(granularGrants.map(p=>p.taskId).filter(Boolean))].sort((a,b)=>a-b) : [];
  return {...profile,taskIds,permissions,tags:{role:profile.accessLevel,fieldCode:profile.fieldCode,taskIds,...(profile.availableTaskIds?{availableTaskIds:profile.availableTaskIds}:{})}};
}

export function requireOrganizationManager(actor, targetLevel, fieldCode) {
  const profile = actor?.organization ?? actor?.identity?.organization;
  if (actor?.authorizationStatus !== 'active' || !profile?.active || !profile.fieldActive && profile.accessLevel !== 'super_admin')
    throw new AppError('Permission denied', 403);
  if (profile.accessLevel === 'super_admin' && ['department_admin','specialist',null].includes(targetLevel)) return;
  if (profile.accessLevel === 'department_admin' && targetLevel === 'specialist' && profile.fieldCode === fieldCode) return;
  throw new AppError('Permission denied', 403);
}

export function parseOrganizationAccount(input, { editing = false } = {}) {
  const allowed = ['displayName', 'accessLevel', 'fieldCode', 'taskIds', 'permissions', 'roleIds', 'active', 'password', ...(editing ? ['revision'] : ['username'])];
  if (!input || Array.isArray(input) || typeof input !== 'object' || Object.keys(input).some(k => !allowed.includes(k))) throw new AppError('Invalid account data', 400);
  const { displayName, accessLevel, fieldCode, taskIds = [], active = true } = input;
  if (typeof displayName !== 'string' || !displayName.trim() || displayName.trim().length > 150 || /[\u0000-\u001f]/.test(displayName)
    || !['department_admin', 'specialist'].includes(accessLevel)
    || typeof fieldCode !== 'string' || !/^[A-Z]{2,10}$/.test(fieldCode)
    || typeof active !== 'boolean' || !Array.isArray(taskIds) || taskIds.length > 100
    || taskIds.some(id => !Number.isSafeInteger(id) || id < 1) || new Set(taskIds).size !== taskIds.length
    || accessLevel !== 'specialist' && taskIds.length) throw new AppError('Invalid role, field or task tags', 400);
  if(taskIds.length)throw new AppError('Hãy chọn quyền cho từng loại hồ sơ; không cấp quyền bằng nhóm tác vụ.',400);
  for(const key of ['permissions','roleIds'])if(input[key]!==undefined&&(!Array.isArray(input[key])||input[key].length>500||new Set(input[key]).size!==input[key].length||input[key].some(v=>typeof v!=='string'||!v||v.length>100||/[*\s]/.test(v)||/[\u0000-\u001f]/.test(v))))throw new AppError('Danh sách quyền / role không hợp lệ.',400);
  if(accessLevel!=='specialist'&&((input.permissions?.length??0)||(input.roleIds?.length??0)))throw new AppError('Chỉ chuyên viên được gán quyền xử lý.',400);
  if (editing && (!Number.isInteger(input.revision) || input.revision < 1)) throw new AppError('Account revision required', 400);
  const username = editing ? undefined : validateUsername(input.username);
  if (!editing || input.password !== undefined) validatePassword(input.password, username);
  return { ...input, ...(!editing ? { username } : {}), displayName: displayName.trim(), accessLevel, fieldCode, taskIds: [...taskIds].sort((a, b) => a - b), active };
}
