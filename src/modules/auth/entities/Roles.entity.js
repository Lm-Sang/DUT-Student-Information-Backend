import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const auth_Roles=new EntitySchema({
  "name": "auth_Roles",
  "tableName": "Roles",
  "schema": "auth",
  "synchronize": false,
  "columns": {
    "RoleName": {
      "name": "RoleName",
      "type": "nvarchar",
      "nullable": false,
      "primary": true,
      "length": 100
    }
  }
});
