import {
  connectDatabase,
  queryLocalDatabase,
  disconnectAllDatabases,
} from '../src/infrastructure/database/index.js';

const mode = process.argv[2] ?? 'all';
if (!['local', 'all'].includes(mode) || process.argv.length > 3) {
  console.error('Usage: npm run test:db:local | npm run test:db:all');
  process.exit(1);
}

const statement = `
  SELECT DB_NAME() AS databaseName, SUSER_SNAME() AS loginName,
    CAST(SERVERPROPERTY('ProductVersion') AS nvarchar(128)) AS productVersion,
    CAST(SERVERPROPERTY('Edition') AS nvarchar(128)) AS edition,
    (SELECT COUNT(*) FROM sys.tables WHERE is_ms_shipped = 0) AS userTables;
`;

const checks = {
  local: async () => (await queryLocalDatabase(statement)).first[0],
};
if (mode === 'all') {
  checks.school = async () => {
    const pool = await connectDatabase('primary');
    return (await pool.request().query(statement)).recordset[0];
  };
}

try {
  // Both checks run in this Node process at the same time, with separate pools.
  const results = await Promise.allSettled(Object.values(checks).map((check) => check()));
  for (const [index, name] of Object.keys(checks).entries()) {
    const result = results[index];
    if (result.status === 'fulfilled') {
      console.log(JSON.stringify({ instance: name, connected: true, ...result.value }));
    } else {
      console.error(JSON.stringify({ instance: name, connected: false, error: result.reason.message }));
      process.exitCode = 1;
    }
  }
} finally {
  await disconnectAllDatabases();
}
