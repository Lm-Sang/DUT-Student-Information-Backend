import defaultAcademicLeaveModule from './modules/academic-leave.module.js';
import defaultAnnouncementsModule from '../public/modules/announcements/index.js';
import defaultCertificationsModule, { itCertificationsModule as defaultItCertificationsModule } from './modules/certifications.module.js';
import { studentAuthModule as defaultStudentAuthModule } from '../student/modules/auth/index.js';
import { createStaffAuthModule } from '../admin/modules/auth/staff-auth.module.js';
import defaultCourseRegistrationModule from '../public/modules/course-registration/index.js';
import defaultCurriculumModule from '../public/modules/curriculum/index.js';
import defaultHealthModule from '../public/modules/health/index.js';
import defaultRequestsModule, { createRequestsApiModule } from './modules/student-requests.module.js';
import defaultTimetableModule from '../public/modules/timetable/index.js';
import { createOrganizationModule } from '../admin/modules/organization/index.js';

// The only place that registers business features. Legacy admin auth stays opt-in:
// server.js loads its entry point only when ENABLE_ADMIN_AUTH is enabled.
// Pass null to disable a module, or a test double to replace it in createApp().
export function createModuleRegistry({
  healthModule = defaultHealthModule,
  studentAuthModule = defaultStudentAuthModule,
  staffAuthModule = createStaffAuthModule(),
  studentServicesModule = createRequestsApiModule({channel:'student'}),
  staffServicesModule = createRequestsApiModule({channel:'staff'}),
  studentsModule = null,
  adminModule = null,
  usersModule = null,
  courseRegistrationModule = defaultCourseRegistrationModule,
  timetableModule = defaultTimetableModule,
  curriculumModule = defaultCurriculumModule,
  announcementsModule = defaultAnnouncementsModule,
  requestsModule = defaultRequestsModule,
  certificationsModule = defaultCertificationsModule,
  itCertificationsModule = defaultItCertificationsModule,
  academicLeaveModule = defaultAcademicLeaveModule,
  adminAuthModule,
  organizationModule = createOrganizationModule(),
} = {}) {
  return {
    healthModule,
    studentAuthModule,
    staffAuthModule,
    studentServicesModule,
    staffServicesModule,
    studentsModule,
    adminModule,
    usersModule,
    courseRegistrationModule,
    timetableModule,
    curriculumModule,
    announcementsModule,
    requestsModule,
    certificationsModule,
    itCertificationsModule,
    academicLeaveModule,
    adminAuthModule,
    organizationModule,
  };
}

// Retained for callers that need the flat list of enabled legacy modules.
export function createModules(options) {
  return Object.values(createModuleRegistry(options)).filter(Boolean);
}
