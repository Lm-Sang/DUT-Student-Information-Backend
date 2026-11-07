import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const auth_vEffectivePermissions=new EntitySchema({
  "name": "auth_vEffectivePermissions",
  "tableName": "vEffectivePermissions",
  "schema": "auth",
  "synchronize": false,
  "columns": {
    "AccountId": {
      "name": "AccountId",
      "type": "uniqueidentifier",
      "nullable": false
    },
    "PermissionName": {
      "name": "PermissionName",
      "type": "nvarchar",
      "nullable": false,
      "length": 100
    }
  },
  "type": "view"
});
