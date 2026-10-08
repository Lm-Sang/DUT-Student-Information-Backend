import { AppError } from '../../shared/errors/app-error.js';

const text = (value) => typeof value === 'string' ? value.trim() : value ?? null;
const requirementTypes = { 0: 'previous', 1: 'prerequisite', 2: 'co-requisite', 3: 'supporting' };

function programData(row) {
  return {
    id: text(row.MaNganh), name: text(row.TenNganh),
    facultyId: text(row.FacultyId), facultyName: text(row.FacultyName),
    majorCode: text(row.Kyhieu), majorName: text(row.MajorName), specialization: text(row.TenCN),
    educationLevelCode: text(row.CapDT), trainingLanguageCode: text(row.NgNguDT),
    semesters: row.SoHK ?? null, requiredCredits: row.SoTinChi ?? null,
    electiveCredits: row.Sotuchon ?? null,
    requiredCompulsoryCredits: row.SoTinChi == null || row.Sotuchon == null
      ? null : row.SoTinChi - row.Sotuchon,
    startDate: row.BatDau ?? null, endDate: row.KetThuc ?? null,
  };
}

async function readSource(operation) {
  try {
    return await operation();
  } catch {
    // SQL errors can include hostnames, account names and connection details.
    throw new AppError('Public curriculum data is temporarily unavailable.', 503);
  }
}

export function createCurriculumService(repository) {
  return {
    async listPrograms(filters) {
      const programs = await readSource(() => repository.listPrograms(filters));
      return programs.map(programData);
    },

    async getCurriculum(programId) {
      const source = await readSource(() => repository.getCurriculum(programId));
      if (!source) throw new AppError('Public academic program not found.', 404);
      const program = programData(source.program);
      const courses = source.courses.map((row) => ({
        id: row.ID, courseId: text(row.MaHP), courseName: text(row.TenHP),
        courseShortName: text(row.KyHieu), credits: row.SoTC ?? null,
        semester: row.Hocky ?? null, semesterText: text(row.Kyhoc), order: row.STT ?? null,
        alternativeCourseId: text(row.MaHPTT), electiveFlag: row.Tuchon ?? null,
        preProjectFlag: row.HTDA ?? null, projectPrerequisiteFlag: row.TQDA ?? null,
        graduationProjectFlag: row.DATN ?? null, notes: text(row.Note),
        assessmentType: row.LoaiKT ?? null, assessmentGroup: text(row.NhomKT),
      }));
      const requirements = source.requirements.map((row) => ({
        id: row.ID, courseId: text(row.MaHP), requiredCourseId: text(row.MaHPdk),
        requiredCourseName: text(row.RequiredCourseName), sourceRequirementType: row.LoaiDK ?? null,
        type: requirementTypes[row.LoaiDK] ?? null,
        alternativeCondition: row.Hoac ?? null, notes: text(row.Ghichu),
      }));
      const availableSemesters = [...new Set(courses.map((row) => row.semester)
        .filter((value) => Number.isInteger(value) && value > 0))].sort((a, b) => a - b);
      const expectedSemesters = Number.isInteger(program.semesters) && program.semesters > 0
        ? Array.from({ length: program.semesters }, (_, index) => index + 1) : [];
      const missingSemesters = expectedSemesters.filter((value) => !availableSemesters.includes(value));
      const rowsWithoutReplacement = courses.filter((row) => !row.alternativeCourseId).length;
      return {
        program,
        counts: {
          curriculumRows: courses.length, rowsWithoutReplacement,
          rowsWithReplacement: courses.length - rowsWithoutReplacement,
          requirementRows: requirements.length,
          missingCourseMetadata: courses.filter((row) => !row.courseName || row.credits == null).length,
          missingRequirementMetadata: requirements.filter((row) => !row.requiredCourseName).length,
        },
        coverage: {
          expectedSemesters: program.semesters, availableSemesters, missingSemesters,
          hasAllSemesters: expectedSemesters.length === 0 ? null : missingSemesters.length === 0,
        },
        courses, requirements,
      };
    },
  };
}
