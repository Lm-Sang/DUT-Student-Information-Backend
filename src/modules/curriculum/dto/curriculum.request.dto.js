import { AppError } from '../../../shared/errors/app-error.js';

function validateQuery(query, allowedKeys) {
  for (const key of Object.keys(query)) {
    if (!allowedKeys.includes(key)) throw new AppError(`Unknown query parameter: ${key}`, 400);
    if (typeof query[key] !== 'string') throw new AppError(`${key} must have one value.`, 400);
  }
}

/** @returns {{ facultyId: string, educationLevelCode: string }} */
export function parseProgramsListQuery(query = {}) {
  validateQuery(query, ['facultyId', 'educationLevelCode']);
  const { facultyId, educationLevelCode = 'CD01' } = query;
  if (typeof facultyId !== 'string' || !/^\d{3}$/.test(facultyId)) {
    throw new AppError('facultyId must contain exactly three digits.', 400);
  }
  if (!/^CD\d{2}$/.test(educationLevelCode)) {
    throw new AppError('educationLevelCode must use the format CD01.', 400);
  }
  return { facultyId, educationLevelCode };
}

/** @returns {{ programId: string }} */
export function parseCurriculumDetailRequest(params = {}, query = {}) {
  validateQuery(query, []);
  const { programId } = params;
  if (!/^\d{7}$/.test(programId)) {
    throw new AppError('programId must contain exactly seven digits.', 400);
  }
  return { programId };
}
