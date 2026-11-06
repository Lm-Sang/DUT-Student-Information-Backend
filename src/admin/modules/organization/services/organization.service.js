import { randomUUID } from 'node:crypto';
import { parseOrganizationAccount, requireOrganizationManager, hashPassword, validatePassword } from '../../../../common/auth/index.js';
import { AppError } from '../../../../shared/errors/app-error.js';

export function createOrganizationService(repository, progressRepository) {
  function profile(actor) {
    const value = actor?.organization ?? actor?.identity?.organization;
    if (actor?.authorizationStatus !== 'active' || !value?.active
      || value.accessLevel !== 'super_admin' && !value.fieldActive) throw new AppError('Permission denied', 403);
    return value;
  }
  function managementTarget(actor) {
    const p = profile(actor), level = p.accessLevel === 'super_admin' ? 'department_admin' : 'specialist';
    requireOrganizationManager(actor, level, p.fieldCode);
    return { level, fieldCode: p.accessLevel === 'super_admin' ? null : p.fieldCode };
  }
  return {
    async catalog(actor) {
      const p = profile(actor), [fields, tasks] = await Promise.all([repository.fields(), repository.tasks()]);
      return { fields: p.accessLevel === 'super_admin' ? fields : fields.filter(f => f.fieldCode === p.fieldCode),
        tasks: p.accessLevel === 'super_admin' ? [] : tasks.filter(t => t.fieldCode === p.fieldCode) };
    },
    async accounts(actor) {
      const { level, fieldCode } = managementTarget(actor);
      return repository.accounts(level, fieldCode);
    },
    async saveField(actor, code, input, remove = false) {
      requireOrganizationManager(actor, 'department_admin', null);
      if (typeof code !== 'string' || !/^[A-Z]{2,10}$/.test(code)) throw new AppError('Invalid fieldCode', 400);
      if (!remove && (!input || Array.isArray(input) || Object.keys(input).some(k => !['name', 'active'].includes(k))
        || typeof input.name !== 'string' || !input.name.trim() || input.name.trim().length > 150
        || /[\u0000-\u001f]/.test(input.name) || typeof (input.active ?? true) !== 'boolean')) throw new AppError('Invalid field data', 400);
      await repository.saveField(profile(actor), code, input?.name?.trim(), input?.active ?? true, remove);
      return { fieldCode: code };
    },
    async saveAccount(actor, id, input) {
      const editing = Boolean(id), data = parseOrganizationAccount(input, { editing });
      requireOrganizationManager(actor, data.accessLevel, data.fieldCode);
      const p = profile(actor), { level, fieldCode } = managementTarget(actor);
      let staffId;
      if (editing) {
        if (!/^[a-f0-9-]{36}$/i.test(id)) throw new AppError('Invalid account id', 400);
        id = id.toLowerCase();
        const target = (await repository.accounts(level, fieldCode)).find(a => a.accountId === id);
        if (!target) throw new AppError('Account not found', 404);
        // Changes of role/department require a separate migration, never a CRUD edit.
        if (target.accessLevel !== data.accessLevel || target.fieldCode !== data.fieldCode) throw new AppError('Cannot change account role or department', 400);
        staffId = target.staffAccountId;
        if (data.password !== undefined) validatePassword(data.password, target.username);
      } else { id = randomUUID(); staffId = 'cv:' + randomUUID(); }
      const passwordHash = data.password === undefined ? undefined : await hashPassword(data.password);
      await repository.saveAccount(p, id, staffId, data, passwordHash, editing);
      return (await repository.accounts(level, fieldCode)).find(a => a.accountId === id);
    },
    async progress(actor, taskId, query = {}) {
      const p = profile(actor);
      if (p.accessLevel !== 'department_admin') throw new AppError('Permission denied', 403);
      const id = Number(taskId), offset = Number(query.offset ?? 0);
      if (!Number.isSafeInteger(id) || id < 1 || !Number.isSafeInteger(offset) || offset < 0 || offset > 100000
        || Object.keys(query).some(k => k !== 'offset')) throw new AppError('Invalid task or offset', 400);
      const task = (await repository.tasks()).find(t => t.id === id && t.fieldCode === p.fieldCode);
      if (!task) throw new AppError('Task not found', 404);
      return progressRepository.progress(p, task, offset);
    },
    async removeAccount(actor, id, input) {
      if (typeof id !== 'string' || !/^[a-f0-9-]{36}$/i.test(id)) throw new AppError('Invalid account id', 400);
      id = id.toLowerCase();
      const { level, fieldCode } = managementTarget(actor);
      const target = (await repository.accounts(level, fieldCode)).find(a => a.accountId === id);
      if (!target) throw new AppError('Account not found', 404);
      if (!input || Object.keys(input).some(k => k !== 'revision')) throw new AppError('Account revision required', 400);
      return this.saveAccount(actor, id, { displayName: target.displayName, accessLevel: target.accessLevel,
        fieldCode: target.fieldCode, taskIds: [], active: false, revision: input.revision });
    },
  };
}
