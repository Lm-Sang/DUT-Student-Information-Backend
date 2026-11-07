import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const auth_AccountProfiles=new EntitySchema({
  "name": "auth_AccountProfiles",
  "tableName": "AccountProfiles",
  "schema": "auth",
  "synchronize": false,
  "columns": {
    "AccountId": {
      "name": "AccountId",
      "type": "uniqueidentifier",
      "nullable": false,
      "primary": true
    },
    "StaffAccountId": {
      "name": "StaffAccountId",
      "type": "nvarchar",
      "nullable": true,
      "length": 40
    },
    "AccessLevel": {
      "name": "AccessLevel",
      "type": "varchar",
      "nullable": false,
      "length": 20
    },
    "FieldCode": {
      "name": "FieldCode",
      "type": "varchar",
      "nullable": true,
      "length": 10
    },
    "Revision": {
      "name": "Revision",
      "type": "int",
      "nullable": false
    }
  },
  "relations": {
    "FK__AccountPr__Accou__5FB4032D": {
      "type": "many-to-one",
      "target": "auth_LocalAccounts",
      "joinColumn": [
        {
          "name": "AccountId",
          "referencedColumnName": "Id"
        }
      ],
      "createForeignKeyConstraints": false
    },
    "FK__AccountPr__Field__619C4B9F": {
      "type": "many-to-one",
      "target": "auth_Fields",
      "joinColumn": [
        {
          "name": "FieldCode",
          "referencedColumnName": "FieldCode"
        }
      ],
      "createForeignKeyConstraints": false
    },
    "FK__AccountPr__Staff__60A82766": {
      "type": "many-to-one",
      "target": "svc_demo_TaiKhoan",
      "joinColumn": [
        {
          "name": "StaffAccountId",
          "referencedColumnName": "MaHS"
        }
      ],
      "createForeignKeyConstraints": false
    }
  }
});
