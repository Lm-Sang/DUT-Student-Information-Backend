import {EntitySchema} from 'typeorm';
// School metadata mapping. SELECT only; the DataSource also rejects all writes.
export const DATA_SV1_NhanThan=new EntitySchema({
  "name": "DATA_SV1_NhanThan",
  "tableName": "NhanThan",
  "schema": "dbo",
  "database": "DATA_SV1",
  "synchronize": false,
  "columns": {
    "ID": {
      "name": "ID",
      "type": "int",
      "nullable": false,
      "insert": false,
      "update": false
    },
    "Hocxong": {
      "name": "Hocxong",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "Info_Ngay": {
      "name": "Info_Ngay",
      "type": "datetime",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "Info_Valid": {
      "name": "Info_Valid",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 1
    },
    "LastAnsR": {
      "name": "LastAnsR",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "KhoaTaiKhoan": {
      "name": "KhoaTaiKhoan",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 1
    },
    "DongHocPhi100": {
      "name": "DongHocPhi100",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "LockDK": {
      "name": "LockDK",
      "type": "bit",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "KhoaDKy": {
      "name": "KhoaDKy",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 2
    },
    "MaHS": {
      "name": "MaHS",
      "type": "char",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 9
    },
    "SoThe": {
      "name": "SoThe",
      "type": "char",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 12
    },
    "Hoten": {
      "name": "Hoten",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 50
    },
    "Lop": {
      "name": "Lop",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 20
    },
    "nganh": {
      "name": "nganh",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 100
    },
    "matkhau": {
      "name": "matkhau",
      "type": "varchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "select": false,
      "length": 50
    },
    "ngaymk": {
      "name": "ngaymk",
      "type": "datetime",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "hoso": {
      "name": "hoso",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 1000
    },
    "ngay": {
      "name": "ngay",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 2
    },
    "thang": {
      "name": "thang",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 2
    },
    "nam": {
      "name": "nam",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 4
    },
    "noisinh": {
      "name": "noisinh",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": "MAX"
    },
    "gioitinh": {
      "name": "gioitinh",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "cmnd": {
      "name": "cmnd",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 25
    },
    "dantoc": {
      "name": "dantoc",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 3
    },
    "quoctich": {
      "name": "quoctich",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 5
    },
    "dienthoai": {
      "name": "dienthoai",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 20
    },
    "diachi": {
      "name": "diachi",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": "MAX"
    },
    "Loaidiachi": {
      "name": "Loaidiachi",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 1
    },
    "email": {
      "name": "email",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 50
    },
    "DiachiSauTN": {
      "name": "DiachiSauTN",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": "MAX"
    },
    "Giadinh": {
      "name": "Giadinh",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": "MAX"
    },
    "DienthoaiGD": {
      "name": "DienthoaiGD",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 50
    },
    "ngayluu": {
      "name": "ngayluu",
      "type": "datetime",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DotxetTN": {
      "name": "DotxetTN",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 5
    },
    "NgayDonTN": {
      "name": "NgayDonTN",
      "type": "datetime",
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
      "length": 20
    },
    "DiachiNhanHS": {
      "name": "DiachiNhanHS",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": "MAX"
    },
    "HanTamKhoa": {
      "name": "HanTamKhoa",
      "type": "datetime",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "NgayHTDGCK": {
      "name": "NgayHTDGCK",
      "type": "datetime",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "NgayVaoDoan": {
      "name": "NgayVaoDoan",
      "type": "datetime",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "NgayThoiDoan": {
      "name": "NgayThoiDoan",
      "type": "datetime",
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
      "length": "MAX"
    },
    "XongDoanPhi": {
      "name": "XongDoanPhi",
      "type": "datetime",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "LockDP": {
      "name": "LockDP",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DoanVien": {
      "name": "DoanVien",
      "type": "tinyint",
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
    "DiaChiHK": {
      "name": "DiaChiHK",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": "MAX"
    },
    "Anh_valid": {
      "name": "Anh_valid",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CMNDNgaycap": {
      "name": "CMNDNgaycap",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 10
    },
    "CMNDNoicap": {
      "name": "CMNDNoicap",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 10
    },
    "CMNDFixed": {
      "name": "CMNDFixed",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "Tongiao": {
      "name": "Tongiao",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 2
    },
    "_CMNDNgaycap": {
      "name": "_CMNDNgaycap",
      "type": "date",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "_CMNDNoicap": {
      "name": "_CMNDNoicap",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 2
    },
    "_CMND": {
      "name": "_CMND",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 20
    },
    "DKNV": {
      "name": "DKNV",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "KhaoSatFB": {
      "name": "KhaoSatFB",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "HoKhau_TenChuHo": {
      "name": "HoKhau_TenChuHo",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "HoKhau_NSinh": {
      "name": "HoKhau_NSinh",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 20
    },
    "HoKhau_So": {
      "name": "HoKhau_So",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 50
    },
    "HoKhau_DThoai": {
      "name": "HoKhau_DThoai",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 25
    },
    "HoKhau_DiaPhuong": {
      "name": "HoKhau_DiaPhuong",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 500
    },
    "HoKhau_QuanHe": {
      "name": "HoKhau_QuanHe",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DienThoai_Old": {
      "name": "DienThoai_Old",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 20
    },
    "DienThoaiGD_Old": {
      "name": "DienThoaiGD_Old",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 20
    },
    "DienThoai_Luu1": {
      "name": "DienThoai_Luu1",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 20
    },
    "DienThoai_Luu2": {
      "name": "DienThoai_Luu2",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 20
    },
    "gioitinhCu": {
      "name": "gioitinhCu",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "noisinhCu": {
      "name": "noisinhCu",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": "MAX"
    },
    "dantocCu": {
      "name": "dantocCu",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 3
    },
    "quoctichCu": {
      "name": "quoctichCu",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 5
    },
    "TongiaoCu": {
      "name": "TongiaoCu",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 2
    },
    "dienthoaiCu": {
      "name": "dienthoaiCu",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 20
    },
    "CMNDNgaycapCu": {
      "name": "CMNDNgaycapCu",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 10
    },
    "CMNDNoicapCu": {
      "name": "CMNDNoicapCu",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 10
    },
    "GDinh_DC": {
      "name": "GDinh_DC",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": "MAX"
    },
    "GDinh_Tinh": {
      "name": "GDinh_Tinh",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": "MAX"
    },
    "GDinh_Huyen": {
      "name": "GDinh_Huyen",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": "MAX"
    },
    "GDinh_Xa": {
      "name": "GDinh_Xa",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": "MAX"
    },
    "HoKhau_DC": {
      "name": "HoKhau_DC",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": "MAX"
    },
    "HoKhau_Tinh": {
      "name": "HoKhau_Tinh",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": "MAX"
    },
    "HoKhau_Huyen": {
      "name": "HoKhau_Huyen",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": "MAX"
    },
    "HoKhau_Xa": {
      "name": "HoKhau_Xa",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": "MAX"
    },
    "NoiTro_DC": {
      "name": "NoiTro_DC",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": "MAX"
    },
    "NoiTro_Tinh": {
      "name": "NoiTro_Tinh",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": "MAX"
    },
    "NoiTro_Huyen": {
      "name": "NoiTro_Huyen",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": "MAX"
    },
    "NoiTro_Xa": {
      "name": "NoiTro_Xa",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": "MAX"
    },
    "NguoiThan_DC1": {
      "name": "NguoiThan_DC1",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": "MAX"
    },
    "NguoiThan_DC2": {
      "name": "NguoiThan_DC2",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": "MAX"
    },
    "NguoiThan_Tinh": {
      "name": "NguoiThan_Tinh",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": "MAX"
    },
    "NguoiThan_Huyen": {
      "name": "NguoiThan_Huyen",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": "MAX"
    },
    "NguoiThan_Xa": {
      "name": "NguoiThan_Xa",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": "MAX"
    },
    "SauTN_DC": {
      "name": "SauTN_DC",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": "MAX"
    },
    "SauTN_Tinh": {
      "name": "SauTN_Tinh",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": "MAX"
    },
    "SauTN_Huyen": {
      "name": "SauTN_Huyen",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": "MAX"
    },
    "SauTN_Xa": {
      "name": "SauTN_Xa",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": "MAX"
    },
    "NhanHS_DC": {
      "name": "NhanHS_DC",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": "MAX"
    },
    "NhanHS_Tinh": {
      "name": "NhanHS_Tinh",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": "MAX"
    },
    "NhanHS_Huyen": {
      "name": "NhanHS_Huyen",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": "MAX"
    },
    "NhanHS_Xa": {
      "name": "NhanHS_Xa",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": "MAX"
    },
    "Ten_me": {
      "name": "Ten_me",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 100
    },
    "NgayS_me": {
      "name": "NgayS_me",
      "type": "int",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "ThangS_me": {
      "name": "ThangS_me",
      "type": "int",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "NamS_me": {
      "name": "NamS_me",
      "type": "int",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "Ten_cha": {
      "name": "Ten_cha",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 100
    },
    "NgayS_cha": {
      "name": "NgayS_cha",
      "type": "int",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "ThangS_cha": {
      "name": "ThangS_cha",
      "type": "int",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "NamS_cha": {
      "name": "NamS_cha",
      "type": "int",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "Foreigner": {
      "name": "Foreigner",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "NoiSinhNN": {
      "name": "NoiSinhNN",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 10
    },
    "BHYT_SoThe": {
      "name": "BHYT_SoThe",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 30
    },
    "BHYT_Mien": {
      "name": "BHYT_Mien",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "BHYT_HieuLuc": {
      "name": "BHYT_HieuLuc",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 10
    },
    "Facebook": {
      "name": "Facebook",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "FacebookUrl": {
      "name": "FacebookUrl",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": "MAX"
    },
    "ChonDGTS": {
      "name": "ChonDGTS",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DanhGiaTS_HT": {
      "name": "DanhGiaTS_HT",
      "type": "datetime",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "BHYT_SoThe_Luu": {
      "name": "BHYT_SoThe_Luu",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 30
    },
    "BHYT_HieuLuc_Luu": {
      "name": "BHYT_HieuLuc_Luu",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 10
    },
    "MaNganHang": {
      "name": "MaNganHang",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 4
    },
    "MaLopCN": {
      "name": "MaLopCN",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 10
    },
    "LMS_PW0": {
      "name": "LMS_PW0",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 20
    },
    "HocPhiGoi": {
      "name": "HocPhiGoi",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "Lock_DeNghiXN": {
      "name": "Lock_DeNghiXN",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "MatKhauHis": {
      "name": "MatKhauHis",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": "MAX"
    },
    "MKemail": {
      "name": "MKemail",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 50
    },
    "K_Cha": {
      "name": "K_Cha",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "K_Me": {
      "name": "K_Me",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CCCD_So": {
      "name": "CCCD_So",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 12
    },
    "CCCD_NgCap": {
      "name": "CCCD_NgCap",
      "type": "date",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DaiHoc_Cha": {
      "name": "DaiHoc_Cha",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DaiHoc_Me": {
      "name": "DaiHoc_Me",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CanKeKhaiCT": {
      "name": "CanKeKhaiCT",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "LoaiCTDT": {
      "name": "LoaiCTDT",
      "type": "nchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 10
    },
    "XacnhanCTDT": {
      "name": "XacnhanCTDT",
      "type": "datetime",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "GhichuCTDT": {
      "name": "GhichuCTDT",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 50
    },
    "PassPH": {
      "name": "PassPH",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "NgayXacNhanCCCD": {
      "name": "NgayXacNhanCCCD",
      "type": "datetime",
      "nullable": true,
      "insert": false,
      "update": false,
      "select": false
    }
  },
  "type": "view"
});
