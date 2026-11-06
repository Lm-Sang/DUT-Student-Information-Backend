import {EntitySchema} from 'typeorm';
// School metadata mapping. SELECT only; the DataSource also rejects all writes.
export const DATA_GVien1_tmHocPhan=new EntitySchema({
  "name": "DATA_GVien1_tmHocPhan",
  "tableName": "tmHocPhan",
  "schema": "dbo",
  "database": "DATA_GVien1",
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
      "update": false,
      "primary": true
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
    "HSCB": {
      "name": "HSCB",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
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
    "PhanBo": {
      "name": "PhanBo",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "ChuanKT": {
      "name": "ChuanKT",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": "MAX"
    },
    "ChuanKyNang": {
      "name": "ChuanKyNang",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": "MAX"
    },
    "ChuanTDo": {
      "name": "ChuanTDo",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": "MAX"
    },
    "NVDuLop": {
      "name": "NVDuLop",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "NVBaiTap": {
      "name": "NVBaiTap",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "NVThiNghiem": {
      "name": "NVThiNghiem",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "NVTieuLuan": {
      "name": "NVTieuLuan",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "NVThuHoach": {
      "name": "NVThuHoach",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "NVBaoCao": {
      "name": "NVBaoCao",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "NVKhac": {
      "name": "NVKhac",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": "MAX"
    },
    "DaoDucKH": {
      "name": "DaoDucKH",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": "MAX"
    },
    "ChuanDR": {
      "name": "ChuanDR",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": "MAX"
    },
    "LoaiPhong": {
      "name": "LoaiPhong",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 5
    },
    "GVNhapLT": {
      "name": "GVNhapLT",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 5
    },
    "XacNhan": {
      "name": "XacNhan",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "GiaoTrinh": {
      "name": "GiaoTrinh",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": "MAX"
    },
    "KyHieu2": {
      "name": "KyHieu2",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 50
    },
    "HPao": {
      "name": "HPao",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DATN": {
      "name": "DATN",
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
    "PBL": {
      "name": "PBL",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "HPTH": {
      "name": "HPTH",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "SoPhutThi": {
      "name": "SoPhutThi",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 5
    },
    "MaCTD_LastUp_U": {
      "name": "MaCTD_LastUp_U",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 10
    },
    "MaCTD_LastUp_T": {
      "name": "MaCTD_LastUp_T",
      "type": "datetime",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "MaHT": {
      "name": "MaHT",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 4
    },
    "HTKiemTraCK1": {
      "name": "HTKiemTraCK1",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 10
    }
  }
});
