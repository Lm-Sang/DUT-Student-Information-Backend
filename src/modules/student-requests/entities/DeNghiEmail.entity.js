import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const svc_demo_DeNghiEmail=new EntitySchema({
  "name": "svc_demo_DeNghiEmail",
  "tableName": "DeNghiEmail",
  "schema": "svc_demo",
  "synchronize": false,
  "columns": {
    "ID": {
      "name": "ID",
      "type": "uniqueidentifier",
      "nullable": false,
      "primary": true
    },
    "MaEmail": {
      "name": "MaEmail",
      "type": "nvarchar",
      "nullable": false,
      "length": 10
    },
    "LoaiHoTro": {
      "name": "LoaiHoTro",
      "type": "varchar",
      "nullable": false,
      "length": 30
    },
    "NoiDungDeNghi": {
      "name": "NoiDungDeNghi",
      "type": "nvarchar",
      "nullable": false,
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
      "nullable": false
    }
  },
  "relations": {
    "FK__AccountSu__Reque__6B24EA82": {
      "type": "many-to-one",
      "target": "svc_demo_DonDeNghi",
      "joinColumn": [
        {
          "name": "ID",
          "referencedColumnName": "ID"
        }
      ],
      "createForeignKeyConstraints": false
    },
    "FK__AccountSu__Suppo__6C190EBB": {
      "type": "many-to-one",
      "target": "svc_demo_Sys_Email",
      "joinColumn": [
        {
          "name": "MaEmail",
          "referencedColumnName": "MaEmail"
        }
      ],
      "createForeignKeyConstraints": false
    }
  }
});
