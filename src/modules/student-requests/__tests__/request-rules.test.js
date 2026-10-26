import assert from 'node:assert/strict';
import { test } from 'node:test';
import { actionsFor, canRead, transition, visibleTerms, paperRequestCodes, requestTypes } from '../domain/request-rules.js';
import { parseCommand, parseCreate, parsePayload } from '../dto/requests.dto.js';
import { assertLocalDemoTarget } from '../../../infrastructure/database/local-write-guard.js';

const student = { id: 'sv-a', role: 'STUDENT' };
const staff = { id: 'cv-a', role: 'STAFF', department: 'CTSV' };
const request = { typeCode: 'CONFIRMATION', studentId: 'sv-a', department: 'CTSV', status: 'SUBMITTED', assignedStaffId: null };

test('six paper petitions require reception before specialist processing and expose ready templates', () => {
  assert.equal(requestTypes.filter(type => type.group === 'PETITION').length, 6);
  for (const typeCode of paperRequestCodes) {
    const paper = { ...request, typeCode };
    assert.deepEqual(actionsFor(staff, paper), ['receive', 'cancel']);
    assert.equal(transition(staff, paper, { action: 'receive' }).status, 'RECEIVED');
    assert.throws(() => transition(staff, paper, { action: 'complete' }), error => error.statusCode === 403);
    assert.deepEqual(actionsFor(student, paper), ['cancel']);
    for (const action of ['requestInfo', 'external', 'result', 'supplement']) {
      assert.throws(() => transition(staff, paper, { action, message: 'test', requiredFields: ['reasonCode'] }), error => error.statusCode === 403);
    }
    for (const status of ['RECEIVED', 'NEEDS_INFO', 'EXTERNAL_PROCESSING', 'READY']) {
      assert.deepEqual(actionsFor(staff, { ...paper, status, printedAt:'server-time' }), ['complete', 'cancel']);
      assert.equal(transition(staff, { ...paper, status, printedAt:'server-time' }, { action: 'complete' }).status, 'COMPLETED');
    }
    assert.equal(requestTypes.find(type => type.code === typeCode).formTemplateStatus, 'READY');
  }
  assert.equal(requestTypes.find(type => type.code === 'CONFIRMATION').submissionMode, 'WEB');
});

test('semester dropdown keeps the current selection and includes exactly one following semester', () => {
  const terms = [
    { code: '2610', sortOrder: 261, selectable: true }, { code: '2620', sortOrder: 262, selectable: false },
    { code: '2621', sortOrder: 263, selectable: true }, { code: '2710', sortOrder: 271, selectable: true },
    { code: '2520', sortOrder: 252, selectable: true },
  ];
  assert.deepEqual(visibleTerms(terms, '2610').map(t => t.code), ['2520', '2610', '2620']);
  assert.equal(visibleTerms(terms, '2610').find(t => t.isCurrent).code, '2610');
  assert.equal(visibleTerms(terms, '2620').find(t => t.isNext).code, '2621');
  assert.equal(visibleTerms(terms, '2621').find(t => t.isNext).code, '2710');
  assert.throws(() => visibleTerms(terms, '9999'), error => error.statusCode === 503);
});

test('only owner students and specialists of the responsible department can read', () => {
  assert.equal(canRead(student, request), true);
  assert.equal(canRead({ ...student, id: 'sv-b' }, request), false);
  assert.equal(canRead(staff, request), true);
  assert.equal(canRead({ ...staff, department: 'DT' }, request), false);
  assert.equal(canRead({ ...staff, role: 'ADMIN' }, request), false);
});

