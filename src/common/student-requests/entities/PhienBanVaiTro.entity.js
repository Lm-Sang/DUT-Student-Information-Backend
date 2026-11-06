import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const svc_demo_PhienBanVaiTro=new EntitySchema({
  "name": "svc_demo_PhienBanVaiTro",
  "tableName": "PhienBanVaiTro",
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
    "TenRole": {
      "name": "TenRole",
      "type": "nvarchar",
      "nullable": false,
      "length": 150
    },
    "MoTa": {
      "name": "MoTa",
      "type": "nvarchar",
      "nullable": false,
      "length": 1000
    },
    "HieuLuc": {
      "name": "HieuLuc",
      "type": "bit",
      "nullable": false
    },
    "NguoiSua": {
      "name": "NguoiSua",
      "type": "nvarchar",
      "nullable": false,
      "length": 40
    },
    "NgayLuu": {
      "name": "NgayLuu",
      "type": "datetime2",
      "nullable": false,
      "precision": 3
    }
  },
  "relations": {
    "FK__PhienBanV__MaRol__4D5F7D71": {
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
    "FK__PhienBanV__Nguoi__4E53A1AA": {
      "type": "many-to-one",
      "target": "svc_demo_TaiKhoan",
      "joinColumn": [
        {
          "name": "NguoiSua",
          "referencedColumnName": "MaHS"
        }
      ],
      "createForeignKeyConstraints": false
    }
  }
});
