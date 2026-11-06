import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const certification_tmCNTTChungChi=new EntitySchema({
  "name": "certification_tmCNTTChungChi",
  "tableName": "tmCNTTChungChi",
  "schema": "certification",
  "synchronize": false,
  "columns": {
    "ID": {
      "name": "ID",
      "type": "int",
      "nullable": false,
      "primary": true,
      "generated": "increment"
    },
    "MaCC": {
      "name": "MaCC",
      "type": "nvarchar",
      "nullable": true,
      "length": 10
    },
    "TenCC": {
      "name": "TenCC",
      "type": "nvarchar",
      "nullable": true,
      "length": 50
    }
  }
});
