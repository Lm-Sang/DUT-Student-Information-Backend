import assert from 'node:assert/strict';
import { test } from 'node:test';

import { toAnnouncementSummaryDto, toAnnouncementDetailDto } from '../mappers/announcements.mapper.js';

test('announcement DTOs exclude SQL-only columns and keep stored text edge cases', () => {
  const row = Object.freeze({
    ID: 1, MaThongBao: ' 001 ', Tieude: '%invalid+title', Noidung: '%3Cp%3EHello%3C%2Fp%3E',
    Ngaydang: null, Nguoidang: null, LinhVuc: null, LinhVucCT: null,
    Hide: 0, internalAuditData: 'must not be public',
  });
  const summary = toAnnouncementSummaryDto(row);
  assert.equal(summary.title, '%invalid+title');
  assert.equal(summary.code, '001');
  assert.equal(summary.postedAt, null);
  assert.equal(summary.author, null);
  assert.ok(!Object.hasOwn(summary, 'contentHtml'));
  for (const dto of [summary, toAnnouncementDetailDto(row)]) {
    assert.ok(!Object.hasOwn(dto, 'Hide'));
    assert.ok(!Object.hasOwn(dto, 'internalAuditData'));
    assert.ok(!Object.hasOwn(dto, 'Noidung'));
  }
  assert.equal(toAnnouncementDetailDto(row).contentHtml, '<p>Hello</p>');
  assert.equal(row.MaThongBao, ' 001 ');
});
