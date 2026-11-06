import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const svc_demo_Sys_Email=new EntitySchema({
  "name": "svc_demo_Sys_Email",
  "tableName": "Sys_Email",
  "schema": "svc_demo",
  "synchronize": false,
  "columns": {
    "MaEmail": {
      "name": "MaEmail",
      "type": "nvarchar",
      "nullable": false,
      "primary": true,
      "length": 10
    },
    "TenDenghi": {
      "name": "TenDenghi",
      "type": "nvarchar",
      "nullable": false,
      "length": 255
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
