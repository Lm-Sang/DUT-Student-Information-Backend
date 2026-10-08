import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { test } from 'node:test';

import { createApp } from '../src/app.js';
import { createCurriculumModule } from '../src/modules/curriculum/index.js';
import { createCurriculumRepository } from '../src/modules/curriculum/curriculum.repository.js';

const program = {
  MaNganh: '1024045 ', TenNganh: 'An toàn thông tin trên không gian số K2026 ',
  FacultyId: '102', FacultyName: 'K. Công nghệ Thông tin ', Kyhieu: '7480201 ',
  MajorName: 'Công nghệ thông tin ', TenCN: '', CapDT: 'CD01  ', NgNguDT: 'ND01 ',
  SoHK: 9, SoTinChi: 150, Sotuchon: 0, BatDau: null, KetThuc: null,
};
const course = {
  ID: 1, MaHP: '1025060 ', TenHP: 'Kỹ thuật lập trình ', KyHieu: '', SoTC: 3,
  Hocky: 1, Kyhoc: '1 ', STT: 1, MaHPTT: '', Tuchon: null, HTDA: null, TQDA: 0,
  DATN: null, Note: '', LoaiKT: null, NhomKT: null,
};

async function fixture(t, overrides = {}) {
  const calls = [];
  const repository = {
    listPrograms: async (filters) => { calls.push(filters); return [program]; },
    getCurriculum: async (id) => {
      calls.push(id);
      return { program, courses: [course], requirements: [] };
    },
    ...overrides,
  };
  const server = createServer(createApp({ curriculumModule: createCurriculumModule({ repository }) }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => {
    await new Promise((resolve) => {
      server.close(resolve);
      server.closeAllConnections();
    });
  });
  return { base: `http://127.0.0.1:${server.address().port}/api/public`, calls };
}

test('public program list accepts no authentication and preserves required credits and null dates', async (t) => {
  const { base, calls } = await fixture(t);
  const response = await fetch(`${base}/academic-programs?facultyId=102`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const body = await response.json();
  assert.equal(body.success, true);
  assert.equal(body.data[0].id, '1024045');
  assert.equal(body.data[0].name, program.TenNganh.trim());
  assert.equal(body.data[0].facultyName, 'K. Công nghệ Thông tin');
  assert.equal(body.data[0].majorCode, '7480201');
  assert.equal(body.data[0].educationLevelCode, 'CD01');
  assert.equal(body.data[0].requiredCompulsoryCredits, 150);
  assert.equal(body.data[0].electiveCredits, 0);
  assert.equal(body.data[0].startDate, null);
  assert.deepEqual(calls, [{ facultyId: '102', educationLevelCode: 'CD01' }]);
});

test('curriculum retains replacement rows, all dependency types, OR data and incomplete semester coverage', async (t) => {
  const requirements = [0, 1, 2, 3, 8].map((type) => ({
    ID: type + 1, MaHP: course.MaHP, MaHPdk: '3190320 ', LoaiDK: type,
    RequiredCourseName: 'Giải tích ', Hoac: type === 1 ? 1 : null, Ghichu: 'Điều kiện ',
  }));
  const { base } = await fixture(t, {
    getCurriculum: async () => ({
      program,
      courses: [course, { ...course, ID: 2, MaHP: '1025070', Hocky: 2, MaHPTT: '1025060 ' }],
      requirements,
    }),
  });
  const response = await fetch(`${base}/academic-programs/1024045/curriculum`);
  assert.equal(response.status, 200);
  const { data } = await response.json();
  assert.deepEqual(data.counts, {
    curriculumRows: 2, rowsWithoutReplacement: 1, rowsWithReplacement: 1,
    requirementRows: 5, missingCourseMetadata: 0, missingRequirementMetadata: 0,
  });
  assert.deepEqual(data.coverage, {
    expectedSemesters: 9, availableSemesters: [1, 2], missingSemesters: [3, 4, 5, 6, 7, 8, 9],
    hasAllSemesters: false,
  });
  assert.equal(data.courses[1].alternativeCourseId, '1025060');
  assert.equal(data.courses[0].electiveFlag, null);
  assert.equal(data.courses[0].projectPrerequisiteFlag, 0);
  assert.deepEqual(data.requirements.map((item) => item.type),
    ['previous', 'prerequisite', 'co-requisite', 'supporting', null]);
  assert.equal(data.requirements[4].sourceRequirementType, 8);
  assert.equal(data.requirements[1].alternativeCondition, 1);
  assert.equal(data.requirements[0].alternativeCondition, null);
});

test('unknown or nonpublic programs return 404 and an empty faculty returns an empty list', async (t) => {
  const { base } = await fixture(t, {
    getCurriculum: async () => null,
    listPrograms: async () => [],
  });
  const missing = await fetch(`${base}/academic-programs/9999999/curriculum`);
  assert.equal(missing.status, 404);
  assert.deepEqual(await missing.json(), { success: false, message: 'Public academic program not found.' });
  const empty = await fetch(`${base}/academic-programs?facultyId=999&educationLevelCode=CD02`);
  assert.equal(empty.status, 200);
  assert.deepEqual(await empty.json(), { success: true, data: [] });
});

test('invalid and repeated filters, unknown query keys and mutation requests never reach SQL', async (t) => {
  const { base, calls } = await fixture(t);
  const invalidPaths = [
    '/academic-programs', '/academic-programs?facultyId=',
    '/academic-programs?facultyId=102&facultyId=101', '/academic-programs?facultyId=1021',
    '/academic-programs?facultyId=102&educationLevelCode=',
    '/academic-programs?facultyId=102&educationLevelCode=CD01&educationLevelCode=CD02',
    '/academic-programs?facultyId=102&includePrivate=true',
    '/academic-programs?facultyId=102%27%3BSELECT%201',
    '/academic-programs/7480201x/curriculum', '/academic-programs/1024045/curriculum?semester=1',
  ];
  for (const path of invalidPaths) {
    const response = await fetch(`${base}${path}`);
    assert.equal(response.status, 400, path);
    assert.equal((await response.json()).success, false);
  }
  const mutation = await fetch(`${base}/academic-programs/1024045/curriculum`, { method: 'POST' });
  assert.equal(mutation.status, 404);
  assert.deepEqual(calls, []);
});

test('database failures return sanitized 503 responses', async (t) => {
  const fail = async () => { throw new Error('SQL password=SECRET; server=PRIVATE-HOST; query=SELECT'); };
  const { base } = await fixture(t, { listPrograms: fail, getCurriculum: fail });
  for (const path of ['/academic-programs?facultyId=102', '/academic-programs/1024045/curriculum']) {
    const response = await fetch(`${base}${path}`);
    assert.equal(response.status, 503);
    assert.deepEqual(await response.json(), {
      success: false, message: 'Public curriculum data is temporarily unavailable.',
    });
  }
});

function poolFixture(handler, calls) {
  return {
    request() {
      const inputs = {};
      return {
        input(name, _type, value) { inputs[name] = value; return this; },
        async query(statement) {
          calls.push({ statement, inputs });
          return handler(statement, inputs);
        },
      };
    },
  };
}

test('SQL repository enforces public scope and supplements metadata without replacing curriculum rows', async () => {
  const primaryCalls = [];
  const secondaryCalls = [];
  const connectionCalls = [];
  const primary = poolFixture(() => ({ recordsets: [
    [{ ...program, MajorName: undefined }],
    [
      { ...course, TenHP: null, SoTC: null },
      { ...course, ID: 2, KyHieu: null, SoTC: 0, TenHP: 'Primary course name' },
      { ...course, ID: 3, MaHP: '9999999', TenHP: null, SoTC: null },
    ],
    [{ ID: 1, MaHP: '1025060', MaHPdk: '3190320', RequiredCourseName: null, LoaiDK: 0 }],
  ] }), primaryCalls);
  const secondary = poolFixture((statement, inputs) => {
    assert.ok(!statement.includes('1024045'), 'Program code must be bound as a parameter.');
    if (statement.includes('dbo.tmHocPhan')) {
      assert.deepEqual(Object.values(inputs).sort(), ['1025060', '3190320', '9999999']);
      return { recordset: [
        { MaHP: '1025060 ', TenHP: 'Supplemental course name', KyHieu: 'KTLT', SoTC: 3 },
        { MaHP: '3190320', TenHP: 'Giải tích', KyHieu: 'GT', SoTC: 4 },
      ] };
    }
    if (statement.includes('dbo.tmNganhQG')) {
      assert.equal(inputs.educationLevelCode, 'CD01');
      assert.equal(inputs.code0, '7480201');
      return { recordset: [{ MaNganhQG: '7480201 ', TenNganhQG: 'Công nghệ thông tin' }] };
    }
    assert.equal(inputs.code0, '1024045');
    return { recordset: [{ MaNganh: '1024045', BatDau: '2026-08-25', KetThuc: '2031-01-01' }] };
  }, secondaryCalls);
  const repository = createCurriculumRepository({
    database: { primaryDatabase: 'DHBK_CDS', metadataDatabase: 'DATA_GVien1' },
    connect: async (account, database) => {
      connectionCalls.push({ account, database });
      return account === 'primary' ? primary : secondary;
    },
  });
  assert.equal(connectionCalls.length, 0, 'Importing/building the module must not connect to SQL.');
  const [first, second] = await Promise.all([
    repository.getCurriculum('1024045'), repository.getCurriculum('1024045'),
  ]);
  assert.deepEqual(first, second);
  assert.deepEqual(connectionCalls, [
    { account: 'primary', database: 'DHBK_CDS' },
    { account: 'secondary', database: 'DATA_GVien1' },
  ]);
  assert.equal(first.program.BatDau, '2026-08-25');
  assert.equal(first.program.MajorName, 'Công nghệ thông tin');
  assert.equal(first.courses.length, 3);
  assert.equal(first.courses[0].TenHP, 'Supplemental course name');
  assert.equal(first.courses[0].SoTC, 3);
  assert.equal(first.courses[1].TenHP, 'Primary course name');
  assert.equal(first.courses[1].SoTC, 0, 'A valid zero credit value must not be replaced.');
  assert.equal(first.courses[2].TenHP, null, 'Do not drop courses absent from both catalogs.');
  assert.equal(first.requirements[0].RequiredCourseName, 'Giải tích');
  for (const call of primaryCalls) {
    assert.deepEqual(call.inputs, { programId: '1024045' });
    assert.equal((call.statement.match(/n\.PubWeb = 1 AND n\.InUse = 1/g) ?? []).length, 3);
    assert.match(call.statement, /LEFT JOIN dbo\.tmHocPhan/);
    assert.ok(!call.statement.includes('1024045'));
    assert.ok(!/DELETE|UPDATE|INSERT|\bEXEC\b/i.test(call.statement));
  }
  assert.equal(secondaryCalls.length, 6);
});

test('SQL list uses bound faculty and education filters; unpublished detail cannot leak orphan rows', async () => {
  const calls = [];
  const secondaryCalls = [];
  const repository = createCurriculumRepository({
    connect: async (account) => account === 'primary'
      ? poolFixture((statement) => statement.includes('dbo.tmKhungCT')
        ? { recordsets: [[], [course], []] } : { recordset: [] }, calls)
      : poolFixture(() => { throw new Error('Unexpected supplemental query'); }, secondaryCalls),
  });
  assert.deepEqual(await repository.listPrograms({ facultyId: '101', educationLevelCode: 'CD02' }), []);
  assert.equal(await repository.getCurriculum('9999999'), null);
  assert.deepEqual(calls[0].inputs, { facultyId: '101', educationLevelCode: 'CD02' });
  assert.match(calls[0].statement, /n\.CapDT = @educationLevelCode/);
  assert.match(calls[0].statement, /n\.PubWeb = 1 AND n\.InUse = 1/);
  assert.deepEqual(secondaryCalls, []);
});

test('a failed initial SQL connection can be retried', async () => {
  let attempts = 0;
  const pool = poolFixture(() => ({ recordset: [] }), []);
  const repository = createCurriculumRepository({
    connect: async () => {
      if (++attempts === 1) throw new Error('Temporary connection failure');
      return pool;
    },
  });
  const filters = { facultyId: '102', educationLevelCode: 'CD01' };
  await assert.rejects(repository.listPrograms(filters), /Temporary connection failure/);
  assert.deepEqual(await repository.listPrograms(filters), []);
  assert.equal(attempts, 3);
});
