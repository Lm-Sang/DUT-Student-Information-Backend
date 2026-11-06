import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const svc_demo_QuyenXuLy=new EntitySchema({
  "name": "svc_demo_QuyenXuLy",
  "tableName": "QuyenXuLy",
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
    "MaCongViec": {
      "name": "MaCongViec",
      "type": "varchar",
      "nullable": false,
      "primary": true,
      "length": 60
    },
    "QuyenNhanDon": {
      "name": "QuyenNhanDon",
      "type": "bit",
      "nullable": false
    },
    "QuyenXuLy": {
      "name": "QuyenXuLy",
      "type": "bit",
      "nullable": false
    },
    "NgayCap": {
      "name": "NgayCap",
      "type": "datetime2",
      "nullable": false,
      "precision": 3
    },
    "NguoiCap": {
      "name": "NguoiCap",
      "type": "nvarchar",
      "nullable": true,
      "length": 40
    }
  },
  "relations": {
    "FK__QuyenXuLy__MaHS__2B0A656D": {
      "type": "many-to-one",
      "target": "svc_demo_TaiKhoan",
      "joinColumn": [
        {
          "name": "MaHS",
          "referencedColumnName": "MaHS"
        }
      ],
      "createForeignKeyConstraints": false
    },
    "FK__QuyenXuLy__Nguoi__2CF2ADDF": {
      "type": "many-to-one",
      "target": "svc_demo_TaiKhoan",
      "joinColumn": [
        {
          "name": "NguoiCap",
          "referencedColumnName": "MaHS"
        }
      ],
      "createForeignKeyConstraints": false
    }
  }
});
