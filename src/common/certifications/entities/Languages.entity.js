import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const certification_Languages=new EntitySchema({
  "name": "certification_Languages",
  "tableName": "Languages",
  "schema": "certification",
  "synchronize": false,
  "columns": {
    "Id": {
      "name": "Id",
      "type": "int",
      "nullable": false,
      "primary": true,
      "generated": "increment"
    },
    "Code": {
      "name": "Code",
      "type": "nvarchar",
      "nullable": false,
      "length": 10
    },
    "DisplayName": {
      "name": "DisplayName",
      "type": "nvarchar",
      "nullable": false,
      "length": 100
    },
    "IsPublished": {
      "name": "IsPublished",
      "type": "bit",
      "nullable": false
    },
    "IsSchoolProvided": {
      "name": "IsSchoolProvided",
      "type": "bit",
      "nullable": false
    },
    "Revision": {
      "name": "Revision",
      "type": "int",
      "nullable": false
    },
    "CreatedAt": {
      "name": "CreatedAt",
      "type": "datetime2",
      "nullable": false,
      "precision": 3
    },
    "UpdatedAt": {
      "name": "UpdatedAt",
      "type": "datetime2",
      "nullable": false,
      "precision": 3
    },
    "RowVersion": {
      "name": "RowVersion",
      "type": "timestamp",
      "nullable": false,
      "insert": false,
      "update": false
    }
  }
});
