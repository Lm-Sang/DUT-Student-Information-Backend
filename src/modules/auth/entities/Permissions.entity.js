import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const auth_Permissions=new EntitySchema({
  "name": "auth_Permissions",
  "tableName": "Permissions",
  "schema": "auth",
  "synchronize": false,
  "columns": {
    "PermissionName": {
      "name": "PermissionName",
      "type": "nvarchar",
      "nullable": false,
      "primary": true,
      "length": 100
    }
  }
});
