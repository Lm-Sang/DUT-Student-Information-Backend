import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const auth_Fields=new EntitySchema({
  "name": "auth_Fields",
  "tableName": "Fields",
  "schema": "auth",
  "synchronize": false,
  "columns": {
    "FieldCode": {
      "name": "FieldCode",
      "type": "varchar",
      "nullable": false,
      "primary": true,
      "length": 10
    },
    "FieldName": {
      "name": "FieldName",
      "type": "nvarchar",
      "nullable": false,
      "length": 150
    },
    "IsActive": {
      "name": "IsActive",
      "type": "bit",
      "nullable": false
    }
  }
});
