import {readFile} from 'node:fs/promises';
import {queryLocalDatabase,disconnectAllDatabases} from '../../src/infrastructure/database/index.js';
import {upgradeReviewWorkflow} from './review-workflow-db.mjs';

try {
  const schema=await readFile(new URL('./sql/academic-leave-schema.sql',import.meta.url),'utf8');
  await queryLocalDatabase(schema);
  await upgradeReviewWorkflow();
  console.log('Academic leave applications and history schema are ready.');
} catch {
  console.error('Cannot initialize academic leave schema. Check local SQL Server access and migration compatibility.');
  process.exitCode=1;
} finally {
  await disconnectAllDatabases();
}
