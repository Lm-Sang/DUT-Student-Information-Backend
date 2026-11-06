import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const certification_CertificateTypes=new EntitySchema({
  "name": "certification_CertificateTypes",
  "tableName": "CertificateTypes",
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
    "LanguageId": {
      "name": "LanguageId",
      "type": "int",
      "nullable": true
    },
    "Code": {
      "name": "Code",
      "type": "nvarchar",
      "nullable": false,
      "length": 50
    },
    "DisplayName": {
      "name": "DisplayName",
      "type": "nvarchar",
      "nullable": false,
      "length": 200
    },
    "FormSchemaJson": {
      "name": "FormSchemaJson",
      "type": "nvarchar",
      "nullable": false,
      "length": "MAX"
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
    "SchoolId": {
      "name": "SchoolId",
      "type": "int",
      "nullable": true
    },
    "ConversionFlag": {
      "name": "ConversionFlag",
      "type": "tinyint",
      "nullable": true
    },
    "Notes": {
      "name": "Notes",
      "type": "nvarchar",
      "nullable": true,
      "length": 250
    },
    "ImportedAt": {
      "name": "ImportedAt",
      "type": "datetimeoffset",
      "nullable": true,
      "precision": 3
    },
    "BaseCertificateTypeId": {
      "name": "BaseCertificateTypeId",
      "type": "int",
      "nullable": true
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
  },
  "relations": {
    "FK__Certifica__BaseC__19AACF41": {
      "type": "many-to-one",
      "target": "certification_CertificateTypes",
      "joinColumn": [
        {
          "name": "BaseCertificateTypeId",
          "referencedColumnName": "Id"
        }
      ],
      "createForeignKeyConstraints": false
    },
    "FK__Certifica__Langu__16CE6296": {
      "type": "many-to-one",
      "target": "certification_Languages",
      "joinColumn": [
        {
          "name": "LanguageId",
          "referencedColumnName": "Id"
        }
      ],
      "createForeignKeyConstraints": false
    }
  }
});