test('student cancellation needs no reason; specialist cancellation requires public feedback', () => {
  assert.equal(transition(student, request, { action: 'cancel', message: 'Đã nhập sai.' }).eventType, 'CANCELLED_BY_STUDENT');
  assert.equal(transition(staff, request, { action: 'cancel', message: 'Hồ sơ trùng.' }).eventType, 'CANCELLED_BY_STAFF');
  assert.equal(transition(student, request, { action: 'cancel' }).message,'Sinh viên đã hủy đơn.');
  assert.throws(() => transition(staff, request, { action: 'cancel' }), error => error.statusCode === 400);
  assert.deepEqual(actionsFor(staff, { ...request, status: 'CANCELLED' }), []);
  assert.deepEqual(actionsFor(student, { ...request, status: 'COMPLETED' }), []);
  for (const status of ['RECEIVED', 'PROCESSING', 'NEEDS_INFO']) {
    assert(actionsFor(student, { ...request, status }).includes('cancel'));
  }
  assert(actionsFor(student, { ...request, status: 'EXTERNAL_PROCESSING' }).includes('cancel'));
});

test('specialists cannot work another specialist assignment; admins have no processing actions', () => {
  assert.deepEqual(actionsFor(staff, { ...request, assignedStaffId: 'cv-other' }), []);
  assert.deepEqual(actionsFor({ ...staff, role: 'ADMIN' }, request), []);
  assert.equal(transition(staff, request, { action: 'receive' }).status, 'RECEIVED');
  assert.throws(() => transition(student, request, { action: 'receive' }), error => error.statusCode === 403);
});

test('confirmation processing is terminal and legacy extra steps cannot be invoked', () => {
  const active = { ...request, status: 'PROCESSING', assignedStaffId: staff.id, printedAt: '2026-10-25T00:00:00Z' };
  for(const action of ['start','requestInfo','external'])assert.throws(()=>transition(staff,active,{action,message:'Legacy step',requiredFields:['additionalInfo']}),e=>e.statusCode===403);
  assert.equal(transition(staff, active, { action: 'result', message: 'Có kết quả trả tại một cửa.' }).status, 'COMPLETED');
  assert.throws(() => transition(staff, active, { action: 'complete' }), error => error.statusCode === 403);
  assert.deepEqual(actionsFor(staff,{...active,status:'COMPLETED'}),[]);
  assert.deepEqual(actionsFor(staff,{...active,status:'READY'}),[]);
});

test('card information changes require content; lost/damaged does not retain hidden change text', () => {
  assert.throws(() => parsePayload('DonSV01', { reasonCode: 'CHANGE_INFO', changeDescription: '  ' }), error => error.statusCode === 400);
  assert.equal(parsePayload('DonSV01', { reasonCode: 'LOST_OR_DAMAGED', changeDescription: 'injected hidden field' }).changeDescription, '');
  assert.throws(() => parsePayload('DonSV01', { reasonCode: 'LOST_OR_DAMAGED', status: 'COMPLETED' }), error => error.statusCode === 400);
});

test('commands reject signature/approval actions, impersonation fields and invalid versions', () => {
  assert.throws(() => parseCommand({ action: 'approve', version: 1, idempotencyKey: 'a' }), error => error.statusCode === 400);
  assert.throws(() => parseCommand({ action: 'cancel', version: 1, idempotencyKey: 'a', role: 'STAFF' }), error => error.statusCode === 400);
  assert.throws(() => parseCommand({ action: 'cancel', version: 0, idempotencyKey: 'a' }), error => error.statusCode === 400);
  assert.throws(() => parseCreate({ typeCode: 'DonSV03', payload: { expectedTerm: '2610' }, idempotencyKey: 'a', studentId: 'other' }), error => error.statusCode === 400);
});

test('local write guard rejects SSH targets, other databases and instance-like host strings', () => {
  assert.doesNotThrow(() => assertLocalDemoTarget({ host: 'localhost', name: 'sv_dut' }));
  for (const config of [{ host: 'school-server', name: 'sv_dut' }, { host: 'localhost', name: 'DATA_SV1' }, { host: 'localhost,1234', name: 'sv_dut' }]) {
    assert.throws(() => assertLocalDemoTarget(config));
  }
});
