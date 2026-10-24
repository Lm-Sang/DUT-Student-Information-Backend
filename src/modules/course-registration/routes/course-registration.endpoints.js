const text = { type: 'text' };
const identifier = { type: 'identifier' };
const integer = { type: 'integer' };
const boolean = { type: 'boolean' };

function course(path, upstreamPath, options = {}) {
  return Object.freeze({ source: 'course-registration', path, upstreamPath, ...options });
}

// Keep literal paths before dynamic IDs. These paths are relative to the module basePath.
export const courseRegistrationEndpoints = Object.freeze([
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
]);
