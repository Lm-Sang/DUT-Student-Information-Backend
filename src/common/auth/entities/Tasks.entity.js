import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const auth_Tasks=new EntitySchema({
  "name": "auth_Tasks",
  "tableName": "Tasks",
  "schema": "auth",
  "synchronize": false,
  "columns": {
    "TaskId": {
      "name": "TaskId",
      "type": "int",
      "nullable": false,
      "primary": true
    },
    "TaskCode": {
      "name": "TaskCode",
      "type": "varchar",
      "nullable": false,
      "length": 64
    },
    "TaskName": {
      "name": "TaskName",
      "type": "nvarchar",
      "nullable": false,
      "length": 150
    },
    "FieldCode": {
      "name": "FieldCode",
      "type": "varchar",
      "nullable": false,
      "length": 10
    },
    "IsActive": {
      "name": "IsActive",
      "type": "bit",
      "nullable": false
    }
  },
  "relations": {
    "FK__Tasks__FieldCode__5AEF4E10": {
      "type": "many-to-one",
      "target": "auth_Fields",
      "joinColumn": [
        {
          "name": "FieldCode",
          "referencedColumnName": "FieldCode"
        }
      ],
      "createForeignKeyConstraints": false
    }
  }
});
