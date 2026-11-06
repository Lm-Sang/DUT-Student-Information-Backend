// Guarded local integration tests for canonical auth and workflow permissions.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { assertLocalDemoTarget } from '../src/infrastructure/database/local-write-guard.js';
assertLocalDemoTarget();
const result=spawnSync(process.execPath,['--test','--test-concurrency=1',
 'tests/common/auth/auth-sql.test.js','tests/common/auth/password-management-sql.test.js','tests/common/auth/organization-sql.test.js'],{
 cwd:fileURLToPath(new URL('../',import.meta.url)),stdio:'inherit',
 env:{...process.env,AUTH_DB_TEST:'1',AUTH_ORGANIZATION_DB_TEST:'1'},
});
if(result.error)throw result.error;
process.exitCode=result.status??1;
