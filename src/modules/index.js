import defaultAdminModule from './admin/index.js';
import defaultAnnouncementsModule from './announcements/index.js';
import { studentAuthModule as defaultStudentAuthModule } from './auth/index.js';
import defaultCourseRegistrationModule from './course-registration/index.js';
import defaultCurriculumModule from './curriculum/index.js';
import defaultHealthModule from './health/index.js';
import defaultStudentsModule from './students/index.js';
import defaultRequestsModule from './student-requests/index.js';
import defaultTimetableModule from './timetable/index.js';
import defaultUsersModule from './users/index.js';

// The only place that registers business features. Admin SSO stays opt-in:
// server.js loads its entry point only when ENABLE_ADMIN_AUTH is enabled.
// Pass null to disable a module, or a test double to replace it in createApp().
export function createModules({
  healthModule = defaultHealthModule,
  studentAuthModule = defaultStudentAuthModule,
  studentsModule = defaultStudentsModule,
  adminModule = defaultAdminModule,
  usersModule = defaultUsersModule,
  courseRegistrationModule = defaultCourseRegistrationModule,
  timetableModule = defaultTimetableModule,
  curriculumModule = defaultCurriculumModule,
  announcementsModule = defaultAnnouncementsModule,
  requestsModule = defaultRequestsModule,
  adminAuthModule,
} = {}) {
  return [
    healthModule,
    studentAuthModule,
    studentsModule,
    adminModule,
    usersModule,
    courseRegistrationModule,
    timetableModule,
    curriculumModule,
    announcementsModule,
    requestsModule,
    adminAuthModule,
  ].filter(Boolean);
}
