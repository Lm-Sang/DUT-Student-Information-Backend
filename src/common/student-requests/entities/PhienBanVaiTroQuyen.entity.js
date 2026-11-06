import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const svc_demo_PhienBanVaiTroQuyen=new EntitySchema({
  "name": "svc_demo_PhienBanVaiTroQuyen",
  "tableName": "PhienBanVaiTroQuyen",
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
    "PhienBan": {
      "name": "PhienBan",
      "type": "int",
      "nullable": false,
      "primary": true
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
    "FK__PhienBanV__MaQuy__5224328E": {
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
    "FK__PhienBanVaiTroQu__531856C7": {
      "type": "many-to-one",
      "target": "svc_demo_PhienBanVaiTro",
      "joinColumn": [
        {
          "name": "MaRole",
          "referencedColumnName": "MaRole"
        },
        {
          "name": "PhienBan",
          "referencedColumnName": "PhienBan"
        }
      ],
      "createForeignKeyConstraints": false
    }
  }
});
