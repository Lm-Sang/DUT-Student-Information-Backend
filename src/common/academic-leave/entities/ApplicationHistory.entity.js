import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const academic_leave_ApplicationHistory=new EntitySchema({
  "name": "academic_leave_ApplicationHistory",
  "tableName": "ApplicationHistory",
  "schema": "academic_leave",
  "synchronize": false,
  "columns": {
    "Id": {
      "name": "Id",
      "type": "bigint",
      "nullable": false,
      "primary": true,
      "generated": "increment"
    },
    "ApplicationId": {
      "name": "ApplicationId",
      "type": "int",
      "nullable": false
    },
    "Action": {
      "name": "Action",
      "type": "varchar",
      "nullable": false,
      "length": 30
    },
    "ActorSource": {
      "name": "ActorSource",
      "type": "varchar",
      "nullable": false,
      "length": 40
    },
    "ActorReference": {
      "name": "ActorReference",
      "type": "nvarchar",
      "nullable": false,
      "length": 200
    },
    "ActorName": {
      "name": "ActorName",
      "type": "nvarchar",
      "nullable": true,
      "length": 150
    },
    "Status": {
      "name": "Status",
      "type": "varchar",
      "nullable": false,
      "length": 20
    },
    "DataJson": {
      "name": "DataJson",
      "type": "nvarchar",
      "nullable": false,
      "length": "MAX"
    },
    "CreatedAt": {
      "name": "CreatedAt",
      "type": "datetime2",
      "nullable": false,
      "precision": 3
    }
  },
  "relations": {
    "FK_AcademicLeave_History": {
      "type": "many-to-one",
      "target": "academic_leave_Applications",
      "joinColumn": [
        {
          "name": "ApplicationId",
          "referencedColumnName": "Id"
        }
      ],
      "createForeignKeyConstraints": false
    }
  }
});
