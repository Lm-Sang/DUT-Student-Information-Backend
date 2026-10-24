import assert from 'node:assert/strict';
import { test } from 'node:test';

import { toAcademicProgramDto, toCurriculumCourseDto, toCourseRequirementDto } from '../mappers/curriculum.mapper.js';

test('curriculum response DTOs omit source-only fields while retaining zero and null values', () => {
  const raw = Object.freeze({
    ID: 1, MaNganh: '1024045 ', MaHP: '1020001 ', MaHPdk: '1020002 ',
    SoTinChi: 0, Sotuchon: 0, SoTC: 0, Hocky: 0, LoaiDK: 0, Hoac: 0,
    InUse: 1, PubWeb: 1, internalAuditData: 'private',
  });
  const program = toAcademicProgramDto(raw);
  const course = toCurriculumCourseDto(raw);
  const requirement = toCourseRequirementDto(raw);
  assert.equal(program.requiredCompulsoryCredits, 0);
  assert.equal(program.startDate, null);
  assert.equal(course.credits, 0);
  assert.equal(course.semester, 0);
  assert.equal(requirement.sourceRequirementType, 0);
  assert.equal(requirement.alternativeCondition, 0);
  for (const dto of [program, course, requirement]) {
    for (const field of ['InUse', 'PubWeb', 'internalAuditData', 'MaNganh', 'MaHPdk']) {
      assert.ok(!Object.hasOwn(dto, field));
    }
  }
  assert.equal(raw.MaNganh, '1024045 ');
});
