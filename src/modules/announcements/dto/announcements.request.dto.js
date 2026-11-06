import { AppError } from '../../../shared/errors/app-error.js';

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

/** @returns {{ pageIndex: number, pageSize: number }} */
export function parseAnnouncementsListQuery(query = {}) {
  for (const key of Object.keys(query)) {
    if (!['pageIndex', 'pageSize'].includes(key)) {
      throw new AppError(`Unknown query parameter: ${key}`, 400);
    }
  }
  return {
    pageIndex: positiveInt(query.pageIndex ?? '1', 'pageIndex', 21_474_836),
    pageSize: positiveInt(query.pageSize ?? '20', 'pageSize', 100),
  };
}

/** @returns {{ id: number }} */
export function parseAnnouncementDetailRequest(params = {}, query = {}) {
  if (Object.keys(query).length) throw new AppError('Unknown query parameter.', 400);
  return { id: positiveInt(params.id, 'id', 2_147_483_647) };
}
