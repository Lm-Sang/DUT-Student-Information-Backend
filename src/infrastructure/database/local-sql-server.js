import { env } from "../../config/env.js";
import { windowsSqlDriver } from "./typeorm-driver.js";
import { createTypeOrmConnection } from "./typeorm-connection.js";
import { positionalSql } from "./sql-parameters.js";
import { assertLocalDemoTarget } from "./local-write-guard.js";

function odbcValue(value, name) {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    /[\u0000-\u001f\u007f]/.test(value)
  )
    throw new Error(
      `${name} must be a non-empty string without control characters.`,
    );
  return "{" + value.replaceAll("}", "}}") + "}";
}
export function localConnectionString(config) {
  odbcValue(config.host, "LOCAL_DB_HOST");
  if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535)
    throw new Error("LOCAL_DB_PORT must be an integer between 1 and 65535.");
  return (
    [
      `Driver=${odbcValue(config.driver, "LOCAL_DB_ODBC_DRIVER")}`,
      `Server=${odbcValue(`${config.host},${config.port}`, "LOCAL_DB_HOST")}`,
      `Database=${odbcValue(config.name, "LOCAL_DB_NAME")}`,
      "Trusted_Connection=Yes",
      `Encrypt=${config.encrypt ? "Yes" : "No"}`,
      `TrustServerCertificate=${config.trustServerCertificate ? "Yes" : "No"}`,
    ].join(";") + ";"
  );
}
export function createLocalDatabase({
  config = env.localDatabase,
  entities = [],
  createSource,
  driver = windowsSqlDriver(),
} = {}) {
  const connection = createTypeOrmConnection({
    createSource,
    beforeWrite: () => assertLocalDemoTarget(config),
    options: {
      type: "mssql",
      driver,
      host: config.host,
      port: config.port,
      database: config.name,
      entities,
      connectionTimeout: 15000,
      requestTimeout: config.queryTimeoutMs,
      pool: { min: 1, max: 10, idleTimeoutMillis: 30000 },
      options: {
        trustedConnection: true,
        encrypt: config.encrypt,
        trustServerCertificate: config.trustServerCertificate,
        useUTC: true,
      },
      extra: { connectionString: localConnectionString(config) },
    },
  });
  return {
    ...connection,
    query: (statement, parameters = []) =>
      connection.query(positionalSql(statement, parameters), parameters),
    transaction: (statement, parameters = []) =>
      connection.transaction(positionalSql(statement, parameters), parameters),
  };
}
const localDatabase = createLocalDatabase();
export function configureLocalEntities(entities) {
  if (localDatabase.source.isInitialized)
    throw new Error("Register TypeORM entities before opening the database.");
  localDatabase.source.setOptions({ entities });
}
export const localDataSource = localDatabase.source;
export const getLocalDataSource = localDatabase.connect;
export const connectLocalDatabase = getLocalDataSource;
export const queryLocalDatabase = localDatabase.query;
export const transactionLocalDatabase = localDatabase.transaction;
export const disconnectLocalDatabase = localDatabase.disconnect;
