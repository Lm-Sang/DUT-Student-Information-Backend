import { createRequire } from "node:module";
import sql from "mssql";
const require = createRequire(import.meta.url);
let native;
function loadNative() {
  if (native) return native;
  // Loading mssql/msnodesqlv8's index would change node-mssql's shared driver.
  // Bind concrete native factories per pool so the SSH/Tedious source stays isolated.
  const NativePool = require("mssql/lib/msnodesqlv8/connection-pool");
  const Request = require("mssql/lib/msnodesqlv8/request");
  const NativeTransaction = require("mssql/lib/msnodesqlv8/transaction");
  class Transaction extends NativeTransaction {
    request(options) {
      return new Request(this, options);
    }
  }
  class ConnectionPool extends NativePool {
    request(options) {
      return new Request(this, options);
    }
    transaction(options) {
      return new Transaction(this, options);
    }
  }
  native = { ...sql, ConnectionPool, Request, Transaction };
  return native;
}
let lazy;
export function windowsSqlDriver() {
  if (lazy) return lazy;
  // Native binaries load only when local SQL is actually opened. School APIs can
  // still run on hosts without the optional Windows Authentication dependency.
  class ConnectionPool {
    constructor(config) {
      return new (loadNative().ConnectionPool)(config);
    }
  }
  class Request {
    constructor(parent, options) {
      return new (loadNative().Request)(parent, options);
    }
  }
  class Transaction {
    constructor(parent, options) {
      return new (loadNative().Transaction)(parent, options);
    }
  }
  lazy = { ...sql, ConnectionPool, Request, Transaction };
  return lazy;
}
export const schoolSqlDriver = sql;
