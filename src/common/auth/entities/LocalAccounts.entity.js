import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const auth_LocalAccounts=new EntitySchema({
  "name": "auth_LocalAccounts",
  "tableName": "LocalAccounts",
  "schema": "auth",
  "synchronize": false,
  "columns": {
    "Id": {
      "name": "Id",
      "type": "uniqueidentifier",
      "nullable": false,
      "primary": true
    },
    "Username": {
      "name": "Username",
      "type": "nvarchar",
      "nullable": false,
      "length": 128
    },
    "DisplayName": {
      "name": "DisplayName",
      "type": "nvarchar",
      "nullable": false,
      "length": 150
    },
    "PasswordHash": {
      "name": "PasswordHash",
      "type": "nvarchar",
      "nullable": false,
      "length": 512
    },
    "Channel": {
      "name": "Channel",
      "type": "varchar",
      "nullable": false,
      "length": 16
    },
    "IsActive": {
      "name": "IsActive",
      "type": "bit",
      "nullable": false
    },
    "CreatedAt": {
      "name": "CreatedAt",
      "type": "datetime2",
      "nullable": false,
      "precision": 7
    },
    "Version": {
      "name": "Version",
      "type": "timestamp",
      "nullable": false,
      "insert": false,
      "update": false
    }
  }
});
