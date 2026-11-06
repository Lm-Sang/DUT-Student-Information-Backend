import "reflect-metadata";
import { AsyncLocalStorage } from "node:async_hooks";
import { DataSource } from "typeorm";
import { assertReadOnlySql } from "./sql-parameters.js";
const resultsContext = new AsyncLocalStorage();
export function createTypeOrmConnection({
  options,
  readOnly = false,
  beforeWrite,
  createSource = (value) => new DataSource(value),
}) {
  let pending;
  const source = createSource({
    ...options,
    synchronize: false,
    migrationsRun: false,
    dropSchema: false,
    logging: false,
  });
  const subscriber = {
    beforeQuery(event) {
      if (readOnly) assertReadOnlySql(event.query);
      else if (beforeWrite) {
        try {
          assertReadOnlySql(event.query);
        } catch {
          beforeWrite();
        }
      }
    },
    afterQuery(event) {
      const current = resultsContext.getStore();
      if (current?.runner === event.queryRunner) current.raw = event.rawResults;
    },
  };
  function connect() {
    if (pending) return pending;
    const connecting = (async () => {
      await source.initialize();
      source.subscribers.push(subscriber);
      return source;
    })();
    pending = connecting;
    connecting.catch(() => {
      if (pending === connecting) pending = undefined;
    });
    return connecting;
  }
  async function run(statement, parameters = [], transactional = false) {
    if (readOnly) assertReadOnlySql(statement);
    const dataSource = await connect(),
      runner = dataSource.createQueryRunner(),
      context = { runner };
    try {
      if (transactional) {
        beforeWrite?.();
        await runner.startTransaction("READ COMMITTED");
      }
      const output = await resultsContext.run(context, async () => {
        const result = await runner.query(statement, parameters, true);
        const recordsets = context.raw?.recordsets ?? [result.records ?? []];
        return {
          first: recordsets[0] ?? [],
          recordset: recordsets[0] ?? [],
          recordsets,
          results: recordsets,
          rowsAffected: context.raw?.rowsAffected ?? [result.affected ?? 0],
        };
      });
      if (transactional) await runner.commitTransaction();
      return output;
    } catch (error) {
      if (transactional && runner.isTransactionActive)
        await runner.rollbackTransaction().catch(() => {});
      throw error;
    } finally {
      await runner.release();
    }
  }
  async function disconnect() {
    const connection = pending;
    pending = undefined;
    if (connection) {
      const initialized = await connection.catch(() => null);
      if (initialized?.isInitialized) await initialized.destroy();
    }
  }
  return {
    source,
    connect,
    query: (sql, params) => run(sql, params),
    transaction: (sql, params) => run(sql, params, true),
    disconnect,
  };
}
