import { env } from '../../config/env.js';

export function assertLocalDemoTarget(config = env.localDatabase) {
  const allowed = ['sv_dut', 'studentpage_integration_20261103'];
  if (!['localhost', '127.0.0.1', '::1'].includes(config.host.toLowerCase()) || !allowed.includes(config.name.toLowerCase())) {
    throw new Error('Writes require a loopback SQL instance and an explicitly supported local application database.');
  }
}

// Every write also checks DB_NAME in the same batch/connection as the mutation.
export const localDatabaseGuardSql = "IF DB_NAME() NOT IN (N'sv_dut',N'Studentpage_Integration_20261103') THROW 51000, 'Local application database required', 1;";
