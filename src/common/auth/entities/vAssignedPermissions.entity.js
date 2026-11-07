import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const auth_vAssignedPermissions=new EntitySchema({
  "name": "auth_vAssignedPermissions",
  "tableName": "vAssignedPermissions",
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
    },
    "TaskId": {
      "name": "TaskId",
      "type": "int",
      "nullable": false
    },
    "ModuleCode": {
      "name": "ModuleCode",
      "type": "varchar",
      "nullable": false,
      "length": 40
    }
  },
  "type": "view"
});
