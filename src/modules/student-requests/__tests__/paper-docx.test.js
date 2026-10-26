import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import PizZip from 'pizzip';
import { DOMParser } from '@xmldom/xmldom';
import { fillPaperDocx } from '../services/paper-docx.templates.js';
import { paperTemplates } from '../services/paper-pdf.renderer.js';

const root = new URL('../../../../assets/request-forms/', import.meta.url);
const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const parse = xml => new DOMParser().parseFromString(xml, 'application/xml');

test('all seven source-preserving Word templates retain audited margins, styles and table geometry', () => {
  const manifest = JSON.parse(readFileSync(new URL('docx-layout-manifest.json', root), 'utf8'));
  assert.equal(manifest.length, 7);
  for (const entry of manifest) {
    const template = paperTemplates.find(t => entry.stem.startsWith(t.code + '-'));
    const payload = { reasonCode: entry.kind === 'CARD_CHANGE' ? 'CHANGE_INFO' : 'LOST_OR_DAMAGED' };
    const source = new PizZip(readFileSync(new URL(`docx/${entry.stem}.docx`, root)));
    const filled = new PizZip(fillPaperDocx({ template, payload, values: { name: 'Tên thử nghiệm' } }));
    for (const part of ['word/styles.xml', 'word/fontTable.xml', 'word/numbering.xml']) {
      if (source.file(part)) assert.deepEqual(filled.file(part).asNodeBuffer(), source.file(part).asNodeBuffer());
    }
    const before = parse(source.file('word/document.xml').asText());
    const after = parse(filled.file('word/document.xml').asText());
    for (const tag of ['pgSz', 'pgMar', 'tblGrid', 'pPr', 'rPr']) {
      assert.deepEqual(Array.from(after.getElementsByTagNameNS(W, tag), n => n.toString()),
        Array.from(before.getElementsByTagNameNS(W, tag), n => n.toString()), `${entry.stem}: ${tag}`);
    }
    for (const key of ['top', 'right', 'bottom', 'left']) {
      assert.equal(after.getElementsByTagNameNS(W, 'pgMar')[0].getAttributeNS(W, key), entry.sourceGeometry[0].pgMar[key]);
    }
  }
});

test('multiline card text is escaped and signatures stay connected without changing source spacing', () => {
  const args = { template: paperTemplates[0], payload: { reasonCode: 'CHANGE_INFO' }, values: { changeDescription: 'Một & hai\n<Ba>\r\nBốn' } };
  const zip = new PizZip(fillPaperDocx(args));
  const doc = parse(zip.file('word/document.xml').asText());
  const paragraph = Array.from(doc.getElementsByTagNameNS(W, 'p')).find(p => p.textContent.includes('Một & hai'));
  assert(paragraph.textContent.includes('<Ba>'));
  assert.equal(paragraph.getElementsByTagNameNS(W, 'br').length, 2);
  assert(doc.getElementsByTagNameNS(W, 'keepNext').length >= 3);
  assert.equal(parse(zip.file('word/settings.xml').asText()).getElementsByTagNameNS(W, 'doNotExpandShiftReturn').length, 1);
  assert.throws(() => fillPaperDocx({ ...args, values: { changeDescription: 'bad\u0001' } }), e => e.statusCode === 422);
});

test('semester history expands without dropping rows and keeps the table header repeatable', () => {
  const values = Object.fromEntries(Array.from({ length: 24 }, (_, i) => [`history_${i}_index`, i + 1]));
  const zip = new PizZip(fillPaperDocx({ template: paperTemplates.find(t => t.code === 'DonSV07'), values, historyLength: 24 }));
  const doc = parse(zip.file('word/document.xml').asText());
  const history = doc.getElementsByTagNameNS(W, 'tbl')[1];
  assert.equal(history.getElementsByTagNameNS(W, 'tr').length, 25);
  assert.equal(history.getElementsByTagNameNS(W, 'tblHeader').length, 1);
  assert.equal(history.getElementsByTagNameNS(W, 'tr')[24].getElementsByTagNameNS(W, 'tc')[0].textContent, '24');
});
