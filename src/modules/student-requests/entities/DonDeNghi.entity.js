import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const svc_demo_DonDeNghi=new EntitySchema({
  "name": "svc_demo_DonDeNghi",
  "tableName": "DonDeNghi",
  "schema": "svc_demo",
  "synchronize": false,
  "columns": {
    "ID": {
      "name": "ID",
      "type": "uniqueidentifier",
      "nullable": false,
      "primary": true
    },
    "STT": {
      "name": "STT",
      "type": "bigint",
      "nullable": false,
      "generated": "increment"
    },
    "MaHS": {
      "name": "MaHS",
      "type": "nvarchar",
      "nullable": false,
      "length": 40
    },
    "LoaiDon": {
      "name": "LoaiDon",
      "type": "varchar",
      "nullable": false,
      "length": 20
    },
    "MaDV": {
      "name": "MaDV",
      "type": "varchar",
      "nullable": false,
      "length": 20
    },
    "TrangThai": {
      "name": "TrangThai",
      "type": "varchar",
      "nullable": false,
      "length": 30
    },
    "IDCode": {
      "name": "IDCode",
      "type": "nvarchar",
      "nullable": false,
      "length": 12
    },
    "MaCBND": {
      "name": "MaCBND",
      "type": "nvarchar",
      "nullable": true,
      "length": 40
    },
    "NgayDeNghi": {
      "name": "NgayDeNghi",
      "type": "datetime2",
      "nullable": false,
      "precision": 3
    },
    "NgayCapNhat": {
      "name": "NgayCapNhat",
      "type": "datetime2",
      "nullable": false,
      "precision": 3
    },
    "NgayNhanDon": {
      "name": "NgayNhanDon",
      "type": "datetime2",
      "nullable": true,
      "precision": 3
    },
    "NgayHoanTat": {
      "name": "NgayHoanTat",
      "type": "datetime2",
      "nullable": true,
      "precision": 3
    },
    "TruongPhanHoi": {
      "name": "TruongPhanHoi",
      "type": "nvarchar",
      "nullable": true,
      "length": 2000
    },
    "KetQuaXuLy": {
      "name": "KetQuaXuLy",
      "type": "nvarchar",
      "nullable": true,
      "length": 2000
    },
    "VaiTroNguoiHuy": {
      "name": "VaiTroNguoiHuy",
      "type": "varchar",
      "nullable": true,
      "length": 20
    },
    "NguoiHuy": {
      "name": "NguoiHuy",
      "type": "nvarchar",
      "nullable": true,
      "length": 40
    },
    "LyDoHuy": {
      "name": "LyDoHuy",
      "type": "nvarchar",
      "nullable": true,
      "length": 2000
    },
    "NgayHuy": {
      "name": "NgayHuy",
      "type": "datetime2",
      "nullable": true,
      "precision": 3
    },
    "PhienBan": {
      "name": "PhienBan",
      "type": "int",
      "nullable": false
    },
    "NgayIn": {
      "name": "NgayIn",
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
    "ngaytraHS": {
      "name": "ngaytraHS",
      "type": "datetime2",
      "nullable": true,
      "precision": 3
    },
    "NgayXuLy": {
      "name": "NgayXuLy",
      "type": "datetime2",
      "nullable": true,
      "precision": 3
    },
    "NgayInGanNhat": {
      "name": "NgayInGanNhat",
      "type": "datetime2",
      "nullable": true,
      "precision": 3
    },
    "QuyTacHenTra": {
      "name": "QuyTacHenTra",
      "type": "varchar",
      "nullable": true,
      "length": 40
    }
  },
  "relations": {
    "FK__Request__Assigne__3C69FB99": {
      "type": "many-to-one",
      "target": "svc_demo_TaiKhoan",
      "joinColumn": [
        {
          "name": "MaCBND",
          "referencedColumnName": "MaHS"
        }
      ],
      "createForeignKeyConstraints": false
    },
    "FK__Request__Cancell__403A8C7D": {
      "type": "many-to-one",
      "target": "svc_demo_TaiKhoan",
      "joinColumn": [
        {
          "name": "NguoiHuy",
          "referencedColumnName": "MaHS"
        }
      ],
      "createForeignKeyConstraints": false
    },
    "FK__Request__Student__34C8D9D1": {
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
    "FK__Request__Submitt__3B75D760": {
      "type": "many-to-one",
      "target": "svc_demo_tmKehoach",
      "joinColumn": [
        {
          "name": "IDCode",
          "referencedColumnName": "IDCode"
        }
      ],
      "createForeignKeyConstraints": false
    }
  }
});
