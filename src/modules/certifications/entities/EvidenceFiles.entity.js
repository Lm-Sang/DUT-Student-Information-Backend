import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const certification_EvidenceFiles=new EntitySchema({
  "name": "certification_EvidenceFiles",
  "tableName": "EvidenceFiles",
  "schema": "certification",
  "synchronize": false,
  "columns": {
    "Id": {
      "name": "Id",
      "type": "uniqueidentifier",
      "nullable": false,
      "primary": true
    },
    "CertificateId": {
      "name": "CertificateId",
      "type": "uniqueidentifier",
      "nullable": false
    },
    "Purpose": {
      "name": "Purpose",
      "type": "varchar",
      "nullable": false,
      "length": 32
    },
    "OriginalFileName": {
      "name": "OriginalFileName",
      "type": "nvarchar",
      "nullable": false,
      "length": 255
    },
    "DeclaredContentType": {
      "name": "DeclaredContentType",
      "type": "varchar",
      "nullable": false,
      "length": 100
    },
    "DeclaredSizeBytes": {
      "name": "DeclaredSizeBytes",
      "type": "bigint",
      "nullable": false
    },
    "Bucket": {
      "name": "Bucket",
      "type": "varchar",
      "nullable": false,
      "length": 63
    },
    "ObjectKey": {
      "name": "ObjectKey",
      "type": "varchar",
      "nullable": false,
      "length": 512
    },
    "Status": {
      "name": "Status",
      "type": "varchar",
      "nullable": false,
      "length": 20
    },
    "InspectionJson": {
      "name": "InspectionJson",
      "type": "nvarchar",
      "nullable": true,
      "length": "MAX"
    },
    "CreatedAt": {
      "name": "CreatedAt",
      "type": "datetime2",
      "nullable": false,
      "precision": 3
    },
    "CompletedAt": {
      "name": "CompletedAt",
      "type": "datetime2",
      "nullable": true,
      "precision": 3
    }
  },
  "relations": {
    "FK__EvidenceF__Certi__61FB72FB": {
      "type": "many-to-one",
      "target": "certification_StudentCertificates",
      "joinColumn": [
        {
          "name": "CertificateId",
          "referencedColumnName": "Id"
        }
      ],
      "createForeignKeyConstraints": false
    }
  }
});
