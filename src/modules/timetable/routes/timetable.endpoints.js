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

function tkb(path, upstreamPath, options = {}) {
  return Object.freeze({ source: 'tkb', path, upstreamPath, ...options });
}

// Keep literal paths before dynamic IDs. The public URL prefix remains /api/public/tkb.
export const timetableEndpoints = Object.freeze([
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
