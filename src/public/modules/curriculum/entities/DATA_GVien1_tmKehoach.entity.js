import {EntitySchema} from 'typeorm';
// School metadata mapping. SELECT only; the DataSource also rejects all writes.
export const DATA_GVien1_tmKehoach=new EntitySchema({
  "name": "DATA_GVien1_tmKehoach",
  "tableName": "tmKehoach",
  "schema": "dbo",
  "database": "DATA_GVien1",
  "synchronize": false,
  "columns": {
    "ID": {
      "name": "ID",
      "type": "int",
      "nullable": false,
      "insert": false,
      "update": false,
      "primary": true
    },
    "IDCode": {
      "name": "IDCode",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 4
    },
    "TenKH": {
      "name": "TenKH",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "Lock": {
      "name": "Lock",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "Hientai": {
      "name": "Hientai",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "IDCodeTo": {
      "name": "IDCodeTo",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 4
    },
    "Ngay1": {
      "name": "Ngay1",
      "type": "datetime",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "Ngay2": {
      "name": "Ngay2",
      "type": "datetime",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "XongDK": {
      "name": "XongDK",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "XongKH": {
      "name": "XongKH",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "Khoahoc": {
      "name": "Khoahoc",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 250
    },
    "NgayDau": {
      "name": "NgayDau",
      "type": "date",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "Tuandau": {
      "name": "Tuandau",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "Sotuan": {
      "name": "Sotuan",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "MaNganh": {
      "name": "MaNganh",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 5
    },
    "SoHPMin": {
      "name": "SoHPMin",
      "type": "int",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "SoHPMax": {
      "name": "SoHPMax",
      "type": "int",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "GhiChu": {
      "name": "GhiChu",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "TienPK": {
      "name": "TienPK",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "PubLichThi": {
      "name": "PubLichThi",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "kychothiBS": {
      "name": "kychothiBS",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "HienThiHP": {
      "name": "HienThiHP",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    }
  }
});
