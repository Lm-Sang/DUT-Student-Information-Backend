import { connectDatabase, disconnectDatabases } from './sql-server.js';
import { connectLocalDatabase, disconnectLocalDatabase } from './local-sql-server.js';

export { connectDatabase, disconnectDatabases } from './sql-server.js';
export { connectLocalDatabase, queryLocalDatabase, disconnectLocalDatabase } from './local-sql-server.js';

// Attempt both instances independently so an unavailable instance does not
// prevent the other one from connecting or the HTTP server from starting.
export async function initializeDatabases({
  school = () => connectDatabase('primary'),
  local = connectLocalDatabase,
} = {}) {
  const connections = { school, local };
  const results = await Promise.allSettled(Object.values(connections).map((connect) => Promise.resolve().then(connect)));
  return Object.keys(connections).map((instance, index) => {
    const result = results[index];
    return result.status === 'fulfilled'
      ? { instance, connected: true }
      : { instance, connected: false, error: result.reason };
  });
}

export async function disconnectAllDatabases() {
  const results = await Promise.allSettled([disconnectDatabases(), disconnectLocalDatabase()]);
  const failures = results.filter((result) => result.status === 'rejected').map((result) => result.reason);
  if (failures.length) throw new AggregateError(failures, 'Failed to close database connections.');
}
