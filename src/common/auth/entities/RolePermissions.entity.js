import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const auth_RolePermissions=new EntitySchema({
  "name": "auth_RolePermissions",
  "tableName": "RolePermissions",
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
    "PermissionName": {
      "name": "PermissionName",
      "type": "nvarchar",
      "nullable": false,
      "primary": true,
      "length": 100
    }
  },
  "relations": {
    "FK__RolePermi__Permi__4D9552F2": {
      "type": "many-to-one",
      "target": "auth_Permissions",
      "joinColumn": [
        {
          "name": "PermissionName",
          "referencedColumnName": "PermissionName"
        }
      ],
      "createForeignKeyConstraints": false
    },
    "FK__RolePermi__RoleN__4CA12EB9": {
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
