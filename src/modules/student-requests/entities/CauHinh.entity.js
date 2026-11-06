import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const svc_demo_CauHinh=new EntitySchema({
  "name": "svc_demo_CauHinh",
  "tableName": "CauHinh",
  "schema": "svc_demo",
  "synchronize": false,
  "columns": {
    "MaCauHinh": {
      "name": "MaCauHinh",
      "type": "varchar",
      "nullable": false,
      "primary": true,
      "length": 60
    },
    "GiaTri": {
      "name": "GiaTri",
      "type": "nvarchar",
      "nullable": false,
      "length": 1000
    },
    "NgayDongBo": {
      "name": "NgayDongBo",
      "type": "datetime2",
      "nullable": false,
      "precision": 3
    }
  }
});
