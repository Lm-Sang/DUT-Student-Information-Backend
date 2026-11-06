import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const auth_AccountPermissions=new EntitySchema({
  "name": "auth_AccountPermissions",
  "tableName": "AccountPermissions",
  "schema": "auth",
  "synchronize": false,
  "columns": {
    "AccountId": {
      "name": "AccountId",
      "type": "uniqueidentifier",
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
    "FK__AccountPe__Accou__48D09DD5": {
      "type": "many-to-one",
      "target": "auth_LocalAccounts",
      "joinColumn": [
        {
          "name": "AccountId",
          "referencedColumnName": "Id"
        }
      ],
      "createForeignKeyConstraints": false
    },
    "FK__AccountPe__Permi__49C4C20E": {
      "type": "many-to-one",
      "target": "auth_Permissions",
      "joinColumn": [
        {
          "name": "PermissionName",
          "referencedColumnName": "PermissionName"
        }
      ],
      "createForeignKeyConstraints": false
    }
  }
});
