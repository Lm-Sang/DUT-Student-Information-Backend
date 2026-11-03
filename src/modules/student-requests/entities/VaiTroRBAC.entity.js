import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const svc_demo_VaiTroRBAC=new EntitySchema({
  "name": "svc_demo_VaiTroRBAC",
  "tableName": "VaiTroRBAC",
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
    "PhienBan": {
      "name": "PhienBan",
      "type": "int",
      "nullable": false
    },
    "NgayTao": {
      "name": "NgayTao",
      "type": "datetime2",
      "nullable": false,
      "precision": 3
    },
    "NgayCapNhat": {
      "name": "NgayCapNhat",
      "type": "datetime2",
      "nullable": false,
      "precision": 3
    },
    "NguoiTao": {
      "name": "NguoiTao",
      "type": "nvarchar",
      "nullable": false,
      "length": 40
    }
  },
  "relations": {
    "FK__VaiTroRBA__Nguoi__3C34F16F": {
      "type": "many-to-one",
      "target": "svc_demo_TaiKhoan",
      "joinColumn": [
        {
          "name": "NguoiTao",
          "referencedColumnName": "MaHS"
        }
      ],
      "createForeignKeyConstraints": false
    }
  }
});
