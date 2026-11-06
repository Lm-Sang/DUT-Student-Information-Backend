import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const certification_CertificateLevels=new EntitySchema({
  "name": "certification_CertificateLevels",
  "tableName": "CertificateLevels",
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
    "CertificateTypeId": {
      "name": "CertificateTypeId",
      "type": "int",
      "nullable": false
    },
    "Code": {
      "name": "Code",
      "type": "nvarchar",
      "nullable": true,
      "length": 100
    },
    "DisplayName": {
      "name": "DisplayName",
      "type": "nvarchar",
      "nullable": true,
      "length": 200
    },
    "Weight": {
      "name": "Weight",
      "type": "float",
      "nullable": true
    },
    "Notes": {
      "name": "Notes",
      "type": "nvarchar",
      "nullable": true,
      "length": 250
    },
    "SchoolId": {
      "name": "SchoolId",
      "type": "int",
      "nullable": true
    },
    "IsSchoolProvided": {
      "name": "IsSchoolProvided",
      "type": "bit",
      "nullable": false
    },
    "SortOrder": {
      "name": "SortOrder",
      "type": "int",
      "nullable": false
    },
    "ImportedAt": {
      "name": "ImportedAt",
      "type": "datetimeoffset",
      "nullable": true,
      "precision": 3
    }
  },
  "relations": {
    "FK__Certifica__Certi__251C81ED": {
      "type": "many-to-one",
      "target": "certification_CertificateTypes",
      "joinColumn": [
        {
          "name": "CertificateTypeId",
          "referencedColumnName": "Id"
        }
      ],
      "createForeignKeyConstraints": false
    }
  }
});
