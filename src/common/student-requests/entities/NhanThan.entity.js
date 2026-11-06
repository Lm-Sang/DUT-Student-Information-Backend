import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const svc_demo_NhanThan=new EntitySchema({
  "name": "svc_demo_NhanThan",
  "tableName": "NhanThan",
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
    "NgayCapNhat": {
      "name": "NgayCapNhat",
      "type": "datetime2",
      "nullable": false,
      "precision": 3
    },
    "Hoten": {
      "name": "Hoten",
      "type": "nvarchar",
      "nullable": true,
      "length": 150
    },
    "SoThe": {
      "name": "SoThe",
      "type": "nvarchar",
      "nullable": true,
      "length": 30
    },
    "Lop": {
      "name": "Lop",
      "type": "nvarchar",
      "nullable": true,
      "length": 60
    },
    "NgaySinh": {
      "name": "NgaySinh",
      "type": "date",
      "nullable": true
    },
    "SoCCCD": {
      "name": "SoCCCD",
      "type": "nvarchar",
      "nullable": true,
      "length": 30
    },
    "DienThoai": {
      "name": "DienThoai",
      "type": "nvarchar",
      "nullable": true,
      "length": 30
    },
    "NoiSinh": {
      "name": "NoiSinh",
      "type": "nvarchar",
      "nullable": true,
      "length": 200
    },
    "GioiTinh": {
      "name": "GioiTinh",
      "type": "nvarchar",
      "nullable": true,
      "length": 20
    },
    "DanToc": {
      "name": "DanToc",
      "type": "nvarchar",
      "nullable": true,
      "length": 60
    },
    "TenNganhTQ": {
      "name": "TenNganhTQ",
      "type": "nvarchar",
      "nullable": true,
      "length": 500
    },
    "LoaiAnh": {
      "name": "LoaiAnh",
      "type": "varchar",
      "nullable": true,
      "length": 20
    },
    "AnhSinhVien": {
      "name": "AnhSinhVien",
      "type": "varbinary",
      "nullable": true,
      "length": "MAX"
    },
    "NguonDuLieu": {
      "name": "NguonDuLieu",
      "type": "varchar",
      "nullable": true,
      "length": 40
    },
    "DuLieuThuNghiem": {
      "name": "DuLieuThuNghiem",
      "type": "bit",
      "nullable": false
    },
    "TongTinChiChuongTrinh": {
      "name": "TongTinChiChuongTrinh",
      "type": "decimal",
      "nullable": true,
      "precision": 10,
      "scale": 2
    },
    "TinChiTichLuy": {
      "name": "TinChiTichLuy",
      "type": "decimal",
      "nullable": true,
      "precision": 10,
      "scale": 2
    },
    "DiemTBCTL": {
      "name": "DiemTBCTL",
      "type": "decimal",
      "nullable": true,
      "precision": 10,
      "scale": 2
    },
    "DiemTBRL": {
      "name": "DiemTBRL",
      "type": "decimal",
      "nullable": true,
      "precision": 10,
      "scale": 2
    }
  },
  "relations": {
    "FK__StudentPr__Actor__74AE54BC": {
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
