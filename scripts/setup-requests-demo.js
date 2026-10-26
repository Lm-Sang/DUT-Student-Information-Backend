import { readFileSync } from 'node:fs';
import { queryLocalDatabase, disconnectLocalDatabase } from '../src/infrastructure/database/local-sql-server.js';
import { assertLocalDemoTarget } from '../src/infrastructure/database/local-write-guard.js';
import './migrate-requests-fields.js';

try {
  assertLocalDemoTarget();
  const identity = (await queryLocalDatabase('SELECT DB_NAME() AS db,CAST(SERVERPROPERTY(\'ServerName\') AS nvarchar(128)) AS serverName')).first[0];
  if (identity.db !== 'sv_dut') throw new Error('Migration target is not sv_dut.');
  await queryLocalDatabase(readFileSync(new URL('./queries/requests-fields-seed.sql', import.meta.url), 'utf8'));
  console.log('Created/verified Vietnamese typed columns and fictional actors in local sv_dut.', JSON.stringify(identity));
} finally { await disconnectLocalDatabase(); }
