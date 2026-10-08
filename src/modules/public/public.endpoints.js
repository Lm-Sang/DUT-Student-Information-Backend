const text = { type: 'text' };
const identifier = { type: 'identifier' };
const integer = { type: 'integer' };
const boolean = { type: 'boolean' };
const semester = { type: 'integer', values: [1, 2, 3, 10, 20, 21] };
const academicYear = { type: 'text', maxLength: 32 };
const paging = {
  page: { ...integer, default: 1 },
  pageSize: { ...integer, max: 100, default: 20 },
};

function course(path, upstreamPath, options = {}) {
  return Object.freeze({ source: 'course-registration', path: `/course-registration${path}`, upstreamPath, ...options });
}
function tkb(path, upstreamPath, options = {}) {
  return Object.freeze({ source: 'tkb', path: `/tkb${path}`, upstreamPath, ...options });
}

// Register only implemented GET actions for academic catalogs and timetables.
// Route order keeps literal paths ahead of dynamic IDs.
export const publicEndpoints = Object.freeze([
  course('/faculties', '/api/Faculties'),
  course('/faculties/:facultyId', '/api/Faculties/:facultyId', { params: { facultyId: identifier } }),
  course('/majors', '/api/Majors'),
  course('/majors/:majorId', '/api/Majors/:majorId', { params: { majorId: identifier } }),
  course('/lecturers', '/api/Lecturers', { query: { facultyId: identifier } }),
  course('/classes', '/api/Classes'),
  course('/academic-programs', '/api/AcademicPrograms'),
  course('/academic-programs/paged', '/api/AcademicPrograms/paged', {
    query: {
      facultyId: identifier, educationLevel: text, keyword: text,
      pageIndex: { ...integer, default: 1 }, pageSize: { ...integer, max: 100, default: 20 },
      sortBy: text, sortDescending: boolean,
    },
  }),
  course('/academic-programs/:programId', '/api/AcademicPrograms/:programId', { params: { programId: identifier } }),
  course('/semesters', '/api/Semesters'),
  course('/semesters/:semesterId', '/api/Semesters/:semesterId', { params: { semesterId: identifier } }),
  course('/course-sections', '/api/CourseSections', {
    query: { facultyId: identifier, academicYearCode: { type: 'semester-code', required: true } },
  }),
  course('/registration-phases/current-semester', '/api/RegistrationPhase/current-semester', {
    query: { facultyId: identifier, cohort: identifier },
  }),
  course('/settings/registration-phase', '/api/Settings/courseRegistrationPhase'),
  course('/settings/title', '/api/Settings/title'),
  course('/settings/current-semester-code', '/api/StudentGrades/currentSemesterCode'),

  tkb('/faculties', '/api/Faculty', {
    query: { keyword: text, page: integer, pageSize: { ...integer, max: 100 } },
  }),
  tkb('/faculties/:facultyId', '/api/Faculty/:facultyId', { params: { facultyId: integer } }),
  tkb('/lecturers', '/api/Lecturer', { query: { ...paging, keyword: text, lecturerId: integer } }),
  tkb('/course-sections', '/api/CourseSection', {
    query: { ...paging, keyword: text, lecturerId: integer, facultyId: integer },
  }),
  tkb('/course-sections/:courseId', '/api/CourseSection/:courseId', { params: { courseId: identifier } }),
  tkb('/classrooms', '/api/Classroom', { query: { ...paging, roomId: identifier, keyword: text } }),
  tkb('/classrooms/building', '/api/Classroom/building', { query: { building: { ...identifier, required: true } } }),
  tkb('/classrooms/suggest', '/api/Classroom/suggest', {
    query: { building: { ...identifier, required: true }, capacity: { ...integer, max: 10000, required: true } },
  }),
  tkb('/lookup/course-section-form', '/api/Lookup/course-section-form'),
  tkb('/schedules', '/api/Schedule', {
    query: { lecturerId: integer, academicYear, semester, week: text, onlyScheduled: boolean },
  }),
  tkb('/schedules/semester-stats', '/api/Schedule/semester-stats'),
  tkb('/schedules/pending-room-assignments', '/api/Schedule/pending-room-assignments', {
    query: { academicYear: { ...academicYear, required: true }, semester: { ...semester, required: true } },
  }),
  tkb('/schedules/history', '/api/Schedule/history', { query: { academicYear, semester, week: text } }),
  tkb('/schedules/batch/:batchId', '/api/Schedule/batch/:batchId', { params: { batchId: { type: 'guid' } } }),
  tkb('/schedules/lecturer/:lecturerId', '/api/Schedule/lecturer/:lecturerId', {
    params: { lecturerId: integer }, query: { academicYear, semester, week: text, onlyScheduled: boolean },
  }),
  tkb('/schedules/:timetableId/room-candidates', '/api/Schedule/:timetableId/room-candidates', {
    params: { timetableId: integer },
  }),
  tkb('/schedules/:timetableId', '/api/Schedule/:timetableId', { params: { timetableId: integer } }),
  tkb('/dashboard/stats', '/api/Dashboard/stats'),
  tkb('/dashboard/rooms-by-building', '/api/Dashboard/rooms-by-building'),
  tkb('/dashboard/course-sections-by-building', '/api/Dashboard/course-sections-by-building'),
  tkb('/dashboard/room-usage-by-day', '/api/Dashboard/room-usage-by-day', { query: { semester, academicYear } }),
  tkb('/dashboard/schedule-conflicts', '/api/Dashboard/schedule-conflicts', { query: { semester, academicYear } }),
  tkb('/system-config', '/api/SystemConfig'),
]);
