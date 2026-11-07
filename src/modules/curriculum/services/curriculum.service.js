import { AppError } from '../../../shared/errors/app-error.js';

import { createCurriculumResponseDto } from '../dto/curriculum.response.dto.js';
import { toAcademicProgramDto, toCurriculumCourseDto, toCourseRequirementDto } from '../mappers/curriculum.mapper.js';

async function readSource(operation, message='Public curriculum data is temporarily unavailable.') {
  try {
    return await operation();
  } catch {
    // SQL errors can include hostnames, account names and connection details.
    throw new AppError(message, 503);
  }
}

export function createCurriculumService(repository) {
  return {
    listFaculties: () => readSource(() => repository.listFaculties()),
    async listPrograms(filters) {
      const programs = await readSource(() => repository.listPrograms(filters));
      return programs.map(toAcademicProgramDto);
    },

    async getCurriculum(programId, {publicOnly=true}={}) {
      const source = await readSource(() => repository.getCurriculum(programId,{publicOnly}),publicOnly?undefined:'Chưa đọc được khung chương trình từ dữ liệu trường. Vui lòng thử lại.');
      if (!source) throw new AppError(publicOnly?'Public academic program not found.':'Chưa có khung chương trình của ngành hiện hành trong dữ liệu trường.', 404);
      const program = toAcademicProgramDto(source.program);
      const courses = source.courses.map(toCurriculumCourseDto);
      const requirements = source.requirements.map(toCourseRequirementDto);
      const availableSemesters = [...new Set(courses.map((row) => row.semester)
        .filter((value) => Number.isInteger(value) && value > 0))].sort((a, b) => a - b);
      const expectedSemesters = Number.isInteger(program.semesters) && program.semesters > 0
        ? Array.from({ length: program.semesters }, (_, index) => index + 1) : [];
      const missingSemesters = expectedSemesters.filter((value) => !availableSemesters.includes(value));
      const rowsWithoutReplacement = courses.filter((row) => !row.alternativeCourseId).length;
      return createCurriculumResponseDto({
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
      });
    },
  };
}
