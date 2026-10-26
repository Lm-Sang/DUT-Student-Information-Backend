import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, basename } from 'node:path';
import { createCanvas } from '@napi-rs/canvas';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const [output, ...inputs] = process.argv.slice(2);
if (!output || !inputs.length) throw new Error('Usage: node scripts/render-request-pdfs.js output-dir file.pdf [...]');
await mkdir(output, { recursive: true });
for (const input of inputs) {
  const task = getDocument({ data: new Uint8Array(await readFile(input)), useSystemFonts: true });
  const pdf = await task.promise;
  const pages = [];
  for (let number = 1; number <= pdf.numPages; number++) {
    const page = await pdf.getPage(number);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    await writeFile(resolve(output, `${basename(input, '.pdf')}-${number}.png`), canvas.toBuffer('image/png'));
    const text = await page.getTextContent();
    pages.push({ page: number, width: page.view[2], height: page.view[3], items: text.items.map(item => ({ text: item.str, x: item.transform[4], y: item.transform[5], size: item.height })) });
  }
  await writeFile(resolve(output, `${basename(input, '.pdf')}.json`), JSON.stringify(pages, null, 2));
  console.log(`${input}: ${pdf.numPages} page(s)`);
  await task.destroy();
}
