import { AppError } from '../../shared/errors/app-error.js';
import { asyncHandler } from '../../shared/utils/async-handler.js';
import { sendSuccess } from '../../shared/utils/response.js';

function positiveInt(value, name, maximum) {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) {
    throw new AppError(`${name} must be a positive integer.`, 400);
  }
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number > maximum) {
    throw new AppError(`${name} is out of range.`, 400);
  }
  return number;
}

export function createAnnouncementsController(service) {
  return {
    list: asyncHandler(async (req, res) => {
      for (const key of Object.keys(req.query)) {
        if (!['pageIndex', 'pageSize'].includes(key)) {
          throw new AppError(`Unknown query parameter: ${key}`, 400);
        }
      }
      const pageIndex = positiveInt(req.query.pageIndex ?? '1', 'pageIndex', 21_474_836);
      const pageSize = positiveInt(req.query.pageSize ?? '20', 'pageSize', 100);
      res.setHeader('Cache-Control', 'no-store');
      return sendSuccess(res, await service.list({ pageIndex, pageSize }));
    }),

    getById: asyncHandler(async (req, res) => {
      if (Object.keys(req.query).length) throw new AppError('Unknown query parameter.', 400);
      const id = positiveInt(req.params.id, 'id', 2_147_483_647);
      res.setHeader('Cache-Control', 'no-store');
      return sendSuccess(res, await service.getById(id));
    }),
  };
}
