import { connectDatabase, disconnectDatabases } from '../src/config/database.js';

async function testAccount(accountName) {
  try {
    const pool = await connectDatabase(accountName);
    const identity = await pool.request().query(`
      SELECT DB_NAME() AS databaseName, SUSER_SNAME() AS loginName;
    `);
    const databases = await pool.request().query(`
      SELECT name FROM sys.databases ORDER BY name;
    `);
    const tables = await pool.request().query(`
      SELECT TABLE_SCHEMA, TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_SCHEMA, TABLE_NAME;
    `);

    const current = identity.recordset[0];
    console.log(`[${accountName}] connected as ${current.loginName}`);
    console.log(`[${accountName}] current database: ${current.databaseName}`);
    console.log(
      `[${accountName}] visible databases: ${databases.recordset.map((row) => row.name).join(', ')}`,
    );
    console.log(`[${accountName}] base tables: ${tables.recordset.length}`);
    for (const table of tables.recordset) {
      console.log(`  ${table.TABLE_SCHEMA}.${table.TABLE_NAME}`);
    }

    return true;
  } catch (error) {
    console.error(`[${accountName}] connection failed: ${error.message}`);
    return false;
  }
}

const results = [];

try {
  results.push(await testAccount('primary'));
  results.push(await testAccount('secondary'));
} finally {
  await disconnectDatabases();
}

if (results.some((result) => !result)) process.exitCode = 1;
