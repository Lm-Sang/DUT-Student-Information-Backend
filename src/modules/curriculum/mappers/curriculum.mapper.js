const text = (value) => typeof value === 'string' ? value.trim() : value ?? null;
const requirementTypes = { 0: 'previous', 1: 'prerequisite', 2: 'co-requisite', 3: 'supporting' };

/** @returns {import('../dto/curriculum.response.dto.js').AcademicProgramDto} */
export function toAcademicProgramDto(row) {
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

/** @returns {import('../dto/curriculum.response.dto.js').CurriculumCourseDto} */
export function toCurriculumCourseDto(row) {
  return {
    id: row.ID, courseId: text(row.MaHP), courseName: text(row.TenHP),
    courseShortName: text(row.KyHieu), credits: row.SoTC ?? null,
    semester: row.Hocky ?? null, semesterText: text(row.Kyhoc), order: row.STT ?? null,
    alternativeCourseId: text(row.MaHPTT), electiveFlag: row.Tuchon ?? null,
    preProjectFlag: row.HTDA ?? null, projectPrerequisiteFlag: row.TQDA ?? null,
    graduationProjectFlag: row.DATN ?? null, notes: text(row.Note),
    assessmentType: row.LoaiKT ?? null, assessmentGroup: text(row.NhomKT),
  };
}

/** @returns {import('../dto/curriculum.response.dto.js').CourseRequirementDto} */
export function toCourseRequirementDto(row) {
  return {
    id: row.ID, courseId: text(row.MaHP), requiredCourseId: text(row.MaHPdk),
    requiredCourseName: text(row.RequiredCourseName), sourceRequirementType: row.LoaiDK ?? null,
    type: requirementTypes[row.LoaiDK] ?? null,
    alternativeCondition: row.Hoac ?? null, notes: text(row.Ghichu),
  };
}
