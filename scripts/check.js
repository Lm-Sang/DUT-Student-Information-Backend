import { join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';

import { javascriptFiles, projectRoot } from './lib/files.js';

const files = ['src', 'scripts', 'tests'].flatMap((directory) => javascriptFiles(join(projectRoot, directory)));
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    console.error(`Syntax check failed: ${relative(projectRoot, file)}`);
    process.exit(result.status ?? 1);
  }
}
console.log(`Syntax OK: ${files.length} JavaScript files.`);
