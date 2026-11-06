import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { join, resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AppError } from '../../shared/errors/app-error.js';

const execute = promisify(execFile);
const jobs = fileURLToPath(new URL('../../../.data/document-jobs/', import.meta.url));
const script = fileURLToPath(new URL('./convert-word.ps1', import.meta.url));
let tail = Promise.resolve();

export function convertWordToPdf(docx) {
  const operation = tail.then(async () => {
    if (process.platform !== 'win32') throw new AppError('Xuất PDF giữ mẫu Word hiện yêu cầu Windows và Microsoft Word.', 503);
    await mkdir(jobs, { recursive: true });
    const directory = await mkdtemp(join(jobs, 'export-'));
    try {
      const input = join(directory, 'input.docx'), output = join(directory, 'output.pdf'), result = join(directory, 'result.json');
      await writeFile(input, docx);
      const manifest = join(directory, 'job.json');
      await writeFile(manifest, JSON.stringify({ input, output, result }));
      await execute('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', script, '-JobPath', manifest],
        { windowsHide: true, timeout: 120000, maxBuffer: 1024 * 1024 });
      const bytes = await readFile(output);
      const details = JSON.parse((await readFile(result, 'utf8')).replace(/^\uFEFF/, ''));
      if (bytes.subarray(0, 5).toString() !== '%PDF-' || !Number.isInteger(details.pageCount) || details.pageCount < 1) throw new Error('Invalid rendered PDF');
      return { bytes, pageCount: details.pageCount };
    } catch (error) {
      const failure = new AppError('Không xuất được PDF theo mẫu Word. Kiểm tra Microsoft Word trên máy local và thử lại.', 503);
      Object.defineProperty(failure, 'cause', { value: error });
      throw failure;
    } finally {
      const checked = resolve(directory);
      if (dirname(checked) !== resolve(jobs) || !basename(checked).startsWith('export-')) throw new Error('Invalid document job cleanup target');
      await rm(directory, { recursive: true, force: true });
    }
  });
  tail = operation.catch(() => {});
  return operation;
}
