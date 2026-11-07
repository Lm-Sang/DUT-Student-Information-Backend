import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const auth_AccountSecurityEvents=new EntitySchema({
  "name": "auth_AccountSecurityEvents",
  "tableName": "AccountSecurityEvents",
  "schema": "auth",
  "synchronize": false,
  "columns": {
    "Id": {
      "name": "Id",
      "type": "bigint",
      "nullable": false,
      "primary": true,
      "generated": "increment"
    },
    "ActorId": {
      "name": "ActorId",
      "type": "uniqueidentifier",
      "nullable": false
    },
    "TargetId": {
      "name": "TargetId",
      "type": "uniqueidentifier",
      "nullable": false
    },
    "Action": {
      "name": "Action",
      "type": "varchar",
      "nullable": false,
      "length": 32
    },
    "CreatedAt": {
      "name": "CreatedAt",
      "type": "datetime2",
      "nullable": false,
      "precision": 7
    }
  },
  "relations": {
    "FK__AccountSe__Actor__6D0DFE4B": {
      "type": "many-to-one",
      "target": "auth_LocalAccounts",
      "joinColumn": [
        {
          "name": "ActorId",
          "referencedColumnName": "Id"
        }
      ],
      "createForeignKeyConstraints": false
    },
    "FK__AccountSe__Targe__6E022284": {
      "type": "many-to-one",
      "target": "auth_LocalAccounts",
      "joinColumn": [
        {
          "name": "TargetId",
          "referencedColumnName": "Id"
        }
      ],
      "createForeignKeyConstraints": false
    }
  }
});
