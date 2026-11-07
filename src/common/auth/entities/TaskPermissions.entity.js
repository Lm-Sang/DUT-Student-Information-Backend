import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const auth_TaskPermissions=new EntitySchema({
  "name": "auth_TaskPermissions",
  "tableName": "TaskPermissions",
  "schema": "auth",
  "synchronize": false,
  "columns": {
    "TaskId": {
      "name": "TaskId",
      "type": "int",
      "nullable": false,
      "primary": true
    },
    "PermissionName": {
      "name": "PermissionName",
      "type": "nvarchar",
      "nullable": false,
      "primary": true,
      "length": 100
    }
  },
  "relations": {
    "FK__TaskPermi__TaskI__6A3191A0": {
      "type": "many-to-one",
      "target": "auth_Tasks",
      "joinColumn": [
        {
          "name": "TaskId",
          "referencedColumnName": "TaskId"
        }
      ],
      "createForeignKeyConstraints": false
    }
  }
});
