import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const svc_demo_DangNhapChuyenVien=new EntitySchema({
  "name": "svc_demo_DangNhapChuyenVien",
  "tableName": "DangNhapChuyenVien",
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
    "TenDangNhap": {
      "name": "TenDangNhap",
      "type": "varchar",
      "nullable": false,
      "length": 64
    },
    "MatKhauBam": {
      "name": "MatKhauBam",
      "type": "varchar",
      "nullable": false,
      "length": 200
    },
    "NgayTao": {
      "name": "NgayTao",
      "type": "datetime2",
      "nullable": false,
      "precision": 3
    }
  },
  "relations": {
    "FK__DangNhapCh__MaHS__498EEC8D": {
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
