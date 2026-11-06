import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const svc_demo_TaiKhoan=new EntitySchema({
  "name": "svc_demo_TaiKhoan",
  "tableName": "TaiKhoan",
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
    "Hoten": {
      "name": "Hoten",
      "type": "nvarchar",
      "nullable": false,
      "length": 150
    },
    "VaiTro": {
      "name": "VaiTro",
      "type": "varchar",
      "nullable": false,
      "length": 20
    },
    "MaDV": {
      "name": "MaDV",
      "type": "varchar",
      "nullable": true,
      "length": 20
    },
    "SoThe": {
      "name": "SoThe",
      "type": "nvarchar",
      "nullable": true,
      "length": 30
    },
    "HieuLuc": {
      "name": "HieuLuc",
      "type": "bit",
      "nullable": false
    },
    "PhienBanQuyen": {
      "name": "PhienBanQuyen",
      "type": "int",
      "nullable": false
    },
    "NguonDanhTinh": {
      "name": "NguonDanhTinh",
      "type": "varchar",
      "nullable": false,
      "length": 20
    },
    "MaHSTruong": {
      "name": "MaHSTruong",
      "type": "nvarchar",
      "nullable": true,
      "length": 40
    }
  }
});
