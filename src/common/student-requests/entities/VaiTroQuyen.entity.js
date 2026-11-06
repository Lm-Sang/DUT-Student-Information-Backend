import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const svc_demo_VaiTroQuyen=new EntitySchema({
  "name": "svc_demo_VaiTroQuyen",
  "tableName": "VaiTroQuyen",
  "schema": "svc_demo",
  "synchronize": false,
  "columns": {
    "MaRole": {
      "name": "MaRole",
      "type": "varchar",
      "nullable": false,
      "primary": true,
      "length": 64
    },
    "MaQuyen": {
      "name": "MaQuyen",
      "type": "varchar",
      "nullable": false,
      "primary": true,
      "length": 100
    }
  },
  "relations": {
    "FK__VaiTroQuy__MaQuy__40058253": {
      "type": "many-to-one",
      "target": "svc_demo_QuyenRBAC",
      "joinColumn": [
        {
          "name": "MaQuyen",
          "referencedColumnName": "MaQuyen"
        }
      ],
      "createForeignKeyConstraints": false
    },
    "FK__VaiTroQuy__MaRol__3F115E1A": {
      "type": "many-to-one",
      "target": "svc_demo_VaiTroRBAC",
      "joinColumn": [
        {
          "name": "MaRole",
          "referencedColumnName": "MaRole"
        }
      ],
      "createForeignKeyConstraints": false
    }
  }
});
