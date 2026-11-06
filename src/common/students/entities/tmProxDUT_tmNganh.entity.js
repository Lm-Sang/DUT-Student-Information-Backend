import {EntitySchema} from 'typeorm';
// School metadata mapping. SELECT only; the DataSource also rejects all writes.
export const tmProxDUT_tmNganh=new EntitySchema({
  "name": "tmProxDUT_tmNganh",
  "tableName": "tmNganh",
  "schema": "dbo",
  "database": "tmProxDUT",
  "synchronize": false,
  "columns": {
    "ID": {
      "name": "ID",
      "type": "int",
      "nullable": false,
      "insert": false,
      "update": false
    },
    "MaNganh": {
      "name": "MaNganh",
      "type": "nvarchar",
      "nullable": false,
      "insert": false,
      "update": false,
      "length": 7
    },
    "TenNganh": {
      "name": "TenNganh",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 50
    },
    "Kyhieu": {
      "name": "Kyhieu",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 10
    },
    "SoTinChi": {
      "name": "SoTinChi",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "SoHK": {
      "name": "SoHK",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "Ghichu": {
      "name": "Ghichu",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "Mota": {
      "name": "Mota",
      "type": "ntext",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "Sotuchon": {
      "name": "Sotuchon",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "dKTB": {
      "name": "dKTB",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "TenNganh1": {
      "name": "TenNganh1",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "TenNganh2": {
      "name": "TenNganh2",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "TenNganh3": {
      "name": "TenNganh3",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "TenNganh4": {
      "name": "TenNganh4",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "MaNganhXet": {
      "name": "MaNganhXet",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 7
    },
    "TCThieu": {
      "name": "TCThieu",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "TCThieuTC": {
      "name": "TCThieuTC",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "Chuan": {
      "name": "Chuan",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "Locked": {
      "name": "Locked",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "InUse": {
      "name": "InUse",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "HTDAThieu": {
      "name": "HTDAThieu",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "TCThieuTong": {
      "name": "TCThieuTong",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "Sotuchon1": {
      "name": "Sotuchon1",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "Sotuchon2": {
      "name": "Sotuchon2",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "Sotuchon3": {
      "name": "Sotuchon3",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "NganhTD": {
      "name": "NganhTD",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 7
    },
    "ThongKe": {
      "name": "ThongKe",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CapDT": {
      "name": "CapDT",
      "type": "nchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 6
    },
    "TenCN": {
      "name": "TenCN",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "NganhTKeThoiHoc": {
      "name": "NganhTKeThoiHoc",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 7
    },
    "KyHieu2": {
      "name": "KyHieu2",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 20
    },
    "TenNganhMoi": {
      "name": "TenNganhMoi",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "NhomNganh": {
      "name": "NhomNganh",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 4
    },
    "MaNganhTQ": {
      "name": "MaNganhTQ",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 50
    },
    "PubWeb": {
      "name": "PubWeb",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "NgNguDT": {
      "name": "NgNguDT",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 10
    },
    "BatDau": {
      "name": "BatDau",
      "type": "date",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "KetThuc": {
      "name": "KetThuc",
      "type": "date",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "KyBDau": {
      "name": "KyBDau",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 4
    },
    "KyKThuc": {
      "name": "KyKThuc",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 4
    },
    "SKyThem": {
      "name": "SKyThem",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "SKyThemGDTC": {
      "name": "SKyThemGDTC",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "TChiKy": {
      "name": "TChiKy",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "IDCodeMax": {
      "name": "IDCodeMax",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 4
    },
    "NhomCoBan": {
      "name": "NhomCoBan",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 20
    },
    "LogicErrKy": {
      "name": "LogicErrKy",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 100
    },
    "TenCNAnh": {
      "name": "TenCNAnh",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 500
    },
    "LoaiCTDT": {
      "name": "LoaiCTDT",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 2
    },
    "YCNN": {
      "name": "YCNN",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 15
    }
  },
  "type": "view"
});
