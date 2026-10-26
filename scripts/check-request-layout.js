import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import PizZip from 'pizzip';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const manifest = JSON.parse(await readFile('assets/request-forms/docx-layout-manifest.json', 'utf8'));
const original = '../bieu-mau-de-nghi-in/';
const sha = data => createHash('sha256').update(data).digest('hex');
async function lines(path) {
  const task = getDocument({ data: new Uint8Array(await readFile(path)), useSystemFonts: true });
  const pdf = await task.promise; const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i), text = await page.getTextContent(); const rows = [];
    for (const item of text.items.filter(item => item.str.trim())) {
      let row = rows.find(row => Math.abs(row.y - item.transform[5]) < 0.8);
      if (!row) { row = { y: item.transform[5], items: [] }; rows.push(row); }
      row.items.push(item);
    }
    pages.push(rows.map(row => { const items = row.items.sort((a, b) => a.transform[4] - b.transform[4]); return {
      y: row.y, x: items[0].transform[4], text: items.map(i => i.str).join(' ').replace(/\s+/g, ' ').trim() }; }));
  }
  await task.destroy(); return pages;
}
const records = [];
for (const item of manifest) {
  assert.equal(sha(await readFile(original + item.source)), item.sourceSha256, 'source has changed');
  const templateBytes = await readFile(`assets/request-forms/docx/${item.stem}.docx`);
  assert.equal(sha(templateBytes), item.templateSha256, 'template has changed since its layout audit');
  const zip = new PizZip(templateBytes);
  for (const [part, hash] of Object.entries(item.preservedParts)) assert.equal(sha(zip.file(part).asNodeBuffer()), hash, `preserved package part changed: ${part}`);
  // The actual body section keeps the source page size and all four page margins.
  const before = item.sourceGeometry[0], after = item.templateGeometry[0];
  assert.deepEqual(after.pgSz, before.pgSz);
  for (const key of ['top', 'right', 'bottom', 'left']) assert.equal(after.pgMar[key], before.pgMar[key]);
  const source = await lines(`.data/research/original-form-pdf/${item.source.replace(/\.docx$/, '.pdf')}`);
  const generated = await lines(`.data/research/native-source-fixtures/${item.stem}.pdf`);
  const anchors = source[0].filter(row => row.text.includes('CỘNG HÒA') || row.text.startsWith('ĐƠN ') || row.text.startsWith('Kính gửi:')
    || row.text.startsWith('Tôi tên là:') || row.text.startsWith('Sinh ngày:') || row.text.startsWith('Số thẻ SV:'));
  let maxDelta = 0;
  for (const anchor of anchors) {
    const target = generated[0].find(row => row.text.startsWith(anchor.text.split(/(?:Trần|XXXXX|XX\/)/)[0].trim()));
    assert(target, `${item.stem}: missing ${anchor.text}`);
    const delta = Math.max(Math.abs(target.x - anchor.x), Math.abs(target.y - anchor.y)); maxDelta = Math.max(maxDelta, delta);
    assert(delta <= 0.25, `${item.stem}: anchor moved ${delta.toFixed(2)}pt: ${anchor.text}`);
  }
  records.push({ stem: item.stem, sourcePages: source.length, filledPages: generated.length, anchors: anchors.length, maxDeltaPt: maxDelta,
    preservedParts: Object.keys(item.preservedParts).length, unchangedParagraphProperties: item.unchangedParagraphProperties,
    paragraphPropertyExceptions: item.paragraphPropertyExceptions });
}
await writeFile('.data/research/request-layout-verification.json', JSON.stringify(records, null, 2));
for (const record of records) console.log(`${record.stem}: ${record.anchors} anchors, max delta ${record.maxDeltaPt.toFixed(2)}pt, ${record.preservedParts} package parts preserved`);
