import {requireManagement,requirePermission,hasPermission} from '../domain/rbac.js';
import { createHash } from 'node:crypto';
import { AppError } from '../../../shared/errors/app-error.js';
import { actorDto } from '../mappers/requests.mapper.js';
import { requireAdmin, workCatalog, validatePermissionChange, canWork } from '../domain/work-permissions.js';
import { requestTypes } from '../domain/request-rules.js';

export function createAdminWorkflowService(repository, requests, {rbac} = {}) {
  return {
    async overview(actor) {
      requireManagement(actor);
      const [people,catalog] = await Promise.all([repository.staff(),requests.catalogs()]);
      return { staff: people.map(actorDto), work: workCatalog(requestTypes,catalog.documents), ...(rbac?await rbac.overview(actor):{}) };
    },
    async permissions(actor,staffId,input) {
      requireAdmin(actor);
      const catalog = await requests.catalogs();
      const change = validatePermissionChange(input,workCatalog(requestTypes,catalog.documents));
      const staff = await repository.actor(staffId);
      if (!staff || staff.Role!=='STAFF') throw new AppError('Chuyên viên không còn hoạt động.',404);
      await repository.setPermissions({adminId:actor.id,staffId,...change});
      return actorDto(await repository.actor(staffId));
    },
    async reassign(actor,id,input) {
      requirePermission(actor,'requests.reassign');
      if (!input || Object.keys(input).some(k=>!['staffId','reason','version','idempotencyKey'].includes(k))
        || typeof input.staffId!=='string' || input.staffId.length>40 || !Number.isInteger(input.version) || input.version<1
        || typeof input.reason!=='string' || !input.reason.trim() || input.reason.length>1500
        || typeof input.idempotencyKey!=='string' || !input.idempotencyKey || input.idempotencyKey.length>100) throw new AppError('Chọn chuyên viên, nhập lý do bàn giao và tải phiên bản mới nhất.',400);
      const [request,staff] = await Promise.all([requests.detail(actor,id),repository.actor(input.staffId)]);
      const digest = createHash('sha256').update(JSON.stringify({operation:'reassign',id,...input})).digest('hex');
      if (await repository.receipt(actor.id,input.idempotencyKey,digest)) return requests.detail(actor,id);
      if (!request.assignedStaffId || ['SUBMITTED','COMPLETED','CANCELLED','READY'].includes(request.status)) throw new AppError('Chỉ bàn giao hồ sơ đã tiếp nhận và còn đang xử lý.',409);
      if (request.assignedStaffId===input.staffId) throw new AppError('Chuyên viên này đang phụ trách hồ sơ.',400);
      if (!staff || !canWork(actorDto(staff),request)||!hasPermission(actorDto(staff),'requests.view')) throw new AppError('Chuyên viên mới chưa được cấp quyền xử lý loại việc này.',403);
      await repository.reassign({id,adminId:actor.id,staffId:input.staffId,reason:input.reason.trim(),version:input.version,
        key:input.idempotencyKey,hash:digest,message:`Quản trị viên bàn giao hồ sơ cho ${staff.DisplayName}. Lý do: ${input.reason.trim()}`});
      return requests.detail(actor,id);
    },
  };
}
