import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const svc_demo_TaiKhoanVaiTro=new EntitySchema({
  "name": "svc_demo_TaiKhoanVaiTro",
  "tableName": "TaiKhoanVaiTro",
  "schema": "svc_demo",
  "synchronize": false,
  "columns": {
    "MaHS": {
      "name": "MaHS",
      "type": "nvarchar",
      "nullable": false,
      "primary": true,
      "length": 40
    },
    "MaRole": {
      "name": "MaRole",
      "type": "varchar",
      "nullable": false,
      "primary": true,
      "length": 64
    },
    "NguoiGan": {
      "name": "NguoiGan",
      "type": "nvarchar",
      "nullable": false,
      "length": 40
    },
    "NgayGan": {
      "name": "NgayGan",
      "type": "datetime2",
      "nullable": false,
      "precision": 3
    }
  },
  "relations": {
    "FK__TaiKhoanV__MaRol__43D61337": {
      "type": "many-to-one",
      "target": "svc_demo_VaiTroRBAC",
      "joinColumn": [
        {
          "name": "MaRole",
          "referencedColumnName": "MaRole"
        }
      ],
      "createForeignKeyConstraints": false
    },
    "FK__TaiKhoanV__Nguoi__44CA3770": {
      "type": "many-to-one",
      "target": "svc_demo_TaiKhoan",
      "joinColumn": [
        {
          "name": "NguoiGan",
          "referencedColumnName": "MaHS"
        }
      ],
      "createForeignKeyConstraints": false
    },
    "FK__TaiKhoanVa__MaHS__42E1EEFE": {
      "type": "many-to-one",
      "target": "svc_demo_TaiKhoan",
      "joinColumn": [
        {
          "name": "MaHS",
          "referencedColumnName": "MaHS"
        }
      ],
      "createForeignKeyConstraints": false
    }
  }
});
