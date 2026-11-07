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
    const p = profile(actor), level = p.accessLevel === 'super_admin' ? null : 'specialist';
    requireOrganizationManager(actor, level, p.fieldCode);
    return { level, fieldCode: p.accessLevel === 'super_admin' ? null : p.fieldCode };
  }
  return {
    async syncPermissionCatalog(actor){const p=profile(actor);if(p.accessLevel!=='super_admin')throw new AppError('Chỉ admin tổng được đồng bộ danh mục quyền.',403);await repository.syncPermissionCatalog(p);return {synchronized:true};},
    async catalog(actor) {
      const p = profile(actor), [fields, tasks,permissions,roles] = await Promise.all([repository.fields(), repository.tasks(),repository.permissionCatalog?.()??[],repository.roles?.()??[]]);
      return { fields: p.accessLevel === 'super_admin' ? fields : fields.filter(f => f.fieldCode === p.fieldCode),
        tasks,permissions:permissions.filter(d=>p.accessLevel==='super_admin'||d.fieldCode===p.fieldCode),roles:roles.filter(d=>p.accessLevel==='super_admin'||d.fieldCode===p.fieldCode) };
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
        if (p.accessLevel!=='super_admin'&&(target.accessLevel !== data.accessLevel || target.fieldCode !== data.fieldCode)) throw new AppError('Không được đổi phòng hoặc cấp quản trị.', 403);
        staffId = target.staffAccountId;
        if (data.password !== undefined) validatePassword(data.password, target.username);
      } else { id = randomUUID(); staffId = 'cv:' + randomUUID(); }
      const definitions=await repository.permissionCatalog?.()??[];
      data.permissions=data.permissions??[];
      data.roleIds=data.roleIds??[];
      if(data.permissions.some(key=>!definitions.some(d=>d.key===key&&d.active&&d.fieldCode===data.fieldCode)))throw new AppError('Quyền không thuộc phòng ban được chọn.',403);
      const passwordHash = data.password === undefined ? undefined : await hashPassword(data.password);
      await repository.saveAccount(p, id, staffId, data, passwordHash, editing);
      return (await repository.accounts(level, fieldCode)).find(a => a.accountId === id);
    },
    async progress(actor, taskId, query = {}) {
      const p = profile(actor);
      if (p.accessLevel!=='department_admin') throw new AppError('Permission denied', 403);
      const id = Number(taskId), offset = Number(query.offset ?? 0);
      if (!Number.isSafeInteger(id) || id < 1 || !Number.isSafeInteger(offset) || offset < 0 || offset > 100000
        || Object.keys(query).some(k => k !== 'offset')) throw new AppError('Invalid task or offset', 400);
      const task = (await repository.tasks()).find(t => t.id === id && t.fieldCode === p.fieldCode);
      if (!task) throw new AppError('Task not found', 404);
      return progressRepository.progress(p, task, offset);
    },
    async saveRole(actor,id,input){
      const p=profile(actor);if(p.accessLevel!=='super_admin')throw new AppError('Chỉ admin tổng được sửa role.',403);
      if(!input||Object.keys(input).some(k=>!['name','description','fieldCode','active','permissions','revision'].includes(k))||typeof input.name!=='string'||!input.name.trim()||input.name.length>150||typeof(input.description??'')!=='string'||(input.description??'').length>1000||!Array.isArray(input.permissions)||new Set(input.permissions).size!==input.permissions.length||input.permissions.length>500||typeof(input.active??true)!=='boolean'||!/^[A-Z]{2,10}$/.test(input.fieldCode??'')||id&&(!Number.isSafeInteger(input.revision)||input.revision<1))throw new AppError('Dữ liệu role không hợp lệ.',400);
      const definitions=await repository.permissionCatalog();if(input.permissions.some(k=>!definitions.some(d=>d.key===k&&d.active&&d.fieldCode===input.fieldCode)))throw new AppError('Role có quyền ngoài phòng ban.',403);
      if(id&&!(await repository.roles()).some(r=>r.id===id))throw new AppError('Không tìm thấy role.',404);
      const key=id??'role:'+randomUUID();await repository.saveRole(p,key,{...input,name:input.name.trim(),description:input.description??'',active:input.active??true},Boolean(id));
      return (await repository.roles()).find(r=>r.id===key);
    },
    async updatePermissionTag(actor,key,input){
      const p=profile(actor);if(p.accessLevel!=='super_admin')throw new AppError('Chỉ admin tổng được đổi tag phòng ban.',403);
      if(!input||Object.keys(input).some(k=>!['fieldCode','active'].includes(k))||!/^[A-Z]{2,10}$/.test(input.fieldCode??'')||typeof input.active!=='boolean')throw new AppError('Tag phòng ban không hợp lệ.',400);
      await repository.updatePermissionTag(p,key,input);return {key,...input};
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
