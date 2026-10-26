import { actionsFor, statuses, typeOf, isPaperRequest, canPrintConfirmation, canPrintRequest } from '../domain/request-rules.js';

export function actorDto(row) {
  return { id: row.Id, name: row.DisplayName, role: row.Role, department: row.Department, studentNumber: row.StudentNumber };
}

export function requestDto(row, actor) {
  const paper = isPaperRequest(row.TypeCode);
  const type = typeOf(row.TypeCode);
  const request = { id: row.Id, number: `DN-${String(row.Number).padStart(6, '0')}`, studentId: row.StudentId,
    studentName: row.StudentName, studentNumber: row.StudentNumber, typeCode: row.TypeCode,
    department: row.Department, status: row.Status,
    statusLabel: row.Status === 'CANCELLED' ? statuses.CANCELLED : row.TypeCode === 'LMS_SUPPORT' && row.Status === 'COMPLETED' ? 'Đã phản hồi mật khẩu' : paper
      ? row.Status === 'COMPLETED' ? 'Đã xử lý' : row.Status === 'SUBMITTED' ? 'Chờ tiếp nhận' : 'Đã tiếp nhận'
      : row.TypeCode === 'CONFIRMATION' && row.Status === 'READY' ? 'Đã xử lý · Chờ trả'
        : row.TypeCode === 'CONFIRMATION' && row.Status === 'COMPLETED' ? row.DeliveredAt ? 'Đã trả cho sinh viên' : 'Đã xử lý' : statuses[row.Status],
    group: type.group, submissionMode: type.submissionMode,
    formFile: paper ? { status: row.Status === 'CANCELLED' ? 'REQUEST_CANCELLED' : 'AVAILABLE',
      canDownload: row.Status !== 'CANCELLED', canPrint: canPrintRequest(actor,row), filename: `${row.TypeCode}-${row.Id}.pdf`,
      generation: 'ON_DOWNLOAD', createdAt: row.CreatedAt,
      note: row.Status === 'CANCELLED' ? 'Đơn đã hủy; không được tải lại như một đơn có hiệu lực.'
        : 'PDF được tạo khi tải từ các field của đơn và hồ sơ sinh viên hiện tại; không lưu file trong DB.' } : null,
    confirmationFile: row.TypeCode === 'CONFIRMATION' ? { canPrint: canPrintConfirmation(actor, row), isPlaceholder: true,
      filename: `XacNhan-${row.Payload.documentCode}-${row.Id}.pdf`, printedAt: row.PrintedAt ?? null } : null,
    payload: row.Payload, requiredFields: row.RequiredFields || [],
    assignedStaffId: row.AssignedStaffId, assignedStaffName: row.AssignedStaffName,
    submittedTerm: row.SubmittedTerm, createdAt: row.CreatedAt, updatedAt: row.UpdatedAt, receivedAt: row.ReceivedAt,
    completedAt: row.CompletedAt, lastFeedback: row.LastFeedback, resultSummary: row.ResultSummary,
    cancelledByRole: row.CancelledByRole, cancelReason: row.CancelReason, cancelledAt: row.CancelledAt,
    catalogSnapshot: row.CatalogSnapshot ?? null,
    printedAt: row.PrintedAt ?? null, pickupAt: row.PickupAt ?? null, pickupLocation: row.PickupLocation ?? null,
    processedAt: row.ProcessedAt ?? null, deliveredAt: row.DeliveredAt ?? null,
    appointment: row.TypeCode === 'CONFIRMATION' && row.PickupAt ? {
      status: row.Status === 'CANCELLED' ? 'CANCELLED' : row.DeliveredAt ? 'DELIVERED' : 'SCHEDULED',
      createdAt: row.ProcessedAt ?? row.PrintedAt ?? null, pickupAt: row.PickupAt, location: row.PickupLocation,
    } : null,
    version: row.Version, isSimulation: true };
  return { ...request, typeName: request.typeCode === 'CONFIRMATION' ? request.catalogSnapshot?.name || typeOf(request.typeCode).name : typeOf(request.typeCode).name,
    categoryName: typeOf(request.typeCode).name, actions: actionsFor(actor, request) };
}

export function eventDto(row) {
  return { id: row.Id, actorName: row.ActorName, actorRole: row.ActorRole, type: row.EventType,
    fromStatus: row.FromStatus, toStatus: row.ToStatus, message: row.Message, createdAt: row.CreatedAt,
    details: row.Details || {} };
}
