import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const auth_PermissionDefinitions=new EntitySchema({
  "name": "auth_PermissionDefinitions",
  "tableName": "PermissionDefinitions",
  "schema": "auth",
  "synchronize": false,
  "columns": {
    "PermissionName": {
      "name": "PermissionName",
      "type": "nvarchar",
      "nullable": false,
      "primary": true,
      "length": 100
    },
    "DisplayName": {
      "name": "DisplayName",
      "type": "nvarchar",
      "nullable": false,
      "length": 250
    },
    "GroupName": {
      "name": "GroupName",
      "type": "nvarchar",
      "nullable": false,
      "length": 100
    },
    "FieldCode": {
      "name": "FieldCode",
      "type": "varchar",
      "nullable": false,
      "length": 10
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
    },
    "IsActive": {
      "name": "IsActive",
      "type": "bit",
      "nullable": false
    }
  },
  "relations": {
    "FK__Permissio__Field__08B618C0": {
      "type": "many-to-one",
      "target": "auth_Fields",
      "joinColumn": [
        {
          "name": "FieldCode",
          "referencedColumnName": "FieldCode"
        }
      ],
      "createForeignKeyConstraints": false
    },
    "FK__Permissio__Permi__07C1F487": {
      "type": "many-to-one",
      "target": "auth_Permissions",
      "joinColumn": [
        {
          "name": "PermissionName",
          "referencedColumnName": "PermissionName"
        }
      ],
      "createForeignKeyConstraints": false
    },
    "FK__Permissio__TaskI__09AA3CF9": {
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
