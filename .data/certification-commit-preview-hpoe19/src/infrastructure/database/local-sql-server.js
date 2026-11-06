import { env } from '../../config/env.js';

function odbcValue(value, name) {
  if (typeof value !== 'string' || !value.trim() || /[\u0000-\u001f\u007f]/.test(value)) {
    throw new Error(`${name} must be a non-empty string without control characters.`);
  }
  return '{' + value.replaceAll('}', '}}') + '}';
}

export function localConnectionString(config) {
  odbcValue(config.host, 'LOCAL_DB_HOST');
  if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) {
    throw new Error('LOCAL_DB_PORT must be an integer between 1 and 65535.');
  }
  return [
    `Driver=${odbcValue(config.driver, 'LOCAL_DB_ODBC_DRIVER')}`,
    `Server=${odbcValue(`${config.host},${config.port}`, 'LOCAL_DB_HOST')}`,
    `Database=${odbcValue(config.name, 'LOCAL_DB_NAME')}`,
    'Trusted_Connection=Yes',
    `Encrypt=${config.encrypt ? 'Yes' : 'No'}`,
    `TrustServerCertificate=${config.trustServerCertificate ? 'Yes' : 'No'}`,
  ].join(';') + ';';
}

async function loadNativeDriver() {
  try {
    return (await import('msnodesqlv8')).default;
  } catch (error) {
    throw new Error('Local Windows Authentication requires msnodesqlv8 and a matching SQL Server ODBC driver. Run npm install --include=optional.', { cause: error });
  }
}

// Use the native driver directly. Importing mssql/msnodesqlv8 would change
// node-mssql's shared driver and could break simultaneous remote Tedious pools.
export function createLocalDatabase({ config = env.localDatabase, loadDriver = loadNativeDriver } = {}) {
  let connectionPromise;

  function connect() {
    if (connectionPromise) return connectionPromise;
    const pending = (async () => {
      const connectionString = localConnectionString(config);
      const driver = await loadDriver();
      const pool = new driver.Pool({
        connectionString,
        floor: 1,
        ceiling: 10,
        inactivityTimeoutSecs: 30,
        useUTC: true,
      });
      try {
        await pool.promises.open();
        return pool;
      } catch (error) {
        await pool.promises.close().catch(() => {});
        throw error;
      }
    })();
    connectionPromise = pending;
    pending.catch(() => {
      if (connectionPromise === pending) connectionPromise = undefined;
    });
    return pending;
  }

  async function query(statement, parameters = []) {
    const pool = await connect();
    return pool.promises.query(statement, parameters, { timeoutMs: config.queryTimeoutMs });
  }

  async function disconnect() {
    const pending = connectionPromise;
    connectionPromise = undefined;
    if (!pending) return;
    const pool = await pending.catch(() => undefined);
    if (pool) await pool.promises.close();
  }

  return Object.freeze({ connect, query, disconnect });
}

const localDatabase = createLocalDatabase();
export const connectLocalDatabase = localDatabase.connect;
export const queryLocalDatabase = localDatabase.query;
export const disconnectLocalDatabase = localDatabase.disconnect;
