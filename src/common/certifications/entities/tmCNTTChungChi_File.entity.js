import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const certification_tmCNTTChungChi_File=new EntitySchema({
  "name": "certification_tmCNTTChungChi_File",
  "tableName": "tmCNTTChungChi_File",
  "schema": "certification",
  "synchronize": false,
  "columns": {
    "Id": {
      "name": "Id",
      "type": "uniqueidentifier",
      "nullable": false,
      "primary": true
    },
    "ApplicationId": {
      "name": "ApplicationId",
      "type": "uniqueidentifier",
      "nullable": false
    },
    "SubmissionId": {
      "name": "SubmissionId",
      "type": "uniqueidentifier",
      "nullable": false
    },
    "CertificateId": {
      "name": "CertificateId",
      "type": "int",
      "nullable": false
    },
    "Sequence": {
      "name": "Sequence",
      "type": "int",
      "nullable": false
    },
    "ActorReference": {
      "name": "ActorReference",
      "type": "nvarchar",
      "nullable": false,
      "length": 128
    },
    "ActorSource": {
      "name": "ActorSource",
      "type": "varchar",
      "nullable": false,
      "length": 20
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
    "ExpiresAt": {
      "name": "ExpiresAt",
      "type": "datetime2",
      "nullable": false,
      "precision": 3
    },
    "ClaimToken": {
      "name": "ClaimToken",
      "type": "uniqueidentifier",
      "nullable": true
    },
    "InspectionJson": {
      "name": "InspectionJson",
      "type": "nvarchar",
      "nullable": true,
      "length": "MAX"
    },
    "ReviewJson": {
      "name": "ReviewJson",
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
    "UpdatedAt": {
      "name": "UpdatedAt",
      "type": "datetime2",
      "nullable": false,
      "precision": 3
    },
    "CompletedAt": {
      "name": "CompletedAt",
      "type": "datetime2",
      "nullable": true,
      "precision": 3
    },
    "RowVersion": {
      "name": "RowVersion",
      "type": "timestamp",
      "nullable": false,
      "insert": false,
      "update": false
    },
    "StudentSnapshotJson": {
      "name": "StudentSnapshotJson",
      "type": "nvarchar",
      "nullable": true,
      "length": "MAX"
    }
  },
  "relations": {
    "FK_CNTTFile_Student": {
      "type": "many-to-one",
      "target": "certification_tmCNTTChungChi_SV",
      "joinColumn": [
        {
          "name": "CertificateId",
          "referencedColumnName": "ID"
        }
      ],
      "createForeignKeyConstraints": false
    }
  }
});
