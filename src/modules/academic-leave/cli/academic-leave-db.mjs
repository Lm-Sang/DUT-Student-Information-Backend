import {readFile} from 'node:fs/promises';
import {queryLocalDatabase,disconnectAllDatabases} from '../../../infrastructure/database/index.js';

try {
  const schema=await readFile(new URL('../repositories/academic-leave-schema.sql',import.meta.url),'utf8');
  await queryLocalDatabase(schema);
  console.log('Academic leave applications and history schema are ready.');
} catch {
  console.error('Cannot initialize academic leave schema. Check local SQL Server access and migration compatibility.');
  process.exitCode=1;
} finally {
  await disconnectAllDatabases();
}
