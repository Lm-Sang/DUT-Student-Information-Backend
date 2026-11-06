import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const auth_AccountRoles=new EntitySchema({
  "name": "auth_AccountRoles",
  "tableName": "AccountRoles",
  "schema": "auth",
  "synchronize": false,
  "columns": {
    "AccountId": {
      "name": "AccountId",
      "type": "uniqueidentifier",
      "nullable": false,
      "primary": true
    },
    "RoleName": {
      "name": "RoleName",
      "type": "nvarchar",
      "nullable": false,
      "primary": true,
      "length": 100
    }
  },
  "relations": {
    "FK__AccountRo__Accou__45000CF1": {
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
    "FK__AccountRo__RoleN__45F4312A": {
      "type": "many-to-one",
      "target": "auth_Roles",
      "joinColumn": [
        {
          "name": "RoleName",
          "referencedColumnName": "RoleName"
        }
      ],
      "createForeignKeyConstraints": false
    }
  }
});
