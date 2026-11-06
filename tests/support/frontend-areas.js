import { createApp } from '../../src/app.js';
import { AppError } from '../../src/shared/errors/app-error.js';
export { listen } from './public-api.js';

export function isolatedApp(overrides) {
  const names = ['healthModule', 'studentAuthModule', 'staffAuthModule', 'studentServicesModule',
    'staffServicesModule', 'studentsModule', 'adminModule', 'usersModule', 'courseRegistrationModule',
    'timetableModule', 'curriculumModule', 'announcementsModule', 'requestsModule',
    'certificationsModule', 'itCertificationsModule', 'academicLeaveModule', 'adminAuthModule', 'organizationModule'];
  return createApp({ ...Object.fromEntries(names.map(name => [name, null])), ...overrides });
}
const student = { role: 'student', source: 'auth', reference: 'student:one', studentCode: '102210001', cohortYear: 2021 };
const reviewer = { role: 'reviewer', source: 'auth', reference: 'staff:one', name: 'Reviewer' };
export async function studentContext(req) {
  if (req.headers.authorization !== 'Bearer student') throw new AppError('Student token required', 401);
  return student;
}
export async function reviewerContext(req) {
  if (req.headers.authorization !== 'Bearer reviewer') throw new AppError('Reviewer token required', 401);
  return reviewer;
}
export const headers = token => token ? { Authorization: 'Bearer ' + token } : {};
