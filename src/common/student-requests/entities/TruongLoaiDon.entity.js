import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const svc_demo_TruongLoaiDon=new EntitySchema({
  "name": "svc_demo_TruongLoaiDon",
  "tableName": "TruongLoaiDon",
  "schema": "svc_demo",
  "synchronize": false,
  "columns": {
    "MaLoaiDon": {
      "name": "MaLoaiDon",
      "type": "varchar",
      "nullable": false,
      "primary": true,
      "length": 20
    },
    "TenTruong": {
      "name": "TenTruong",
      "type": "varchar",
      "nullable": false,
      "primary": true,
      "length": 60
    },
    "BatBuoc": {
      "name": "BatBuoc",
      "type": "bit",
      "nullable": false
    },
    "ThuTu": {
      "name": "ThuTu",
      "type": "int",
      "nullable": false
    }
  },
  "relations": {
    "FK__TruongLoa__MaLoa__3D5EEB29": {
      "type": "many-to-one",
      "target": "svc_demo_LoaiDon",
      "joinColumn": [
        {
          "name": "MaLoaiDon",
          "referencedColumnName": "MaLoaiDon"
        }
      ],
      "createForeignKeyConstraints": false
    }
  }
});
