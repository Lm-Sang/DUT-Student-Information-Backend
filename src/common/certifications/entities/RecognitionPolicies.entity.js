import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const certification_RecognitionPolicies=new EntitySchema({
  "name": "certification_RecognitionPolicies",
  "tableName": "RecognitionPolicies",
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
    "CertificateTypeId": {
      "name": "CertificateTypeId",
      "type": "int",
      "nullable": true
    },
    "CohortFrom": {
      "name": "CohortFrom",
      "type": "smallint",
      "nullable": false
    },
    "CohortTo": {
      "name": "CohortTo",
      "type": "smallint",
      "nullable": true
    },
    "IsRecognized": {
      "name": "IsRecognized",
      "type": "bit",
      "nullable": false
    },
    "Reason": {
      "name": "Reason",
      "type": "nvarchar",
      "nullable": true,
      "length": 2000
    },
    "DocumentReference": {
      "name": "DocumentReference",
      "type": "nvarchar",
      "nullable": true,
      "length": 255
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
    "FK__Recogniti__Certi__2CBDA3B5": {
      "type": "many-to-one",
      "target": "certification_CertificateTypes",
      "joinColumn": [
        {
          "name": "CertificateTypeId",
          "referencedColumnName": "Id"
        }
      ],
      "createForeignKeyConstraints": false
    },
    "FK__Recogniti__Langu__2BC97F7C": {
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
