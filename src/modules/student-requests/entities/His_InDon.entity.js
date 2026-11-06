import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const svc_demo_His_InDon=new EntitySchema({
  "name": "svc_demo_His_InDon",
  "tableName": "His_InDon",
  "schema": "svc_demo",
  "synchronize": false,
  "columns": {
    "ID": {
      "name": "ID",
      "type": "uniqueidentifier",
      "nullable": false,
      "primary": true
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
    }
  },
  "relations": {
    "FK__His_InDon__ID__05D8E0BE": {
      "type": "many-to-one",
      "target": "svc_demo_DonDeNghi",
      "joinColumn": [
        {
          "name": "ID",
          "referencedColumnName": "ID"
        }
      ],
      "createForeignKeyConstraints": false
    }
  }
});
