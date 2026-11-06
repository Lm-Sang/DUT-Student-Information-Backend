import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const svc_demo_vQuyenXuLy=new EntitySchema({
  "name": "svc_demo_vQuyenXuLy",
  "tableName": "vQuyenXuLy",
  "schema": "svc_demo",
  "synchronize": false,
  "columns": {
    "MaHS": {
      "name": "MaHS",
      "type": "nvarchar",
      "nullable": false,
      "length": 40
    },
    "MaCongViec": {
      "name": "MaCongViec",
      "type": "varchar",
      "nullable": true,
      "length": 60
    },
    "QuyenNhanDon": {
      "name": "QuyenNhanDon",
      "type": "bit",
      "nullable": true
    },
    "QuyenXuLy": {
      "name": "QuyenXuLy",
      "type": "bit",
      "nullable": true
    }
  },
  "type": "view"
});
