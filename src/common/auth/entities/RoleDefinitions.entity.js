import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const auth_RoleDefinitions=new EntitySchema({
  "name": "auth_RoleDefinitions",
  "tableName": "RoleDefinitions",
  "schema": "auth",
  "synchronize": false,
  "columns": {
    "RoleName": {
      "name": "RoleName",
      "type": "nvarchar",
      "nullable": false,
      "primary": true,
      "length": 100
    },
    "DisplayName": {
      "name": "DisplayName",
      "type": "nvarchar",
      "nullable": false,
      "length": 150
    },
    "Description": {
      "name": "Description",
      "type": "nvarchar",
      "nullable": false,
      "length": 1000
    },
    "FieldCode": {
      "name": "FieldCode",
      "type": "varchar",
      "nullable": false,
      "length": 10
    },
    "IsActive": {
      "name": "IsActive",
      "type": "bit",
      "nullable": false
    },
    "Revision": {
      "name": "Revision",
      "type": "int",
      "nullable": false
    }
  },
  "relations": {
    "FK__RoleDefin__Field__0F63164F": {
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
    "FK__RoleDefin__RoleN__0D7ACDDD": {
      "type": "many-to-one",
      "target": "auth_Roles",
      "joinColumn": [
        {
          "name": "RoleName",
          "referencedColumnName": "RoleName"
        }
      ],
      "createForeignKeyConstraints": false
    }
  }
});
