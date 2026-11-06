import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const svc_demo_LichSuXuLyDon=new EntitySchema({
  "name": "svc_demo_LichSuXuLyDon",
  "tableName": "LichSuXuLyDon",
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
    "MaHS": {
      "name": "MaHS",
      "type": "nvarchar",
      "nullable": false,
      "length": 40
    },
    "VaiTro": {
      "name": "VaiTro",
      "type": "varchar",
      "nullable": false,
      "length": 20
    },
    "ThaoTac": {
      "name": "ThaoTac",
      "type": "varchar",
      "nullable": false,
      "length": 40
    },
    "TrangThaiTruoc": {
      "name": "TrangThaiTruoc",
      "type": "varchar",
      "nullable": true,
      "length": 30
    },
    "TrangThaiSau": {
      "name": "TrangThaiSau",
      "type": "varchar",
      "nullable": false,
      "length": 30
    },
    "NoiDung": {
      "name": "NoiDung",
      "type": "nvarchar",
      "nullable": false,
      "length": 2000
    },
    "NgayLap": {
      "name": "NgayLap",
      "type": "datetime2",
      "nullable": false,
      "precision": 3
    },
    "MaLyDoHuy": {
      "name": "MaLyDoHuy",
      "type": "varchar",
      "nullable": true,
      "length": 40
    },
    "LyDoMau": {
      "name": "LyDoMau",
      "type": "nvarchar",
      "nullable": true,
      "length": 2000
    },
    "NoiDungThem": {
      "name": "NoiDungThem",
      "type": "nvarchar",
      "nullable": true,
      "length": 2000
    },
    "NgayXuLy": {
      "name": "NgayXuLy",
      "type": "datetime2",
      "nullable": true,
      "precision": 3
    },
    "NgayHenTra": {
      "name": "NgayHenTra",
      "type": "datetime2",
      "nullable": true,
      "precision": 3
    },
    "NoiTraHS": {
      "name": "NoiTraHS",
      "type": "nvarchar",
      "nullable": true,
      "length": 500
    },
    "QuyTacHenTra": {
      "name": "QuyTacHenTra",
      "type": "varchar",
      "nullable": true,
      "length": 40
    },
    "MaCBTruoc": {
      "name": "MaCBTruoc",
      "type": "nvarchar",
      "nullable": true,
      "length": 40
    },
    "MaCBSau": {
      "name": "MaCBSau",
      "type": "nvarchar",
      "nullable": true,
      "length": 40
    },
    "LyDoBanGiao": {
      "name": "LyDoBanGiao",
      "type": "nvarchar",
      "nullable": true,
      "length": 2000
    },
    "NgayIn": {
      "name": "NgayIn",
      "type": "datetime2",
      "nullable": true,
      "precision": 3
    }
  },
  "relations": {
    "FK__RequestEv__Actor__4D94879B": {
      "type": "many-to-one",
      "target": "svc_demo_TaiKhoan",
      "joinColumn": [
        {
          "name": "MaHS",
          "referencedColumnName": "MaHS"
        }
      ],
      "createForeignKeyConstraints": false
    },
    "FK__RequestEv__Reque__4CA06362": {
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
