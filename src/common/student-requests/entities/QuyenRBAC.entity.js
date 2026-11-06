import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const svc_demo_QuyenRBAC=new EntitySchema({
  "name": "svc_demo_QuyenRBAC",
  "tableName": "QuyenRBAC",
  "schema": "svc_demo",
  "synchronize": false,
  "columns": {
    "MaQuyen": {
      "name": "MaQuyen",
      "type": "varchar",
      "nullable": false,
      "primary": true,
      "length": 100
    },
    "TenQuyen": {
      "name": "TenQuyen",
      "type": "nvarchar",
      "nullable": false,
      "length": 250
    },
    "Nhom": {
      "name": "Nhom",
      "type": "nvarchar",
      "nullable": false,
      "length": 100
    }
  }
});
