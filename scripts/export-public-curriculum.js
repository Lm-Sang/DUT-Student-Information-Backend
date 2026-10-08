import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import sql from 'mssql';

import { connectDatabase, disconnectDatabases } from '../src/config/database.js';

// Read-only export of the public catalogue and every curriculum row, including
// replacement-course rows and requirements that are not displayed on the website.
const facultyCode = process.argv[2] ?? '102';
if (!/^\d{3}$/.test(facultyCode)) throw new Error('Faculty code must contain three digits.');
const outputPath = resolve(`docs/data/curriculum-faculty-${facultyCode}.json`);
const trim = (value) => typeof value === 'string' ? value.trim() : value;

async function selectByCodes(pool, statement, codes) {
  if (codes.length === 0) return [];
  const request = pool.request();
  const parameters = codes.map((code, index) => {
    request.input(`code${index}`, sql.NVarChar(20), code);
    return `@code${index}`;
  });
  return (await request.query(statement.replace('/* codes */', parameters.join(',')))).recordset;
}

try {
  const primary = await connectDatabase('primary', 'DHBK_CDS');
  const secondary = await connectDatabase('secondary', 'DATA_GVien1');
  const request = primary.request().input('facultyCode', sql.NVarChar(3), facultyCode);
  const result = await request.query(`
    SELECT MaNganh, TenNganh, Kyhieu, TenCN, SoTinChi, SoHK, Sotuchon,
           CapDT, NgNguDT, BatDau, KetThuc, PubWeb, InUse
    FROM dbo.tmNganh
    WHERE LEFT(MaNganh, 3) = @facultyCode AND CapDT = 'CD01' AND PubWeb = 1 AND InUse = 1
    ORDER BY MaNganh;

    SELECT ct.ID, ct.MaKhung, ct.MaHP, ct.MaHPTT, ct.Hocky, ct.Kyhoc, ct.STT,
           ct.Tuchon, ct.HTDA, ct.TQDA, ct.DATN, ct.Note, ct.LoaiKT, ct.NhomKT,
           hp.TenHP, hp.KyHieu, hp.SoTC
    FROM dbo.tmKhungCT ct
    JOIN dbo.tmNganh n ON n.MaNganh = ct.MaKhung
    LEFT JOIN dbo.tmHocPhan hp ON hp.MaHP = ct.MaHP
    WHERE LEFT(n.MaNganh, 3) = @facultyCode AND n.CapDT = 'CD01' AND n.PubWeb = 1 AND n.InUse = 1
    ORDER BY ct.MaKhung, ct.Hocky, ct.STT, ct.ID;

    SELECT dk.ID, dk.MaKhung, dk.MaHP, dk.MaHPdk, dk.LoaiDK, dk.Hoac, dk.Ghichu,
           hp.TenHP AS RequiredCourseName
    FROM dbo.tmHocphanDK dk
    JOIN dbo.tmNganh n ON n.MaNganh = dk.MaKhung
    LEFT JOIN dbo.tmHocPhan hp ON hp.MaHP = dk.MaHPdk
    WHERE LEFT(n.MaNganh, 3) = @facultyCode AND n.CapDT = 'CD01' AND n.PubWeb = 1 AND n.InUse = 1
    ORDER BY dk.MaKhung, dk.MaHP, dk.LoaiDK, dk.ID;

    SELECT MaDV, TenDV FROM dbo.DonVi WHERE MaDV = @facultyCode;
  `);
  const [programs, courses, requirements, faculties] = result.recordsets;
  const missingCourseCodes = [...new Set([
    ...courses.filter((course) => course.TenHP === null).map((course) => trim(course.MaHP)),
    ...requirements.filter((item) => item.RequiredCourseName === null).map((item) => trim(item.MaHPdk)),
  ].filter(Boolean))];
  const supplementalCourses = await selectByCodes(secondary,
    'SELECT MaHP, TenHP, KyHieu, SoTC FROM dbo.tmHocPhan WHERE MaHP IN (/* codes */);', missingCourseCodes);
  const supplementalPrograms = await selectByCodes(secondary,
    'SELECT MaNganh, BatDau, KetThuc FROM dbo.tmNganh WHERE MaNganh IN (/* codes */);',
    programs.filter((program) => !program.BatDau || !program.KetThuc).map((program) => trim(program.MaNganh)));
  const majors = await selectByCodes(secondary,
    "SELECT MaNganhQG, TenNganhQG FROM dbo.tmNganhQG WHERE CapDT = 'CD01' AND MaNganhQG IN (/* codes */);",
    [...new Set(programs.map((program) => trim(program.Kyhieu)).filter(Boolean))]);
  const courseLookup = new Map(supplementalCourses.map((course) => [trim(course.MaHP), course]));
  const programLookup = new Map(supplementalPrograms.map((program) => [trim(program.MaNganh), program]));
  const majorLookup = new Map(majors.map((major) => [trim(major.MaNganhQG), trim(major.TenNganhQG)]));
  const courseGroups = Map.groupBy(courses, (course) => trim(course.MaKhung));
  const requirementGroups = Map.groupBy(requirements, (item) => trim(item.MaKhung));
  const requirementTypes = { 0: 'previous', 1: 'prerequisite', 2: 'co-requisite', 3: 'supporting' };

  const data = programs.map((program) => {
    const id = trim(program.MaNganh);
    const supplementalProgram = programLookup.get(id);
    const programCourses = (courseGroups.get(id) ?? []).map((course) => {
      const supplemental = courseLookup.get(trim(course.MaHP));
      const courseMetadataSource = course.TenHP !== null ? 'DHBK_CDS' : supplemental ? 'DATA_GVien1' : null;
      return {
        id: course.ID, courseId: trim(course.MaHP),
        courseName: trim(course.TenHP ?? supplemental?.TenHP ?? null),
        courseShortName: trim(course.KyHieu ?? supplemental?.KyHieu ?? null),
        credits: course.SoTC ?? supplemental?.SoTC ?? null,
        semester: course.Hocky, semesterText: trim(course.Kyhoc), order: course.STT,
        alternativeCourseId: trim(course.MaHPTT), electiveFlag: course.Tuchon,
        preProjectFlag: course.HTDA, projectPrerequisiteFlag: course.TQDA,
        graduationProjectFlag: course.DATN, notes: trim(course.Note),
        assessmentType: course.LoaiKT, assessmentGroup: trim(course.NhomKT), courseMetadataSource,
      };
    });
    const programRequirements = (requirementGroups.get(id) ?? []).map((item) => ({
      id: item.ID, courseId: trim(item.MaHP), requiredCourseId: trim(item.MaHPdk),
      requiredCourseName: trim(item.RequiredCourseName ?? courseLookup.get(trim(item.MaHPdk))?.TenHP ?? null),
      sourceRequirementType: item.LoaiDK, type: requirementTypes[item.LoaiDK] ?? null,
      alternativeCondition: item.Hoac, notes: trim(item.Ghichu),
    }));
    const displayedCourses = programCourses.filter((course) => !course.alternativeCourseId);
    return {
      id, name: trim(program.TenNganh), facultyId: facultyCode,
      majorCode: trim(program.Kyhieu), majorName: majorLookup.get(trim(program.Kyhieu)) ?? null,
      specialization: trim(program.TenCN), educationLevelCode: trim(program.CapDT),
      trainingLanguageCode: trim(program.NgNguDT), semesters: program.SoHK,
      requiredCredits: program.SoTinChi, electiveCredits: program.Sotuchon,
      requiredCompulsoryCredits: program.SoTinChi === null || program.Sotuchon === null
        ? null : program.SoTinChi - program.Sotuchon,
      startDate: program.BatDau ?? supplementalProgram?.BatDau ?? null,
      endDate: program.KetThuc ?? supplementalProgram?.KetThuc ?? null,
      dateSupplementSource: supplementalProgram ? 'DATA_GVien1' : null,
      publicFlag: program.PubWeb, inUseFlag: program.InUse,
      counts: {
        curriculumRows: programCourses.length, rowsWithoutReplacement: displayedCourses.length,
        rowsWithReplacement: programCourses.length - displayedCourses.length,
        requirementRows: programRequirements.length,
        missingCourseMetadata: programCourses.filter((course) => course.courseName === null || course.credits === null).length,
      },
      courses: programCourses, requirements: programRequirements,
    };
  });
  const payload = {
    inspectedAt: new Date().toISOString(),
    sources: { programmesAndCurricula: 'DHBK_CDS', supplementalMetadata: 'DATA_GVien1' },
    filter: { facultyId: facultyCode, educationLevelCode: 'CD01', publicFlag: 1, inUseFlag: 1 },
    faculty: { id: facultyCode, name: trim(faculties[0]?.TenDV ?? null) },
    programCount: data.length, programs: data,
  };
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(payload, null, 2) + '\n');
  const cataloguePath = resolve(`docs/data/academic-programs-faculty-${facultyCode}.json`);
  writeFileSync(cataloguePath, JSON.stringify({
    ...payload,
    programs: data.map(({ courses: _courses, requirements: _requirements, ...program }) => program),
  }, null, 2) + '\n');
  console.log(JSON.stringify({
    outputPath, cataloguePath, programs: data.length,
    curriculumRows: data.reduce((sum, program) => sum + program.counts.curriculumRows, 0),
    requirementRows: data.reduce((sum, program) => sum + program.counts.requirementRows, 0),
    missingCourseMetadata: data.reduce((sum, program) => sum + program.counts.missingCourseMetadata, 0),
  }));
} finally {
  await disconnectDatabases();
}
