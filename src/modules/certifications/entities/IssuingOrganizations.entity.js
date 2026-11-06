import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const certification_IssuingOrganizations=new EntitySchema({
  "name": "certification_IssuingOrganizations",
  "tableName": "IssuingOrganizations",
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
      "type": "varchar",
      "nullable": false,
      "length": 50
    },
    "DisplayName": {
      "name": "DisplayName",
      "type": "nvarchar",
      "nullable": false,
      "length": 250
    },
    "IsActive": {
      "name": "IsActive",
      "type": "bit",
      "nullable": false
    },
    "SourceUrl": {
      "name": "SourceUrl",
      "type": "nvarchar",
      "nullable": false,
      "length": 1000
    },
    "VerifiedOn": {
      "name": "VerifiedOn",
      "type": "date",
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
