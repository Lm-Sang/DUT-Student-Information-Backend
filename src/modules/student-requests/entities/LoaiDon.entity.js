import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const svc_demo_LoaiDon=new EntitySchema({
  "name": "svc_demo_LoaiDon",
  "tableName": "LoaiDon",
  "schema": "svc_demo",
  "synchronize": false,
  "columns": {
    "MaLoaiDon": {
      "name": "MaLoaiDon",
      "type": "varchar",
      "nullable": false,
      "primary": true,
      "length": 20
    },
    "TenLoaiDon": {
      "name": "TenLoaiDon",
      "type": "nvarchar",
      "nullable": false,
      "length": 250
    },
    "Nhom": {
      "name": "Nhom",
      "type": "varchar",
      "nullable": false,
      "length": 30
    },
    "MaDV": {
      "name": "MaDV",
      "type": "varchar",
      "nullable": false,
      "length": 20
    },
    "CachNop": {
      "name": "CachNop",
      "type": "varchar",
      "nullable": false,
      "length": 20
    },
    "MaMauDuLieu": {
      "name": "MaMauDuLieu",
      "type": "varchar",
      "nullable": false,
      "length": 30
    },
    "MaMauIn": {
      "name": "MaMauIn",
      "type": "varchar",
      "nullable": true,
      "length": 30
    },
    "BieuTuong": {
      "name": "BieuTuong",
      "type": "varchar",
      "nullable": false,
      "length": 30
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
    "ThuTu": {
      "name": "ThuTu",
      "type": "int",
      "nullable": false
    }
  }
});
