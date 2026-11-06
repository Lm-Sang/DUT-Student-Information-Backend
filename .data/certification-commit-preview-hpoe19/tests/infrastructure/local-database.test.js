import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createLocalDatabase, localConnectionString } from '../../src/infrastructure/database/local-sql-server.js';

const config = {
  host: 'localhost', port: 1433, name: 'sv_dut',
  driver: 'ODBC Driver 17 for SQL Server',
  encrypt: false, trustServerCertificate: true, queryTimeoutMs: 30000,
};

function driverFixture({ failures = 0 } = {}) {
  const pools = [];
  class Pool {
    constructor(options) {
      this.options = options;
      this.openCalls = 0;
      this.closeCalls = 0;
      this.queries = [];
      this.promises = {
        open: async () => {
          this.openCalls++;
          if (failures-- > 0) throw new Error('Temporary local login failure');
        },
        close: async () => { this.closeCalls++; },
        query: async (...args) => {
          this.queries.push(args);
          return { first: [{ value: args[1][0] }] };
        },
      };
      pools.push(this);
    }
  }
  return { driver: { Pool }, pools };
}

test('local connection uses Windows identity, explicit encryption and escaped ODBC values', () => {
  const connectionString = localConnectionString(config);
  assert.match(connectionString, /Server=\{localhost,1433\};Database=\{sv_dut\}/);
  assert.match(connectionString, /Trusted_Connection=Yes;Encrypt=No;TrustServerCertificate=Yes;/);
  assert.ok(!/\b(?:Uid|Pwd|Password|User)\s*=/i.test(connectionString));
  assert.ok(localConnectionString({ ...config, name: 'db};Pwd=injected' })
    .includes('Database={db}};Pwd=injected};Trusted_Connection=Yes;'));
  assert.throws(() => localConnectionString({ ...config, host: '' }), /LOCAL_DB_HOST/);
  assert.throws(() => localConnectionString({ ...config, name: 'sv_dut\n' }), /LOCAL_DB_NAME/);
  assert.throws(() => localConnectionString({ ...config, port: 0 }), /LOCAL_DB_PORT/);
});

test('simultaneous local requests share one lazy pool and bind positional parameters', async () => {
  const { driver, pools } = driverFixture();
  let loads = 0;
  const database = createLocalDatabase({ config, loadDriver: async () => { loads++; return driver; } });
  assert.equal(loads, 0);
  const pending = database.connect();
  assert.equal(database.connect(), pending);
  await pending;
  const marker = "Unicode: tiếng Việt ' ; --";
  const result = await database.query('SELECT ? AS value', [marker]);
  assert.deepEqual(result.first, [{ value: marker }]);
  assert.equal(loads, 1);
  assert.equal(pools[0].openCalls, 1);
  assert.deepEqual(pools[0].queries, [['SELECT ? AS value', [marker], { timeoutMs: 30000 }]]);
  await database.disconnect();
  await database.disconnect();
  assert.equal(pools[0].closeCalls, 1);
  await database.connect();
  assert.equal(pools.length, 2);
  await database.disconnect();
});

test('failed local connection is closed and can be retried', async () => {
  const { driver, pools } = driverFixture({ failures: 1 });
  const database = createLocalDatabase({ config, loadDriver: async () => driver });
  await assert.rejects(database.connect(), /Temporary local login failure/);
  assert.equal(pools[0].closeCalls, 1);
  const pool = await database.connect();
  assert.equal(pool, pools[1]);
  await database.disconnect();
});

test('disconnect waits for a pending local connection to open before closing it', async () => {
  const { driver, pools } = driverFixture();
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const database = createLocalDatabase({ config, loadDriver: async () => { await gate; return driver; } });
  const pending = database.connect();
  const closing = database.disconnect();
  release();
  await Promise.all([pending, closing]);
  assert.equal(pools[0].closeCalls, 1);
});

test('separate database connectors keep independent settings and pool lifetimes', async () => {
  const { driver, pools } = driverFixture();
  const first = createLocalDatabase({ config, loadDriver: async () => driver });
  const second = createLocalDatabase({ config: { ...config, port: 1434, name: 'other_db' }, loadDriver: async () => driver });
  await Promise.all([first.connect(), second.connect()]);
  assert.match(pools[0].options.connectionString, /Server=\{localhost,1433\};Database=\{sv_dut\}/);
  assert.match(pools[1].options.connectionString, /Server=\{localhost,1434\};Database=\{other_db\}/);
  await first.disconnect();
  assert.equal(pools[0].closeCalls, 1);
  assert.equal(pools[1].closeCalls, 0);
  assert.deepEqual((await second.query('SELECT ? AS value', [2])).first, [{ value: 2 }]);
  await second.disconnect();
});
