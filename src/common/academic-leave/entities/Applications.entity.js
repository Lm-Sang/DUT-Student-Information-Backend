import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const academic_leave_Applications=new EntitySchema({
  "name": "academic_leave_Applications",
  "tableName": "Applications",
  "schema": "academic_leave",
  "synchronize": false,
  "columns": {
    "Id": {
      "name": "Id",
      "type": "int",
      "nullable": false,
      "primary": true,
      "generated": "increment"
    },
    "StudentCode": {
      "name": "StudentCode",
      "type": "varchar",
      "nullable": false,
      "length": 9
    },
    "ActorSource": {
      "name": "ActorSource",
      "type": "varchar",
      "nullable": false,
      "length": 20
    },
    "ActorReference": {
      "name": "ActorReference",
      "type": "nvarchar",
      "nullable": false,
      "length": 128
    },
    "Kind": {
      "name": "Kind",
      "type": "varchar",
      "nullable": false,
      "length": 10
    },
    "ParentApplicationId": {
      "name": "ParentApplicationId",
      "type": "int",
      "nullable": true
    },
    "ReasonCode": {
      "name": "ReasonCode",
      "type": "varchar",
      "nullable": false,
      "length": 20
    },
    "StartSemesterCode": {
      "name": "StartSemesterCode",
      "type": "char",
      "nullable": false,
      "length": 4
    },
    "SemesterCount": {
      "name": "SemesterCount",
      "type": "tinyint",
      "nullable": false
    },
    "Content": {
      "name": "Content",
      "type": "nvarchar",
      "nullable": false,
      "length": 2000
    },
    "Status": {
      "name": "Status",
      "type": "varchar",
      "nullable": false,
      "length": 20
    },
    "SnapshotJson": {
      "name": "SnapshotJson",
      "type": "nvarchar",
      "nullable": true,
      "length": "MAX"
    },
    "StudentConfirmedAt": {
      "name": "StudentConfirmedAt",
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
    "ReviewNote": {
      "name": "ReviewNote",
      "type": "nvarchar",
      "nullable": true,
      "length": 1000
    },
    "ReviewedAt": {
      "name": "ReviewedAt",
      "type": "datetime2",
      "nullable": true,
      "precision": 3
    },
    "PaperDeadlineAt": {
      "name": "PaperDeadlineAt",
      "type": "datetime2",
      "nullable": true,
      "precision": 3
    },
    "PaperReceivedAt": {
      "name": "PaperReceivedAt",
      "type": "datetime2",
      "nullable": true,
      "precision": 3
    },
    "PaperReceivedBy": {
      "name": "PaperReceivedBy",
      "type": "nvarchar",
      "nullable": true,
      "length": 128
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
    "StudentSequence": {
      "name": "StudentSequence",
      "type": "int",
      "nullable": false
    },
    "RequestCode": {
      "name": "RequestCode",
      "type": "varchar",
      "nullable": true,
      "length": 21,
      "insert": false,
      "update": false
    },
    "ReceivedAt": {
      "name": "ReceivedAt",
      "type": "datetime2",
      "nullable": true,
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
    "FK_AcademicLeave_Parent": {
      "type": "many-to-one",
      "target": "academic_leave_Applications",
      "joinColumn": [
        {
          "name": "ParentApplicationId",
          "referencedColumnName": "Id"
        },
        {
          "name": "StudentCode",
          "referencedColumnName": "StudentCode"
        }
      ],
      "createForeignKeyConstraints": false
    }
  }
});
