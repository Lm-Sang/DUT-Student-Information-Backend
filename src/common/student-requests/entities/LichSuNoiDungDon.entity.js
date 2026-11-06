import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const svc_demo_LichSuNoiDungDon=new EntitySchema({
  "name": "svc_demo_LichSuNoiDungDon",
  "tableName": "LichSuNoiDungDon",
  "schema": "svc_demo",
  "synchronize": false,
  "columns": {
    "ID": {
      "name": "ID",
      "type": "bigint",
      "nullable": false,
      "primary": true,
      "generated": "increment"
    },
    "IDDon": {
      "name": "IDDon",
      "type": "uniqueidentifier",
      "nullable": false
    },
    "LanBoSung": {
      "name": "LanBoSung",
      "type": "int",
      "nullable": false
    },
    "NguoiLap": {
      "name": "NguoiLap",
      "type": "nvarchar",
      "nullable": false,
      "length": 40
    },
    "NgayLap": {
      "name": "NgayLap",
      "type": "datetime2",
      "nullable": false,
      "precision": 3
    },
    "LoaiDon": {
      "name": "LoaiDon",
      "type": "varchar",
      "nullable": true,
      "length": 20
    },
    "LyDoDeNghi": {
      "name": "LyDoDeNghi",
      "type": "nvarchar",
      "nullable": true,
      "length": 60
    },
    "ThongTinThayDoiThe": {
      "name": "ThongTinThayDoiThe",
      "type": "nvarchar",
      "nullable": true,
      "length": 2000
    },
    "HocKyDuKienTotNghiep": {
      "name": "HocKyDuKienTotNghiep",
      "type": "nvarchar",
      "nullable": true,
      "length": 60
    },
    "HocKyHoanTotNghiep": {
      "name": "HocKyHoanTotNghiep",
      "type": "nvarchar",
      "nullable": true,
      "length": 60
    },
    "HocKyXetHocBong": {
      "name": "HocKyXetHocBong",
      "type": "nvarchar",
      "nullable": true,
      "length": 60
    },
    "LyDo": {
      "name": "LyDo",
      "type": "nvarchar",
      "nullable": true,
      "length": 2000
    },
    "MaNganhTQ": {
      "name": "MaNganhTQ",
      "type": "nvarchar",
      "nullable": true,
      "length": 60
    },
    "HocKyBatDau": {
      "name": "HocKyBatDau",
      "type": "nvarchar",
      "nullable": true,
      "length": 60
    },
    "NoiDungTrinhBay": {
      "name": "NoiDungTrinhBay",
      "type": "nvarchar",
      "nullable": true,
      "length": 2000
    },
    "MaVanban": {
      "name": "MaVanban",
      "type": "nvarchar",
      "nullable": true,
      "length": 60
    },
    "TTbosung": {
      "name": "TTbosung",
      "type": "nvarchar",
      "nullable": true,
      "length": 2000
    },
    "SoLuong": {
      "name": "SoLuong",
      "type": "int",
      "nullable": true
    },
    "MienPhi": {
      "name": "MienPhi",
      "type": "bit",
      "nullable": true
    },
    "Khan": {
      "name": "Khan",
      "type": "bit",
      "nullable": true
    },
    "HocKy": {
      "name": "HocKy",
      "type": "nvarchar",
      "nullable": true,
      "length": 60
    },
    "NamHoc": {
      "name": "NamHoc",
      "type": "nvarchar",
      "nullable": true,
      "length": 60
    },
    "MaEmail": {
      "name": "MaEmail",
      "type": "nvarchar",
      "nullable": true,
      "length": 60
    },
    "LoaiHoTro": {
      "name": "LoaiHoTro",
      "type": "nvarchar",
      "nullable": true,
      "length": 60
    },
    "NoiDungDeNghi": {
      "name": "NoiDungDeNghi",
      "type": "nvarchar",
      "nullable": true,
      "length": 2000
    },
    "EmailLienHe": {
      "name": "EmailLienHe",
      "type": "nvarchar",
      "nullable": true,
      "length": 254
    },
    "XacNhanChuTaiKhoan": {
      "name": "XacNhanChuTaiKhoan",
      "type": "bit",
      "nullable": true
    }
  },
  "relations": {
    "FK__RequestRe__Creat__48CFD27E": {
      "type": "many-to-one",
      "target": "svc_demo_TaiKhoan",
      "joinColumn": [
        {
          "name": "NguoiLap",
          "referencedColumnName": "MaHS"
        }
      ],
      "createForeignKeyConstraints": false
    },
    "FK__RequestRe__Reque__46E78A0C": {
      "type": "many-to-one",
      "target": "svc_demo_DonDeNghi",
      "joinColumn": [
        {
          "name": "IDDon",
          "referencedColumnName": "ID"
        }
      ],
      "createForeignKeyConstraints": false
    }
  }
});
