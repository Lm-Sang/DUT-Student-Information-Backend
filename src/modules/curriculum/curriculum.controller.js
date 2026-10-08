import { AppError } from '../../shared/errors/app-error.js';
import { asyncHandler } from '../../shared/utils/async-handler.js';
import { sendSuccess } from '../../shared/utils/response.js';

function validateQuery(query, allowedKeys) {
  for (const key of Object.keys(query)) {
    if (!allowedKeys.includes(key)) throw new AppError(`Unknown query parameter: ${key}`, 400);
    if (typeof query[key] !== 'string') throw new AppError(`${key} must have one value.`, 400);
  }
}

export function createCurriculumController(service) {
  return {
    listPrograms: asyncHandler(async (req, res) => {
      validateQuery(req.query, ['facultyId', 'educationLevelCode']);
      const { facultyId, educationLevelCode = 'CD01' } = req.query;
      if (typeof facultyId !== 'string' || !/^\d{3}$/.test(facultyId)) {
        throw new AppError('facultyId must contain exactly three digits.', 400);
      }
      if (!/^CD\d{2}$/.test(educationLevelCode)) {
        throw new AppError('educationLevelCode must use the format CD01.', 400);
      }
      const data = await service.listPrograms({ facultyId, educationLevelCode });
      res.setHeader('Cache-Control', 'no-store');
      return sendSuccess(res, data);
    }),

    getCurriculum: asyncHandler(async (req, res) => {
      validateQuery(req.query, []);
      const { programId } = req.params;
      if (!/^\d{7}$/.test(programId)) {
        throw new AppError('programId must contain exactly seven digits.', 400);
      }
      const data = await service.getCurriculum(programId);
      res.setHeader('Cache-Control', 'no-store');
      return sendSuccess(res, data);
    }),
  };
}
