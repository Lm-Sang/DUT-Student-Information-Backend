import { existsSync } from 'node:fs';
import { join, sep } from 'node:path';
import { spawnSync } from 'node:child_process';

import { javascriptFiles, projectRoot } from './lib/files.js';

const args = process.argv.slice(2);
let directories;
if (args.length === 0) {
  directories = ['tests'];
} else if (args.length === 2 && args[0] === '--feature' && /^[a-z][a-z0-9-]*$/.test(args[1])) {
  directories = ['tests'];
} else {
  console.error('Usage: npm test | npm run test:feature -- <feature-name>');
  process.exit(1);
}

const files = directories.flatMap((directory) => {
  const path = join(projectRoot, directory);
  if (!existsSync(path)) {
    console.error(`Feature directory does not exist: ${directory}`);
    process.exit(1);
  }
  return javascriptFiles(path).filter((file) => file.endsWith('.test.js')
    && (args.length === 0 || file.split(sep).includes(args[1])));
});
if (!files.length) {
  console.error(`No *.test.js files found in ${directories.join(', ')}.`);
  process.exit(1);
}

const result = spawnSync(process.execPath, ['--test', ...files], {
  cwd: projectRoot,
  stdio: 'inherit',
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
