import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { paperTemplates, renderPaperPdf } from '../src/modules/student-requests/services/paper-pdf.renderer.js';

const root = resolve('assets/request-forms');
const sourceRoot = resolve(process.argv[2] || '../bieu-mau-de-nghi-in');
await mkdir(`${root}/blank`, { recursive: true });
const inventory = [];
const sourceFiles = await readdir(sourceRoot).catch(error => {
  if (error.code !== 'ENOENT' || process.argv[2]) throw error;
  console.log('Source folder not present; keeping the recorded source inventory.'); return [];
});
for (const file of sourceFiles) {
  if (!/\.(docx|pdf)$/i.test(file)) continue;
  const data = await readFile(resolve(sourceRoot, file));
  inventory.push({ file, sha256: createHash('sha256').update(data).digest('hex'), bytes: data.length });
}
for (const template of paperTemplates) {
  const variants = template.kind === 'CARD' ? ['LOST_OR_DAMAGED', 'CHANGE_INFO'] : [null];
  for (const variant of variants) {
    const result = await renderPaperPdf({ template, blank: true, snapshot: { payload: { reasonCode: variant } } });
    const filename = `${template.code}-${template.slug}${variant === 'CHANGE_INFO' ? '-thay-doi-thong-tin' : ''}.pdf`;
    await writeFile(`${root}/blank/${filename}`, result.bytes);
    console.log(`${filename}: ${result.pageCount} page(s)`);
  }
}
if (inventory.length) await writeFile(`${root}/source-inventory.json`, JSON.stringify(inventory, null, 2) + '\n');
