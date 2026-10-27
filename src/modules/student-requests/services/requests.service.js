import { createHash, randomUUID } from 'node:crypto';
import { AppError } from '../../../shared/errors/app-error.js';
import { supplementFields, parsePayload } from '../dto/requests.dto.js';
import { documentSnapshot, schoolYears } from '../domain/document-rules.js';
import { canRead, requestTypes, statuses, transition, typeOf, visibleTerms, isPaperRequest } from '../domain/request-rules.js';
import { actorDto, eventDto, requestDto } from '../mappers/requests.mapper.js';
import { createPaperFilesService } from './paper-files.service.js';
import { createConfirmationFilesService } from './confirmation-files.service.js';
import { cancellationReasons, cancellationFeedback } from '../domain/staff-workflow.js';

function hash(value) { return createHash('sha256').update(JSON.stringify(value)).digest('hex'); }

export function createRequestsService(repository, { paperFiles = createPaperFilesService(repository), confirmationFiles = createConfirmationFilesService(repository), now = () => new Date(), loadProfile=id=>repository.profile(id) } = {}) {
  async function get(actor, id) {
    const row = await repository.get(id);
    if (!row || !canRead(actor, { studentId: row.StudentId, department: row.Department, typeCode: row.TypeCode, payload: row.Payload, assignedStaffId: row.AssignedStaffId })) throw new AppError('Không tìm thấy hồ sơ trong phạm vi được phép.', 404);
    return requestDto(row, actor);
  }
  async function catalogs() {
    const data = await repository.catalogs();
    const current = data.settings.find(s => s.SettingKey === 'currentTerm');
    const source = data.settings.find(s => s.SettingKey === 'catalogSource');
    if (!current) throw new AppError('Chưa khởi tạo danh mục. Chạy npm.cmd run db:demo:setup.', 503);
    const terms = visibleTerms(data.terms, current.SettingValue);
    return { types: requestTypes, statuses, cancellationReasons, terms, years: schoolYears(terms), programs: data.programs,
      documents: (data.documents ?? []).filter(doc => doc.termCode === current.SettingValue),
      supportSystems: (data.supportSystems ?? []).filter(system => system.code === '3'), currentTerm: current.SettingValue,
      nextTerm: terms.find(t => t.isNext)?.code ?? null, observedAt: current.ObservedAt,
      source: source?.SettingValue ?? 'local demo', isSimulation: true,
      note: 'Quyền và hồ sơ thử nghiệm; duyệt/ký diễn ra bên ngoài, không cập nhật DB trường.' };
  }
  async function validateCatalog(typeCode, payload) {
    const data = await catalogs();
    for (const field of ['expectedTerm', 'targetTerm', 'reviewTerm', 'startTerm', 'periodTerm']) {
      if (payload[field] && !data.terms.some(term => term.code === payload[field])) throw new AppError('Học kỳ không nằm trong danh mục cho phép (tối đa kỳ kế tiếp).', 400);
    }
    if (typeCode === 'DonSV07' && !data.programs.some(program => program.code === payload.programCode)) throw new AppError('Chương trình 2 không hợp lệ hoặc không còn hiển thị.', 400);
    if (typeCode === 'CONFIRMATION') {
      data.selectedDocument = data.documents.find(doc => doc.code === payload.documentCode);
      if (!data.selectedDocument) throw new AppError('Loại văn bản không nằm trong danh mục hiện hành.', 400);
      if (/(ghi rõ|nhập lý do|cần nhập|cần ghi)/i.test(data.selectedDocument.guidance) && !payload.additionalInfo) throw new AppError('Vui lòng nhập thông tin thêm theo hướng dẫn của loại văn bản.', 400);
      if (payload.academicYear && !data.years.includes(payload.academicYear)) throw new AppError('Năm học không hợp lệ.', 400);
    }
    if (typeCode === 'LMS_SUPPORT' && !data.supportSystems.some(system => system.code === payload.supportCode)) throw new AppError('Hệ thống LMS chưa được mở hỗ trợ trong danh mục.', 400);
    return data;
  }
  return {
    actors: async () => (await repository.actors()).map(actorDto),
    async actor(id) { const row = await repository.actor(id); if (!row || row.IdentitySource !== 'DEMO') throw new AppError('Nhân vật thử nghiệm không hợp lệ.', 401); return actorDto(row); },
    async sessionActor(id) { const row = await repository.actor(id); if (!row) throw new AppError('Phiên không còn hiệu lực.', 401); return actorDto(row); },
    catalogs,
    profile: async actor => actor.role === 'STUDENT' ? loadProfile(actor.id) : null,
    download: (actor, id) => paperFiles.download(actor, id),
    printConfirmation: (actor, id, input) => confirmationFiles.print(actor, id, input),
    list: async actor => (await repository.list(actor)).map(row => ({ ...requestDto(row, actor),
      ...(row.TypeCode === 'LMS_SUPPORT' ? { resultSummary: null } : {}) })),
    async detail(actor, id) {
      const request = await get(actor, id);
      const [events, revisions] = await Promise.all([repository.events(id), repository.revisions(id)]);
      return { ...request, events: events.map(eventDto), revisions: revisions.map(row => ({ number: row.RevisionNo,
        payload: row.Payload, createdAt: row.CreatedAt })) };
    },
    async create(actor, input) {
      if (actor.role !== 'STUDENT') throw new AppError('Chỉ sinh viên được tạo đơn trong bản thử.', 403);
      const digest = hash({ operation: 'create', typeCode: input.typeCode, payload: input.payload });
      const previous = await repository.receipt(actor.id, input.idempotencyKey, digest);
      if (previous) return get(actor, previous);
      if(actor.identitySource==='SSO'&&input.typeCode!=='LMS_SUPPORT')await loadProfile(actor.id);
      const type = typeOf(input.typeCode);
      const data = await validateCatalog(input.typeCode, input.payload);
      const catalogSnapshot = input.typeCode === 'CONFIRMATION' ? documentSnapshot(data.selectedDocument, input.payload)
        : input.typeCode === 'LMS_SUPPORT' ? { ...data.supportSystems.find(system => system.code === '3'), source: 'DATA_GVien1.Sys_Email', isSimulation: true } : null;
      const proposedId = randomUUID(), createdAt = new Date().toISOString();
      const id = await repository.create({ id: proposedId, createdAt, actorId: actor.id, key: input.idempotencyKey, hash: digest,
        typeCode: type.code, department: input.typeCode === 'CONFIRMATION' ? data.selectedDocument.department : type.department,
        payload: input.payload, term: data.currentTerm, catalogSnapshot });
      return get(actor, id);
    },
    async command(actor, id, input) {
      const request = await get(actor, id);
      const digest = hash({ operation: 'command', id, ...input });
      const previous = await repository.receipt(actor.id, input.idempotencyKey, digest);
      if (previous) return get(actor, previous);
      if (request.version !== input.version) throw new AppError('Hồ sơ đã thay đổi. Hãy tải lại trước khi thao tác.', 409);
      const feedback = cancellationFeedback(actor, input);
      const change = transition(actor, request, { ...input, message: feedback.message });
      let payload = request.payload;
      let catalogSnapshot = request.catalogSnapshot;
      if (input.action === 'requestInfo') {
        const allowed = supplementFields(request.typeCode, request.payload);
        if (input.requiredFields.some(field => !allowed.includes(field))) throw new AppError('Field yêu cầu bổ sung không thuộc loại đơn này.', 400);
      }
      if (input.action === 'supplement') {
        payload = parsePayload(request.typeCode, input.payload);
        if (Object.keys(payload).some(field => payload[field] !== request.payload[field] && !request.requiredFields.includes(field))) throw new AppError('Chỉ được sửa những field chuyên viên yêu cầu bổ sung.', 400);
        if (JSON.stringify(payload) === JSON.stringify(request.payload) && !input.message) throw new AppError('Vui lòng bổ sung nội dung hoặc ghi phản hồi cho chuyên viên.', 400);
        await validateCatalog(request.typeCode, payload);
        if (request.typeCode === 'CONFIRMATION') catalogSnapshot = documentSnapshot(request.catalogSnapshot, payload);
      } else if (input.payload !== undefined) throw new AppError('Thao tác này không được sửa nội dung đơn.', 400);
      const resultDetails = {};
      if (input.printedAt || input.pickupAt) throw new AppError('Lịch trả được tự tạo sau ngày in 3 ngày; không nhận ngày hẹn từ client.', 400);
      if (input.pickupLocation) {
        if (request.typeCode !== 'CONFIRMATION' || input.action !== 'result') throw new AppError('Thông tin in và lịch nhận chỉ dùng khi trả kết quả văn bản.', 400);
      }
      if (request.typeCode === 'CONFIRMATION' && input.action === 'result') {
        Object.assign(resultDetails, { processedAt: now().toISOString() });
      }
      await repository.update({ id, actorId: actor.id, role: actor.role, version: input.version,
        key: input.idempotencyKey, hash: digest, action: input.action, ...change, payload,
        typeCode: request.typeCode, catalogSnapshot, isPaper: isPaperRequest(request.typeCode), ...resultDetails,
        requiredFields: input.action === 'requestInfo' ? input.requiredFields : [],
        eventDetails: input.action === 'requestInfo' ? { requiredFields: input.requiredFields }
          : input.action === 'supplement' ? { changedFields: Object.keys(payload).filter(field => payload[field] !== request.payload[field]) }
            : { isSimulation: true, ...resultDetails, ...(feedback.cancelReasonCode ? feedback : {}) } });
      return get(actor, id);
    },
  };
}
