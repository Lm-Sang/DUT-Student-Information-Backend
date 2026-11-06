import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const svc_demo_LichSuTruongDuLieu=new EntitySchema({
  "name": "svc_demo_LichSuTruongDuLieu",
  "tableName": "LichSuTruongDuLieu",
  "schema": "svc_demo",
  "synchronize": false,
  "columns": {
    "IDLichSu": {
      "name": "IDLichSu",
      "type": "bigint",
      "nullable": false,
      "primary": true
    },
    "TenTruong": {
      "name": "TenTruong",
      "type": "nvarchar",
      "nullable": false,
      "primary": true,
      "length": 60
    },
    "LoaiThayDoi": {
      "name": "LoaiThayDoi",
      "type": "varchar",
      "nullable": false,
      "primary": true,
      "length": 30
    }
  },
  "relations": {
    "FK__LichSuTru__IDLic__0B91BA14": {
      "type": "many-to-one",
      "target": "svc_demo_LichSuXuLyDon",
      "joinColumn": [
        {
          "name": "IDLichSu",
          "referencedColumnName": "ID"
        }
      ],
      "createForeignKeyConstraints": false
    }
  }
});
