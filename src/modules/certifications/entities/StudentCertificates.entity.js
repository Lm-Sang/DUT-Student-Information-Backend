import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const certification_StudentCertificates=new EntitySchema({
  "name": "certification_StudentCertificates",
  "tableName": "StudentCertificates",
  "schema": "certification",
  "synchronize": false,
  "columns": {
    "Id": {
      "name": "Id",
      "type": "uniqueidentifier",
      "nullable": false,
      "primary": true
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
    "StudentCode": {
      "name": "StudentCode",
      "type": "varchar",
      "nullable": false,
      "length": 9
    },
    "CohortYear": {
      "name": "CohortYear",
      "type": "smallint",
      "nullable": false
    },
    "CertificateTypeId": {
      "name": "CertificateTypeId",
      "type": "int",
      "nullable": false
    },
    "FullName": {
      "name": "FullName",
      "type": "nvarchar",
      "nullable": false,
      "length": 150
    },
    "ClassName": {
      "name": "ClassName",
      "type": "nvarchar",
      "nullable": false,
      "length": 50
    },
    "ResultJson": {
      "name": "ResultJson",
      "type": "nvarchar",
      "nullable": false,
      "length": "MAX"
    },
    "CatalogSnapshotJson": {
      "name": "CatalogSnapshotJson",
      "type": "nvarchar",
      "nullable": false,
      "length": "MAX"
    },
    "IssuedOn": {
      "name": "IssuedOn",
      "type": "date",
      "nullable": false
    },
    "Notes": {
      "name": "Notes",
      "type": "nvarchar",
      "nullable": true,
      "length": 2000
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
    "SubmittedAt": {
      "name": "SubmittedAt",
      "type": "datetime2",
      "nullable": true,
      "precision": 3
    },
    "ReviewerReference": {
      "name": "ReviewerReference",
      "type": "nvarchar",
      "nullable": true,
      "length": 128
    },
    "ReviewerName": {
      "name": "ReviewerName",
      "type": "nvarchar",
      "nullable": true,
      "length": 150
    },
    "ReviewerSource": {
      "name": "ReviewerSource",
      "type": "varchar",
      "nullable": true,
      "length": 20
    },
    "ReviewReason": {
      "name": "ReviewReason",
      "type": "nvarchar",
      "nullable": true,
      "length": 2000
    },
    "VerificationMethod": {
      "name": "VerificationMethod",
      "type": "varchar",
      "nullable": true,
      "length": 32
    },
    "ReviewedAt": {
      "name": "ReviewedAt",
      "type": "datetime2",
      "nullable": true,
      "precision": 3
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
    },
    "Cccd": {
      "name": "Cccd",
      "type": "varchar",
      "nullable": true,
      "length": 12
    },
    "IssuingOrganizationId": {
      "name": "IssuingOrganizationId",
      "type": "int",
      "nullable": true
    },
    "WorkflowHistoryJson": {
      "name": "WorkflowHistoryJson",
      "type": "nvarchar",
      "nullable": false,
      "length": "MAX"
    }
  },
  "relations": {
    "FK__StudentCe__Certi__53AD53A4": {
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
    "FK_Certification_TypeIssuer": {
      "type": "many-to-one",
      "target": "certification_CertificateTypeIssuers",
      "joinColumn": [
        {
          "name": "CertificateTypeId",
          "referencedColumnName": "CertificateTypeId"
        },
        {
          "name": "IssuingOrganizationId",
          "referencedColumnName": "IssuingOrganizationId"
        }
      ],
      "createForeignKeyConstraints": false
    }
  }
});
