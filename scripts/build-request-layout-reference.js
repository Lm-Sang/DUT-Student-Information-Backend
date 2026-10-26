// Private source values stay in ignored .data; never commit the generated fixtures.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { paperTemplates } from '../src/modules/student-requests/services/paper-pdf.renderer.js';
import { fillPaperDocx } from '../src/modules/student-requests/services/paper-docx.templates.js';
import { convertWordToPdf } from '../src/infrastructure/documents/word-pdf.js';

const sourceRoot = resolve(process.argv[2] || '../bieu-mau-de-nghi-in');
const manifest = JSON.parse(await readFile('assets/request-forms/docx-layout-manifest.json', 'utf8'));
const fixtures = JSON.parse(await readFile('.data/research/layout-source-fixtures.json', 'utf8'));
const originalDir = '.data/research/original-form-pdf', filledDir = '.data/research/native-source-fixtures';
await mkdir(originalDir, { recursive: true });
await mkdir(filledDir, { recursive: true });
for (const entry of manifest) {
  const original = await convertWordToPdf(await readFile(resolve(sourceRoot, entry.source)));
  await writeFile(`${originalDir}/${entry.source.replace(/\.docx$/, '.pdf')}`, original.bytes);
  const template = paperTemplates.find(t => entry.stem.startsWith(t.code + '-'));
  const payload = { reasonCode: entry.kind === 'CARD_CHANGE' ? 'CHANGE_INFO' : 'LOST_OR_DAMAGED' };
  const fixture = fixtures.find(f => f.stem === entry.stem);
  if (!fixture) throw new Error('Rebuild neutral templates with build-request-docx-templates.py first');
  const docx = fillPaperDocx({ template, payload, values: { footer: `${template.code} 06:50 24/10/2026`, ...fixture.values } });
  const filled = await convertWordToPdf(docx);
  await writeFile(`${filledDir}/${entry.stem}.pdf`, filled.bytes);
  console.log(`${entry.stem}: source ${original.pageCount}, filled ${filled.pageCount} page(s)`);
}
