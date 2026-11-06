import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const svc_demo_LichSuRBAC=new EntitySchema({
  "name": "svc_demo_LichSuRBAC",
  "tableName": "LichSuRBAC",
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
    "MaNguoiThucHien": {
      "name": "MaNguoiThucHien",
      "type": "nvarchar",
      "nullable": false,
      "length": 40
    },
    "ThaoTac": {
      "name": "ThaoTac",
      "type": "varchar",
      "nullable": false,
      "length": 30
    },
    "MaRole": {
      "name": "MaRole",
      "type": "varchar",
      "nullable": true,
      "length": 64
    },
    "MaTaiKhoan": {
      "name": "MaTaiKhoan",
      "type": "nvarchar",
      "nullable": true,
      "length": 40
    },
    "MoTa": {
      "name": "MoTa",
      "type": "nvarchar",
      "nullable": false,
      "length": 2000
    },
    "NgayLap": {
      "name": "NgayLap",
      "type": "datetime2",
      "nullable": false,
      "precision": 3
    }
  },
  "relations": {
    "FK__LichSuRBA__MaNgu__55F4C372": {
      "type": "many-to-one",
      "target": "svc_demo_TaiKhoan",
      "joinColumn": [
        {
          "name": "MaNguoiThucHien",
          "referencedColumnName": "MaHS"
        }
      ],
      "createForeignKeyConstraints": false
    }
  }
});
