import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { queryLocalDatabase, disconnectLocalDatabase } from '../../src/infrastructure/database/local-sql-server.js';
import { assertLocalDemoTarget } from '../../src/infrastructure/database/local-write-guard.js';

export async function upgradeReviewWorkflow({ query = queryLocalDatabase, guard = assertLocalDemoTarget } = {}) {
  guard();
  const sql = await readFile(new URL('./sql/review-workflow.sql', import.meta.url), 'utf8');
  await query(sql);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    if (process.argv.length !== 2) throw new Error('No arguments expected');
    await upgradeReviewWorkflow();
    console.log('Local certificate/academic-leave review workflow is ready.');
  } catch {
    console.error('Cannot upgrade the local review workflow. Check DB access, existing constraints and migration compatibility; the transaction is rolled back on failure.');
    process.exitCode = 1;
  } finally { await disconnectLocalDatabase(); }
}
