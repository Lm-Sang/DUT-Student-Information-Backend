import {EntitySchema} from 'typeorm';
// School metadata mapping. SELECT only; the DataSource also rejects all writes.
export const tmProxDUT_tmHoSoSV=new EntitySchema({
  "name": "tmProxDUT_tmHoSoSV",
  "tableName": "tmHoSoSV",
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
    "MaHS": {
      "name": "MaHS",
      "type": "nvarchar",
      "nullable": false,
      "insert": false,
      "update": false,
      "length": 9
    },
    "SoTheSV": {
      "name": "SoTheSV",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 12
    },
    "MaLop": {
      "name": "MaLop",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 7
    },
    "Hoten": {
      "name": "Hoten",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 50
    },
    "TenViet": {
      "name": "TenViet",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 128
    },
    "Gioitinh": {
      "name": "Gioitinh",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "Anh": {
      "name": "Anh",
      "type": "image",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "Ngaysinh": {
      "name": "Ngaysinh",
      "type": "date",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "NoiSinh": {
      "name": "NoiSinh",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "MaChucVu": {
      "name": "MaChucVu",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 6
    },
    "DanToc": {
      "name": "DanToc",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 6
    },
    "TonGiao": {
      "name": "TonGiao",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 6
    },
    "QueQuan": {
      "name": "QueQuan",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "MaNganh": {
      "name": "MaNganh",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 7
    },
    "DiaChi": {
      "name": "DiaChi",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "LienLac": {
      "name": "LienLac",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "Mobile": {
      "name": "Mobile",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 50
    },
    "Dienthoai": {
      "name": "Dienthoai",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 50
    },
    "EMail": {
      "name": "EMail",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "nick": {
      "name": "nick",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 128
    },
    "Matkhau": {
      "name": "Matkhau",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "select": false,
      "length": 255
    },
    "STT": {
      "name": "STT",
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
    "TPGiaDinh": {
      "name": "TPGiaDinh",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 6
    },
    "TPBanThan": {
      "name": "TPBanThan",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 6
    },
    "NgayDoan": {
      "name": "NgayDoan",
      "type": "date",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "NgayDang": {
      "name": "NgayDang",
      "type": "date",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "Ngaychinhthuc": {
      "name": "Ngaychinhthuc",
      "type": "date",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "NgoaiNgu": {
      "name": "NgoaiNgu",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 6
    },
    "QuocTich": {
      "name": "QuocTich",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 6
    },
    "DiaChi2": {
      "name": "DiaChi2",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "Doan": {
      "name": "Doan",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "Dang": {
      "name": "Dang",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "ktx": {
      "name": "ktx",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 10
    },
    "NgayNhapHoc": {
      "name": "NgayNhapHoc",
      "type": "date",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "Hokhau": {
      "name": "Hokhau",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 6
    },
    "DiemDV": {
      "name": "DiemDV",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "SoHS": {
      "name": "SoHS",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 20
    },
    "DoiTuong": {
      "name": "DoiTuong",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 6
    },
    "SoBD": {
      "name": "SoBD",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 20
    },
    "KhuVuc": {
      "name": "KhuVuc",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 6
    },
    "NganhTS": {
      "name": "NganhTS",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 6
    },
    "SoCMND": {
      "name": "SoCMND",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 16
    },
    "NgayCapCMND": {
      "name": "NgayCapCMND",
      "type": "date",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "NoiCapCMND": {
      "name": "NoiCapCMND",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 50
    },
    "Quatrinh": {
      "name": "Quatrinh",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "HeDT": {
      "name": "HeDT",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 6
    },
    "CapDT": {
      "name": "CapDT",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 6
    },
    "MaNganh1": {
      "name": "MaNganh1",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 7
    },
    "HeDT1": {
      "name": "HeDT1",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 6
    },
    "CapDT1": {
      "name": "CapDT1",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 6
    },
    "IDCodeN1": {
      "name": "IDCodeN1",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 4
    },
    "MaNganh2": {
      "name": "MaNganh2",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 7
    },
    "HeDT2": {
      "name": "HeDT2",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 6
    },
    "CapDT2": {
      "name": "CapDT2",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 6
    },
    "IDCodeN2": {
      "name": "IDCodeN2",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 4
    },
    "NgayLuu": {
      "name": "NgayLuu",
      "type": "date",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "LoaiLuu": {
      "name": "LoaiLuu",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "Cha": {
      "name": "Cha",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 50
    },
    "Me": {
      "name": "Me",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 50
    },
    "PhoneGD": {
      "name": "PhoneGD",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 50
    },
    "NamTN": {
      "name": "NamTN",
      "type": "int",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "Chuho": {
      "name": "Chuho",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 50
    },
    "Nhatro": {
      "name": "Nhatro",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "PhoneTro": {
      "name": "PhoneTro",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 50
    },
    "NgayTru": {
      "name": "NgayTru",
      "type": "date",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DangkyTru": {
      "name": "DangkyTru",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "TenDoiTuong": {
      "name": "TenDoiTuong",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "TenTonGiao": {
      "name": "TenTonGiao",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "smsuni": {
      "name": "smsuni",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "SoTK": {
      "name": "SoTK",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 50
    },
    "NganHang": {
      "name": "NganHang",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 250
    },
    "DathoiCT2": {
      "name": "DathoiCT2",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "NgayDKTN": {
      "name": "NgayDKTN",
      "type": "datetime",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "Tinhtrang1": {
      "name": "Tinhtrang1",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "QDTT": {
      "name": "QDTT",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 50
    },
    "HanHoc": {
      "name": "HanHoc",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 4
    },
    "MaCN": {
      "name": "MaCN",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 7
    },
    "MaCN1": {
      "name": "MaCN1",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 7
    },
    "MaCN2": {
      "name": "MaCN2",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 7
    },
    "IDCodeVao": {
      "name": "IDCodeVao",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 4
    },
    "IDCodeTienDo": {
      "name": "IDCodeTienDo",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 4
    },
    "IDCodeRa": {
      "name": "IDCodeRa",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 4
    },
    "YCNN1": {
      "name": "YCNN1",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 15
    },
    "YCNN2": {
      "name": "YCNN2",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 15
    },
    "KSKhoaVL": {
      "name": "KSKhoaVL",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "KSTimeHTVL": {
      "name": "KSTimeHTVL",
      "type": "datetime",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "KSCoVL": {
      "name": "KSCoVL",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "KSIDCode": {
      "name": "KSIDCode",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 5
    },
    "KSNhoB": {
      "name": "KSNhoB",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "KSHoTenBan": {
      "name": "KSHoTenBan",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "KSCMNDBan": {
      "name": "KSCMNDBan",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 50
    },
    "KSSoTheBan": {
      "name": "KSSoTheBan",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 50
    },
    "KSTimeDK": {
      "name": "KSTimeDK",
      "type": "datetime",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "MaThangXH": {
      "name": "MaThangXH",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 10
    },
    "MienNNDR": {
      "name": "MienNNDR",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "LoaiCT": {
      "name": "LoaiCT",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 10
    },
    "CLC": {
      "name": "CLC",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "SVHeDT": {
      "name": "SVHeDT",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "SVChuongTrinh": {
      "name": "SVChuongTrinh",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "SVNorm": {
      "name": "SVNorm",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "HocPhiThang": {
      "name": "HocPhiThang",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "TCDKyMax": {
      "name": "TCDKyMax",
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
    "IDCodeMaxCC": {
      "name": "IDCodeMaxCC",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 4
    },
    "HVCaohoc": {
      "name": "HVCaohoc",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "dotxettuyen": {
      "name": "dotxettuyen",
      "type": "nchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 10
    }
  },
  "type": "view"
});
