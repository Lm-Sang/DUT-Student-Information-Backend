import { AppError } from '../../../shared/errors/app-error.js';
import { validateUsername, validatePassword } from './credentials.js';

export const managementPermissions = Object.freeze({
  super_admin: ['organization.fields.manage', 'organization.admins.manage'],
  department_admin: ['organization.specialists.manage', 'organization.progress.view'],
});

// A tagged account has exactly one role. Legacy grants never supplement it.
export function organizationAuthorization(profile, tasks, taskPermissions) {
  if (!profile) return null;
  const enabled = profile.active && (profile.accessLevel === 'super_admin' || profile.fieldActive);
  const assigned = enabled && profile.accessLevel === 'specialist'
    ? tasks.filter(t => t.active && t.fieldCode === profile.fieldCode).sort((a, b) => a.id - b.id) : [];
  const permissions = !enabled ? [] : profile.accessLevel === 'specialist'
    ? [...new Set(taskPermissions.filter(p => assigned.some(t => t.id === p.taskId)).map(p => p.permission))].sort()
    : [...(managementPermissions[profile.accessLevel] ?? [])];
  return {
    ...profile, taskIds: assigned.map(t => t.id), permissions,
    tags: { role: profile.accessLevel, fieldCode: profile.fieldCode, taskIds: assigned.map(t => t.id) },
  };
}

export function requireOrganizationManager(actor, targetLevel, fieldCode) {
  const profile = actor?.organization ?? actor?.identity?.organization;
  if (actor?.authorizationStatus !== 'active' || !profile?.active || !profile.fieldActive && profile.accessLevel !== 'super_admin')
    throw new AppError('Permission denied', 403);
  if (profile.accessLevel === 'super_admin' && targetLevel === 'department_admin') return;
  if (profile.accessLevel === 'department_admin' && targetLevel === 'specialist' && profile.fieldCode === fieldCode) return;
  throw new AppError('Permission denied', 403);
}

export function parseOrganizationAccount(input, { editing = false } = {}) {
  const allowed = ['displayName', 'accessLevel', 'fieldCode', 'taskIds', 'active', 'password', ...(editing ? ['revision'] : ['username'])];
  if (!input || Array.isArray(input) || typeof input !== 'object' || Object.keys(input).some(k => !allowed.includes(k))) throw new AppError('Invalid account data', 400);
  const { displayName, accessLevel, fieldCode, taskIds = [], active = true } = input;
  if (typeof displayName !== 'string' || !displayName.trim() || displayName.trim().length > 150 || /[\u0000-\u001f]/.test(displayName)
    || !['department_admin', 'specialist'].includes(accessLevel)
    || typeof fieldCode !== 'string' || !/^[A-Z]{2,10}$/.test(fieldCode)
    || typeof active !== 'boolean' || !Array.isArray(taskIds) || taskIds.length > 100
    || taskIds.some(id => !Number.isSafeInteger(id) || id < 1) || new Set(taskIds).size !== taskIds.length
    || accessLevel !== 'specialist' && taskIds.length) throw new AppError('Invalid role, field or task tags', 400);
  if (editing && (!Number.isInteger(input.revision) || input.revision < 1)) throw new AppError('Account revision required', 400);
  const username = editing ? undefined : validateUsername(input.username);
  if (!editing || input.password !== undefined) validatePassword(input.password, username);
  return { ...input, ...(!editing ? { username } : {}), displayName: displayName.trim(), accessLevel, fieldCode, taskIds: [...taskIds].sort((a, b) => a - b), active };
}
