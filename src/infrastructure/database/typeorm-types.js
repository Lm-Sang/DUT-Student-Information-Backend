import { MssqlParameter } from "typeorm/driver/sqlserver/MssqlParameter.js";
const type = (name, ...params) => ({ name, params });
export const sqlTypes = {
  Int: type("int"),
  BigInt: type("bigint"),
  Bit: type("bit"),
  Date: type("date"),
  DateTime: type("datetime"),
  NVarChar: (length) => type("nvarchar", length),
  VarChar: (length) => type("varchar", length),
  Char: (length) => type("char", length),
  UniqueIdentifier: type("uniqueidentifier"),
};
export const typedParameter = (value, definition) =>
  definition?.name
    ? new MssqlParameter(value, definition.name, ...definition.params)
    : value;
