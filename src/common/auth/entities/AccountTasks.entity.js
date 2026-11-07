import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const auth_AccountTasks=new EntitySchema({
  "name": "auth_AccountTasks",
  "tableName": "AccountTasks",
  "schema": "auth",
  "synchronize": false,
  "columns": {
    "AccountId": {
      "name": "AccountId",
      "type": "uniqueidentifier",
      "nullable": false,
      "primary": true
    },
    "TaskId": {
      "name": "TaskId",
      "type": "int",
      "nullable": false,
      "primary": true
    },
    "FieldCode": {
      "name": "FieldCode",
      "type": "varchar",
      "nullable": false,
      "length": 10
    }
  },
  "relations": {
    "FK__AccountTasks__666100BC": {
      "type": "many-to-one",
      "target": "auth_AccountProfiles",
      "joinColumn": [
        {
          "name": "AccountId",
          "referencedColumnName": "AccountId"
        },
        {
          "name": "FieldCode",
          "referencedColumnName": "FieldCode"
        }
      ],
      "createForeignKeyConstraints": false
    },
    "FK__AccountTasks__675524F5": {
      "type": "many-to-one",
      "target": "auth_Tasks",
      "joinColumn": [
        {
          "name": "TaskId",
          "referencedColumnName": "TaskId"
        },
        {
          "name": "FieldCode",
          "referencedColumnName": "FieldCode"
        }
      ],
      "createForeignKeyConstraints": false
    }
  }
});
