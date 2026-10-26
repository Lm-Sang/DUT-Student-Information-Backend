import { createHash } from 'node:crypto';
import { AppError } from '../../../shared/errors/app-error.js';
import { canRead, isPaperRequest } from '../domain/request-rules.js';
import { paperTemplates, renderPaperPdf } from './paper-pdf.renderer.js';

export function createPaperFilesService(repository, { renderer = renderPaperPdf } = {}) {
  return {
    async download(actor, id) {
      const row = await repository.get(id);
      if (!row || row.Status === 'CANCELLED' || !isPaperRequest(row.TypeCode)
        || !canRead(actor, { studentId: row.StudentId, department: row.Department })) throw new AppError('Không có đơn được phép tải PDF.', 404);
      const template = paperTemplates.find(t => t.code === row.TypeCode);
      if (!template) throw new AppError('Chưa cấu hình biểu mẫu.', 503);
      const profile = await repository.profile(row.StudentId);
      if (!profile?.name || profile.studentNumber !== row.StudentNumber) throw new AppError('Chưa có hồ sơ sinh viên phù hợp để điền biểu mẫu.', 422);
      const catalog = await repository.catalogs();
      const payload = row.Payload;
      const values = { ...payload, programName: catalog.programs.find(p => p.code === payload.programCode)?.name,
        withdrawalReason: payload.reasonCode === 'LH002' ? 'Chuyển trường' : 'Nguyện vọng cá nhân' };
      for (const field of ['expectedTerm','targetTerm','reviewTerm','startTerm']) if (payload[field]) values[field] = catalog.terms.find(t => t.code === payload[field])?.name;
      // Memory-only input for one download: no JSON object or PDF is saved in SQL.
      const snapshot = { requestId: id, typeCode: row.TypeCode, createdAt: row.CreatedAt, profile, payload, values,
        scholarship: profile.semesterResults?.find(s => s.termCode === payload.reviewTerm) || {} };
      let photo = null;
      if (profile.photoBase64) {
        photo = Buffer.from(profile.photoBase64, 'base64');
        if (photo.length > 2*1024*1024 || !(photo.subarray(0,3).equals(Buffer.from([255,216,255])) || photo.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))) throw new AppError('Ảnh hồ sơ phải là PNG/JPEG dưới 2MB.', 422);
      }
      const result = await renderer({ template, snapshot, photo });
      const latest = await repository.get(id);
      if (!latest || latest.Status === 'CANCELLED' || !canRead(actor, { studentId: latest.StudentId, department: latest.Department })) throw new AppError('Đơn đã hủy hoặc không còn được phép tải.', 404);
      if (latest.Version !== row.Version) throw new AppError('Đơn vừa thay đổi. Vui lòng tải lại.', 409);
      return { bytes: result.bytes, filename: `${row.TypeCode}-${id}.pdf`, sha256: createHash('sha256').update(result.bytes).digest('hex') };
    },
  };
}
