import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cancellationFeedback, confirmationAppointment } from '../domain/staff-workflow.js';
import { parseCommand } from '../dto/requests.dto.js';
import { requestDto } from '../mappers/requests.mapper.js';

test('appointments retain the first printing time and add three calendar days across weekends and year boundaries', () => {
  for (const [processed, pickup] of [
    ['2026-10-30T10:30:00+07:00', '2026-11-02T03:30:00.000Z'],
    ['2026-12-31T18:45:00+07:00', '2027-01-03T11:45:00.000Z'],
    ['2028-02-28T18:45:00+07:00', '2028-03-02T11:45:00.000Z'],
  ]) {
    const appointment = confirmationAppointment(processed);
    assert.equal(appointment.pickupAt, pickup);
    assert.equal(new Date(appointment.pickupAt) - new Date(appointment.printedAt), 259200000);
    assert.equal(appointment.pickupLocation, 'Khu Hành chính một cửa');
  }
});

test('specialists can cancel by preset alone, free text alone or preset with extra feedback', () => {
  const staff = { role: 'STAFF' };
  assert.equal(cancellationFeedback(staff, { action: 'cancel', message: 'Lý do tự nhập.' }).message, 'Lý do tự nhập.');
  assert.equal(cancellationFeedback(staff, { action: 'cancel', cancelReasonCode: 'DUPLICATE' }).message, 'Yêu cầu trùng lặp.');
  assert.equal(cancellationFeedback(staff, { action: 'cancel', cancelReasonCode: 'DUPLICATE', message: 'Xem đơn trước.' }).message, 'Yêu cầu trùng lặp. Xem đơn trước.');
  for (const command of [{ action: 'cancel', cancelReasonCode: 'UNKNOWN' }, { action: 'receive', cancelReasonCode: 'DUPLICATE' }]) {
    assert.throws(() => cancellationFeedback(staff, command), e => e.statusCode === 400);
  }
  assert.throws(() => cancellationFeedback({ role: 'STUDENT' }, { action: 'cancel', cancelReasonCode: 'DUPLICATE' }), e => e.statusCode === 400);
});

test('clients cannot supply appointment dates or processing timestamps', () => {
  for (const field of ['pickupAt', 'printedAt', 'processedAt']) {
    assert.throws(() => parseCommand({ action: 'result', version: 2, idempotencyKey: 'test', [field]: '2026-10-25T00:00:00Z' }), e => e.statusCode === 400);
  }
});

test('processing does not claim delivery and cancelled requests invalidate their appointment', () => {
  const row = { Id: 'test', Number: 1, TypeCode: 'CONFIRMATION', Status: 'READY', StudentId: 'sv', Department: 'CTSV',
    Payload: {}, RequiredFields: [], Version: 3, ProcessedAt: '2026-10-25T03:30:00Z', PickupAt: '2026-10-27T03:30:00Z', PickupLocation: 'Một cửa' };
  const actor = { id: 'sv', role: 'STUDENT' };
  const processed = requestDto(row, actor);
  assert.equal(processed.appointment.status, 'SCHEDULED'); assert.equal(processed.deliveredAt, null);
  assert.equal(requestDto({ ...row, Status: 'CANCELLED' }, actor).appointment.status, 'CANCELLED');
  assert.equal(requestDto({ ...row, Status: 'COMPLETED', DeliveredAt: '2026-10-27T04:00:00Z' }, actor).appointment.status, 'DELIVERED');
});
