import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createStudentScheduleReader,
  examTime,
  mapStudentSchedule,
} from '../repositories/student-schedule.repository.js';

const row = {
  ID: 1,
  IDCode: '2610',
  MaHP: '1000001',
  MalopHP: 'CLASS-1',
  Manhom: 'B',
  CourseName: 'Học phần thật',
  TermRows: 1,
  TermName: 'Học kỳ 1',
  TermStart: new Date('2026-08-10Z'),
  FirstWeek: 1,
  PubLichThi: 1,
  ClassRows: 1,
  TKB: '1-3,A101;;;;;;',
  TuanHoc: '1-16',
  TuanCam: '7;9',
  ThiChung: 0,
  SeparateRows: 1,
  ExamDate: new Date('2026-12-21Z'),
  ExamTime: '13:00:00',
  ExamRoom: 'A102',
};

test('schedule keeps calendar anchors, study breaks and actual separate exam group', () => {
  const data = mapStudentSchedule('000000001', [row]);
  assert.equal(data.terms[0].startDate, '2026-08-10');
  assert.equal(data.terms[0].firstWeek, 1);
  assert.equal(data.classes[0].excludedWeeks, '7;9');
  assert.equal(data.classes[0].meetings[0].dayIndex, 0);
  assert.equal(data.exams[0].date, '2026-12-21');
  assert.equal(data.exams[0].time, '13:00');
  assert.equal(data.exams[0].room, 'A102');
  assert.equal(data.exams[0].group, 'B');
});
test('common exam uses the student-assigned session, personal room and seat; does not fall back to a class-wide date', () => {
  const data = mapStudentSchedule('000000001', [
    {
      ...row,
      ThiChung: 1,
      CommonRows: 1,
      CommonDate: new Date('2026-12-22Z'),
      CommonTime: '7h00',
      PersonalRoom: 'B201',
      STTthi: 12,
    },
  ]);
  assert.equal(data.exams[0].date, '2026-12-22');
  assert.equal(data.exams[0].time, '07:00');
  assert.equal(data.exams[0].room, 'B201');
  assert.equal(data.exams[0].seatNumber, 12);
  assert.equal(
    mapStudentSchedule('000000001', [{ ...row, ThiChung: 1, CommonRows: 0 }]).exams[0].status,
    'pending',
  );
});
test('unpublished, duplicate term/group/session or conflicting class metadata cannot expose a scheduled date', () => {
  for (const patch of [
    { PubLichThi: 0 },
    { PubLichThi: null },
    { TermRows: 2 },
    { SeparateRows: 2 },
    { ClassRows: 2 },
    { ThiChung: 1, CommonRows: 2 },
  ]) {
    const exam = mapStudentSchedule('000000001', [{ ...row, ...patch }]).exams[0];
    assert.equal(exam.date, null);
    assert.equal(exam.time, null);
    assert.equal(exam.room, null);
    assert.equal(exam.seatNumber, null);
  }
});
test('only owned, active, dated leave/makeup rows with valid periods enter the calendar', () => {
  const change = {
    ID: 1,
    IDCode: '2610',
    MaLopHP: 'CLASS-1',
    NgayNB: new Date('2026-11-02Z'),
    Loai: 1,
    TietDau: 2,
    TietCuoi: 3,
  };
  const data = mapStudentSchedule(
    '000000001',
    [row],
    [
      change,
      { ...change, ID: 2, Loai: 2 },
      { ...change, Huy: 1 },
      { ...change, NgayHuy: new Date() },
      { ...change, Loai: 9 },
      { ...change, MaLopHP: 'OTHER' },
      { ...change, IDCode: '2520' },
      { ...change, TietDau: 0 },
      { ...change, NgayNB: null },
    ],
    [{ ID: 8, MalopHP: 'CLASS-1', Ngay: new Date('2026-11-09Z'), NgayLe: 1 }],
  );
  assert.deepEqual(
    data.changes.map((c) => c.kind),
    ['cancel', 'makeup', 'holiday'],
  );
  assert.equal(data.changes[0].startPeriod, 2);
  assert.equal(data.changes[2].startPeriod, null);
});
test('school exam time formats normalize without inventing an hour', () => {
  for (const [input, expected] of [
    ['7h00', '07:00'],
    ['13:00:00', '13:00'],
    ['8h15', '08:15'],
    ['13h', '13:00'],
    ['25h00', null],
    ['7h90', null],
    ['2C1', null],
    ['', null],
  ])
    assert.equal(examTime(input), expected);
});
test('dated lessons exclude hidden bookings, exam bookings, makeup duplicates and other classes', () => {
  const actual = {
    ID: 1,
    MalopHP: 'CLASS-1',
    Ngay: new Date('2026-11-03Z'),
    TietDau: 6,
    TietCuoi: 8,
    Phong: 'Actual room',
  };
  const result = mapStudentSchedule(
    '000000001',
    [row],
    [],
    [],
    [
      actual,
      { ...actual, KoShow: 1 },
      { ...actual, LichThi: 1 },
      { ...actual, MaNB: 'B-TICKET' },
      { ...actual, NgayLe: 1 },
      { ...actual, MalopHP: 'OTHER' },
      { ...actual, TietCuoi: 99 },
    ],
  );
  assert.equal(result.datedMeetings.length, 1);
  assert.equal(result.datedMeetings[0].room, 'Actual room');
  assert.equal(result.datedMeetings[0].date, '2026-11-03');
});
test('SQL readers bind verified identity, use current data, and gate publication/group/assigned exam sessions', async () => {
  const calls = [];
  const read = createStudentScheduleReader({
    connect: async (account, database) => {
      assert(['secondary', 'primary'].includes(account));
      if (account === 'secondary') assert.equal(database, 'DATA_GVien1');
      return {
        request() {
          const params = {};
          const req = {
            input(name, _type, value) {
              params[name] = value;
              return req;
            },
            async query(statement) {
              assert(!/\b(INSERT|UPDATE|DELETE|MERGE|EXEC)\b/i.test(statement));
              calls.push({ params, statement });
              return {
                recordset: params.number
                  ? [{ MaHS: 'verified-id', SoTheSV: '000000001' }]
                  : statement.includes('AS CommonRows')
                    ? [row]
                    : [],
              };
            },
          };
          return req;
        },
      };
    },
  });
  assert.equal((await read('000000001', 'verified-id')).exams[0].status, 'scheduled');
  const statement = calls.find((c) => c.statement.includes('AS CommonRows')).statement;
  assert(statement.includes('k.PubLichThi=1'));
  assert(statement.includes("ISNULL(MaNhom,'')=ISNULL(d.Manhom,'')"));
  assert(statement.includes('ct.MaCa=d.MaCaThi'));
  assert(statement.includes('LopHP=d.MalopHP AND MaCaTong=ct.CaTong'));
  assert(
    calls
      .slice(1)
      .filter((c) => !c.statement.includes('tmPhongHocHT'))
      .every((c) => c.params.id === 'verified-id'),
  );
  const calendar = calls.find((c) => c.statement.includes('tmPhongHocHT'));
  assert.equal(calendar.params.class0, 'CLASS-1');
  assert(calendar.statement.includes('ISNULL(KoShow,0)=0'));
  assert(calendar.statement.includes('ISNULL(LichThi,0)=0'));
  await assert.rejects(read('000000001', 'wrong-id'), (error) => error.statusCode === 409);
});
