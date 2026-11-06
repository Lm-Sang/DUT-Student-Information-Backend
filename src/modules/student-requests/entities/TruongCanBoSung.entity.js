import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const svc_demo_TruongCanBoSung=new EntitySchema({
  "name": "svc_demo_TruongCanBoSung",
  "tableName": "TruongCanBoSung",
  "schema": "svc_demo",
  "synchronize": false,
  "columns": {
    "IDDon": {
      "name": "IDDon",
      "type": "uniqueidentifier",
      "nullable": false,
      "primary": true
    },
    "TenTruong": {
      "name": "TenTruong",
      "type": "nvarchar",
      "nullable": false,
      "primary": true,
      "length": 60
    }
  },
  "relations": {
    "FK__TruongCan__IDDon__08B54D69": {
      "type": "many-to-one",
      "target": "svc_demo_DonDeNghi",
      "joinColumn": [
        {
          "name": "IDDon",
          "referencedColumnName": "ID"
        }
      ],
      "createForeignKeyConstraints": false
    }
  }
});
