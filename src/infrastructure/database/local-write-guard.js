import { env } from '../../config/env.js';

export function assertLocalDemoTarget(config = env.localDatabase) {
  if (!['localhost', '127.0.0.1', '::1'].includes(config.host.toLowerCase()) || config.name.toLowerCase() !== 'sv_dut') {
    throw new Error('Demo writes require a loopback LOCAL_DB_HOST and LOCAL_DB_NAME=sv_dut.');
  }
}

// Every write also checks DB_NAME in the same batch/connection as the mutation.
export const localDatabaseGuardSql = "IF DB_NAME() <> N'sv_dut' THROW 51000, 'Local sv_dut required', 1;";
