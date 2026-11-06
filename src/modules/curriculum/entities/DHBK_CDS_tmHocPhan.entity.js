import {EntitySchema} from 'typeorm';
// School metadata mapping. SELECT only; the DataSource also rejects all writes.
export const DHBK_CDS_tmHocPhan=new EntitySchema({
  "name": "DHBK_CDS_tmHocPhan",
  "tableName": "tmHocPhan",
  "schema": "dbo",
  "database": "DHBK_CDS",
  "synchronize": false,
  "columns": {
    "150": {
      "name": "150",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "ID": {
      "name": "ID",
      "type": "int",
      "nullable": false,
      "insert": false,
      "update": false
    },
    "MaHP": {
      "name": "MaHP",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 7
    },
    "TenHP": {
      "name": "TenHP",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "SoTC": {
      "name": "SoTC",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "LyThuyet": {
      "name": "LyThuyet",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "ThucHanh": {
      "name": "ThucHanh",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DoAn": {
      "name": "DoAn",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "BaiTL": {
      "name": "BaiTL",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "ThucTap": {
      "name": "ThucTap",
      "type": "tinyint",
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
    "STT": {
      "name": "STT",
      "type": "int",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "MaThi": {
      "name": "MaThi",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 6
    },
    "MaTT": {
      "name": "MaTT",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 6
    },
    "VietTat": {
      "name": "VietTat",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 50
    },
    "MaCongThuc": {
      "name": "MaCongThuc",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 6
    },
    "LoaiHP": {
      "name": "LoaiHP",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "TenHP1": {
      "name": "TenHP1",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "TenHP2": {
      "name": "TenHP2",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "TenHP3": {
      "name": "TenHP3",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "TenHP4": {
      "name": "TenHP4",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "MaHPxoa": {
      "name": "MaHPxoa",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 5
    },
    "MaBPxoa": {
      "name": "MaBPxoa",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 5
    },
    "Khaosat": {
      "name": "Khaosat",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "MaHPLT": {
      "name": "MaHPLT",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 7
    },
    "Mota": {
      "name": "Mota",
      "type": "ntext",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "Decuong": {
      "name": "Decuong",
      "type": "image",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "theonhom": {
      "name": "theonhom",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "SoSVLT": {
      "name": "SoSVLT",
      "type": "int",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "SoSVTH": {
      "name": "SoSVTH",
      "type": "int",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "SoSVNN": {
      "name": "SoSVNN",
      "type": "int",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "TaiLieuTK": {
      "name": "TaiLieuTK",
      "type": "ntext",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "AnhTat": {
      "name": "AnhTat",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "NoX": {
      "name": "NoX",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "KhoaPC": {
      "name": "KhoaPC",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 3
    },
    "LoaiKL": {
      "name": "LoaiKL",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 6
    },
    "KyHieu": {
      "name": "KyHieu",
      "type": "nchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 10
    },
    "CapDT": {
      "name": "CapDT",
      "type": "nchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 6
    },
    "PhongHoc": {
      "name": "PhongHoc",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "HesoTiet": {
      "name": "HesoTiet",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "HPao": {
      "name": "HPao",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "ChoHocNgoaiNganh": {
      "name": "ChoHocNgoaiNganh",
      "type": "bit",
      "nullable": false,
      "insert": false,
      "update": false
    },
    "DATN": {
      "name": "DATN",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    }
  },
  "type": "view"
});
