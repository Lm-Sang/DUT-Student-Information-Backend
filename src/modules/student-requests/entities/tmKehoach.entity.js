import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const svc_demo_tmKehoach=new EntitySchema({
  "name": "svc_demo_tmKehoach",
  "tableName": "tmKehoach",
  "schema": "svc_demo",
  "synchronize": false,
  "columns": {
    "IDCode": {
      "name": "IDCode",
      "type": "nvarchar",
      "nullable": false,
      "primary": true,
      "length": 12
    },
    "TenKH": {
      "name": "TenKH",
      "type": "nvarchar",
      "nullable": false,
      "length": 150
    },
    "ThuTu": {
      "name": "ThuTu",
      "type": "int",
      "nullable": false
    },
    "Hientai": {
      "name": "Hientai",
      "type": "bit",
      "nullable": false
    },
    "NgayDongBo": {
      "name": "NgayDongBo",
      "type": "datetime2",
      "nullable": false,
      "precision": 3
    }
  }
});
