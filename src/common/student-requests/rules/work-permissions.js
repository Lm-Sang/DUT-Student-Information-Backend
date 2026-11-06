import { AppError } from '../../../shared/errors/app-error.js';

export function workKey(request) {
  const type = request.typeCode ?? request.TypeCode;
  const payload = request.payload ?? request.Payload ?? {};
  return type === 'CONFIRMATION' ? `CONFIRMATION:${payload.documentCode}` : type;
}
export function canWork(actor, request) {
  return actor.role === 'STAFF' && Array.isArray(actor.workPermissions) && actor.workPermissions.includes(workKey(request));
}
export function workCatalog(types, documents) {
  return [...types.filter(t => t.code !== 'CONFIRMATION').map(t => ({ key: t.code, name: t.name, group: t.group, department: t.department })),
    ...documents.map(d => ({ key: `CONFIRMATION:${d.code}`, name: d.name, group: 'CONFIRMATION', department: d.department }))];
}
export function requireAdmin(actor) {
  if (actor.role !== 'ADMIN') throw new AppError('Chỉ quản trị viên được phân quyền hoặc bàn giao hồ sơ.', 403);
}
export function validatePermissionChange(input, available) {
  if (!input || Object.keys(input).some(k => !['keys','version'].includes(k)) || !Array.isArray(input.keys)
    || input.keys.length > 100 || input.keys.some(k => typeof k !== 'string' || !available.some(w => w.key === k))
    || new Set(input.keys).size !== input.keys.length || !Number.isInteger(input.version) || input.version < 1) {
    throw new AppError('Danh sách quyền hoặc phiên bản chuyên viên không hợp lệ.', 400);
  }
  return { keys: [...input.keys].sort(), version: input.version };
}
