// Build-time only: Word is needed here, never in the HTTP print/download path.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import PizZip from 'pizzip';
import { fillPaperDocx, docxStem } from '../src/modules/student-requests/services/paper-docx.templates.js';
import { convertWordToPdf } from '../src/infrastructure/documents/word-pdf.js';

const base = resolve('.data/research/fast-layouts'), references = resolve(base, 'references');
await mkdir(references, { recursive: true });
const names = ['DonSV01-cap-lai-the-sinh-vien', 'DonSV03-xet-cong-nhan-tot-nghiep', 'DonSV04-hoan-cong-nhan-tot-nghiep',
  'DonSV05-xet-hoc-bong', 'DonSV07-hoc-chuong-trinh-2', 'DonSV06-thoi-hoc'];
for (const name of names) {
  const template = JSON.parse(await readFile(`assets/request-forms/templates/${name}.json`, 'utf8'));
  for (const payload of template.code === 'DonSV01' ? [{}, { reasonCode: 'CHANGE_INFO' }] : [{}]) {
    const stem = docxStem(template, payload);
    const zip = new PizZip(await readFile(`assets/request-forms/docx/${stem}.docx`));
    const keys = [...new Set(Object.values(zip.files).filter(f => /^word\/(document|footer\w*)\.xml$/.test(f.name))
      .flatMap(f => [...f.asText().matchAll(/\{\{(\w+)\}\}/g)].map(m => m[1])))];
    const values = Object.fromEntries(keys.map((key, i) => [key, `Z${String(i).padStart(3, '0')}Z`]));
    const pdf = await convertWordToPdf(fillPaperDocx({ template, payload, values }));
    await writeFile(resolve(references, `${stem}.pdf`), pdf.bytes);
    await writeFile(resolve(references, `${stem}.markers.json`), JSON.stringify(values));
    console.log(`Prepared ${stem}`);
  }
}
const index = process.argv.indexOf('--python');
const python = index >= 0 ? process.argv[index + 1] : process.env.PYTHON || 'python';
if (!python) throw new Error('Missing --python executable');
const child = spawnSync(python, ['-X', 'utf8', 'scripts/compile-fast-request-layouts.py', base], { stdio: 'inherit' });
if (child.error) throw child.error;
process.exitCode = child.status ?? 1;
