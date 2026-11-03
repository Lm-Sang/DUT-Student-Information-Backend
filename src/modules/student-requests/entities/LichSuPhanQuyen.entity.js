import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const svc_demo_LichSuPhanQuyen=new EntitySchema({
  "name": "svc_demo_LichSuPhanQuyen",
  "tableName": "LichSuPhanQuyen",
  "schema": "svc_demo",
  "synchronize": false,
  "columns": {
    "ID": {
      "name": "ID",
      "type": "bigint",
      "nullable": false,
      "primary": true,
      "generated": "increment"
    },
    "MaNguoiCap": {
      "name": "MaNguoiCap",
      "type": "nvarchar",
      "nullable": false,
      "length": 40
    },
    "MaChuyenVien": {
      "name": "MaChuyenVien",
      "type": "nvarchar",
      "nullable": false,
      "length": 40
    },
    "MaCongViec": {
      "name": "MaCongViec",
      "type": "varchar",
      "nullable": false,
      "length": 60
    },
    "DuocXuLy": {
      "name": "DuocXuLy",
      "type": "bit",
      "nullable": false
    },
    "NgayCap": {
      "name": "NgayCap",
      "type": "datetime2",
      "nullable": false,
      "precision": 3
    }
  },
  "relations": {
    "FK__LichSuPha__MaChu__30C33EC3": {
      "type": "many-to-one",
      "target": "svc_demo_TaiKhoan",
      "joinColumn": [
        {
          "name": "MaChuyenVien",
          "referencedColumnName": "MaHS"
        }
      ],
      "createForeignKeyConstraints": false
    },
    "FK__LichSuPha__MaNgu__2FCF1A8A": {
      "type": "many-to-one",
      "target": "svc_demo_TaiKhoan",
      "joinColumn": [
        {
          "name": "MaNguoiCap",
          "referencedColumnName": "MaHS"
        }
      ],
      "createForeignKeyConstraints": false
    }
  }
});
