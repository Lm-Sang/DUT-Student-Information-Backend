import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const svc_demo_tmNganhTQ=new EntitySchema({
  "name": "svc_demo_tmNganhTQ",
  "tableName": "tmNganhTQ",
  "schema": "svc_demo",
  "synchronize": false,
  "columns": {
    "MaNganhTQ": {
      "name": "MaNganhTQ",
      "type": "nvarchar",
      "nullable": false,
      "primary": true,
      "length": 60
    },
    "TenNganhTQ": {
      "name": "TenNganhTQ",
      "type": "nvarchar",
      "nullable": false,
      "length": 500
    },
    "HieuLuc": {
      "name": "HieuLuc",
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
