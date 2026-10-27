import { createHash } from 'node:crypto';
import { AppError } from '../../../shared/errors/app-error.js';
import { canPrintRequest } from '../domain/request-rules.js';
import { renderConfirmationPdf } from './confirmation-pdf.renderer.js';

export function createConfirmationFilesService(repository, { renderer = renderConfirmationPdf, now = () => new Date(), loadProfile=id=>repository.profile(id) } = {}) {
  return {
    async print(actor, id, input) {
      const row = await repository.get(id);
      if (!row || !canPrintRequest(actor, row)) throw new AppError('Chỉ chuyên viên phụ trách được in văn bản xác nhận sau khi tiếp nhận.', 403);
      const hash = createHash('sha256').update(JSON.stringify({ operation: 'printConfirmation', id, ...input })).digest('hex');
      const previous = await repository.receipt(actor.id, input.idempotencyKey, hash);
      if (!previous && row.Version !== input.version) throw new AppError('Hồ sơ đã thay đổi. Hãy tải lại trước khi in.', 409);
      const profile = await loadProfile(row.StudentId);
      const printedAt = now().toISOString();
      const file = await renderer({ row, profile: profile || {}, printedAt });
      const latest = await repository.get(id);
      if (!latest || !canPrintRequest(actor, latest)) throw new AppError('Đơn không còn được phép in.', 403);
      if (latest.Version !== row.Version) throw new AppError('Đơn vừa thay đổi. Vui lòng tải lại trước khi in.', 409);
      if (!previous) await repository.recordPrint({ id, actorId: actor.id, version: input.version,
        key: input.idempotencyKey, hash, printedAt });
      return { bytes: file.bytes, filename: file.filename || `XacNhan-${row.Payload.documentCode}-${id}.pdf`,
        sha256: createHash('sha256').update(file.bytes).digest('hex') };
    },
  };
}
