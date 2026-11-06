import { asyncHandler } from '../../../shared/utils/async-handler.js';
import { sendSuccess } from '../../../shared/utils/response.js';
import { parseProgramsListQuery, parseCurriculumDetailRequest } from '../dto/curriculum.request.dto.js';

export function createCurriculumController(service) {
  return {
    listPrograms: asyncHandler(async (req, res) => {
      const query = parseProgramsListQuery(req.query);
      const data = await service.listPrograms(query);
      res.setHeader('Cache-Control', 'no-store');
      return sendSuccess(res, data);
    }),

    getCurriculum: asyncHandler(async (req, res) => {
      const { programId } = parseCurriculumDetailRequest(req.params, req.query);
      const data = await service.getCurriculum(programId);
      res.setHeader('Cache-Control', 'no-store');
      return sendSuccess(res, data);
    }),
  };
}
