import {legacyFunctions} from '../domain/rbac.js';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeDocuments, documentSnapshot, documentPeriod, schoolYears } from '../domain/document-rules.js';
import { parsePayload, supplementFields } from '../dto/requests.dto.js';
import { actionsFor, transition } from '../domain/request-rules.js';

const row = { ID: 1, IDCode: '2610', MaVanBan: '04', TenVanBan: 'Bảng điểm học kỳ', HieuLuc: 1,
  Caohoc: null, MaDVcap: '115', LePhiThuong: 15000, LePhiNhanh: 20000, KhongMienPhi: 0, SoLuongMien_Ngay: 2 };
const documentPayload = { documentCode: '04', periodTerm: '2610', academicYear: '', additionalInfo: '', quantity: 2, feeMode: 'PAID', serviceSpeed: 'NORMAL' };
const supportPayload = { supportCode: '3', issueCode: 'RESET_PASSWORD', description: 'Không đăng nhập được.', contactEmail: 'demo@example.test', ownershipConfirmed: true };

test('document catalog filters inactive/graduate rows, rejects ambiguous active keys and routes by issuer', () => {
  const documents = normalizeDocuments([row, { ...row, ID: 2, HieuLuc: 0 }, { ...row, ID: 3, Caohoc: 1 }]);
  assert.equal(documents.length, 1); assert.equal(documents[0].department, 'DT');
  assert.equal(normalizeDocuments([{ ...row, MaDVcap: '120' }])[0].department, 'CTSV');
  assert.throws(() => normalizeDocuments([row, { ...row, ID: 2 }]));
});

test('document quotes are computed from source fees and freeze both unit and total fee', () => {
  const document = normalizeDocuments([row])[0];
  assert.equal(documentSnapshot(document, documentPayload).totalFee, 30000);
  assert.equal(documentSnapshot(document, { ...documentPayload, serviceSpeed: 'RUSH' }).totalFee, 40000);
  assert.equal(documentSnapshot(document, { ...documentPayload, feeMode: 'FREE' }).totalFee, 0);
  assert.throws(() => documentSnapshot({ ...document, freeAllowed: false }, { ...documentPayload, feeMode: 'FREE' }));
  assert.throws(() => documentSnapshot({ ...document, normalFee: null }, documentPayload));
  assert.throws(() => documentSnapshot(document, { ...documentPayload, feeMode: 'FREE', quantity: 3 }));
});

test('document form validates quantity, correct transcript period and disallows client prices', () => {
  assert.equal(parsePayload('CONFIRMATION', documentPayload).quantity, 2);
  for (const quantity of [0, 21, 1.5, '2', null]) assert.throws(() => parsePayload('CONFIRMATION', { ...documentPayload, quantity }));
  assert.equal(parsePayload('CONFIRMATION', { ...documentPayload, periodTerm: '' }).documentCode,'04');
  assert.equal(parsePayload('CONFIRMATION', { ...documentPayload, documentCode: '05', academicYear: '' }).documentCode,'05');
  assert.throws(() => parsePayload('CONFIRMATION', { ...documentPayload, totalFee: 0 }));
  assert.throws(() => parsePayload('CONFIRMATION', { ...documentPayload, documentCode: '13', additionalInfo: '' }));
  assert.equal(documentPeriod('08'), 'TERM'); assert.equal(documentPeriod('09'), 'YEAR');
  assert.deepEqual(schoolYears([{ code: '2610' }, { code: '2620' }]), ['2026-2027']);
});

test('LMS accepts an empty request and derives the reset type and owner details on the server', () => {
  const payload = parsePayload('LMS_SUPPORT', {});
  assert.equal(payload.supportCode, '3'); assert.equal(payload.issueCode, 'RESET_PASSWORD');
  assert.equal(payload.contactEmail, ''); assert(payload.description);
  assert.deepEqual(parsePayload('LMS_SUPPORT'), payload);
  for (const input of [supportPayload, { issueCode: 'LOGIN_ERROR' }, { studentId: 'other' }, { newPassword: 'fake' }]) {
    assert.throws(() => parsePayload('LMS_SUPPORT', input));
  }
  assert.deepEqual(supplementFields('LMS_SUPPORT'), []);
  assert(!supplementFields('CONFIRMATION').includes('documentCode'));
});

test('LMS only receives and replies with a password, finishing immediately with no supplement step', () => {
  const student = { id: 'sv', role: 'STUDENT' }, staff = { id: 'it', role: 'STAFF', department: 'IT', permissions:[...legacyFunctions],workPermissions:['LMS_SUPPORT'] };
  const request = { typeCode: 'LMS_SUPPORT', studentId: 'sv', department: 'IT', status: 'SUBMITTED' };
  assert.deepEqual(actionsFor(staff, request), ['receive','cancel']);
  for (const status of ['RECEIVED','PROCESSING','NEEDS_INFO','EXTERNAL_PROCESSING']) {
    const received = { ...request, status, assignedStaffId: 'it' };
    assert.deepEqual(actionsFor(staff, received), ['result','cancel']);
    assert.deepEqual(actionsFor(student, received), ['cancel']);
    assert.throws(() => transition(staff, received, { action: 'result', message: '' }));
    assert.equal(transition(staff, received, { action: 'result', message: 'QA-FAKE-PASSWORD' }).status, 'COMPLETED');
    assert.deepEqual(actionsFor({ ...staff, id: 'other-it' }, received), []);
  }
  assert.deepEqual(actionsFor(staff, { ...request, status: 'COMPLETED' }), []);
});
