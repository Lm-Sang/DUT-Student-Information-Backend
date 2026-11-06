import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const svc_demo_vQuyenHieuLuc=new EntitySchema({
  "name": "svc_demo_vQuyenHieuLuc",
  "tableName": "vQuyenHieuLuc",
  "schema": "svc_demo",
  "synchronize": false,
  "columns": {
    "MaHS": {
      "name": "MaHS",
      "type": "nvarchar",
      "nullable": false,
      "length": 40
    },
    "MaQuyen": {
      "name": "MaQuyen",
      "type": "varchar",
      "nullable": false,
      "length": 100
    }
  },
  "type": "view"
});
