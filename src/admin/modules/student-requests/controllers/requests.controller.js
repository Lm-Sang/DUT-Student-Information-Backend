import { createRequestsController } from '../../../../common/student-requests/controllers/requests.controller.js';
import { parseCreate, parseId } from '../../../../common/student-requests/dto/requests.dto.js';
import { AppError } from '../../../../shared/errors/app-error.js';

export function createAdminRequestsController(service, { workbook } = {}) {
  return {
    ...createRequestsController(service),
    // The legacy endpoint parses input before rejecting staff submissions.
    create: req => {
      parseCreate(req.body);
      throw new AppError('Chỉ sinh viên được tạo đơn trong bản thử.', 403);
    },
    exportWorkbook: async (req, res) => {
      const bytes = await workbook.export(req.requestActor, req.body);
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="XuLyHoSo.xlsx"',
        'X-Content-Type-Options': 'nosniff',
      }).send(bytes);
    },
    previewWorkbook: async (req, res) => res.json({ data: await workbook.preview(req.requestActor, req.body) }),
    commitWorkbook: async (req, res) => res.json({ data: await workbook.commit(req.requestActor, req.body) }),
  };
}
