import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const svc_demo_DeNghiVanBan=new EntitySchema({
  "name": "svc_demo_DeNghiVanBan",
  "tableName": "DeNghiVanBan",
  "schema": "svc_demo",
  "synchronize": false,
  "columns": {
    "ID": {
      "name": "ID",
      "type": "uniqueidentifier",
      "nullable": false,
      "primary": true
    },
    "IDCode": {
      "name": "IDCode",
      "type": "nvarchar",
      "nullable": false,
      "length": 12
    },
    "MaVanban": {
      "name": "MaVanban",
      "type": "nvarchar",
      "nullable": false,
      "length": 2
    },
    "SoLuong": {
      "name": "SoLuong",
      "type": "int",
      "nullable": false
    },
    "TTbosung": {
      "name": "TTbosung",
      "type": "nvarchar",
      "nullable": false,
      "length": 2000
    },
    "HocKy": {
      "name": "HocKy",
      "type": "nvarchar",
      "nullable": true,
      "length": 12
    },
    "NamHoc": {
      "name": "NamHoc",
      "type": "nvarchar",
      "nullable": true,
      "length": 9
    },
    "LePhi": {
      "name": "LePhi",
      "type": "decimal",
      "nullable": false,
      "precision": 18,
      "scale": 2
    },
    "MienPhi": {
      "name": "MienPhi",
      "type": "bit",
      "nullable": false
    },
    "Khan": {
      "name": "Khan",
      "type": "bit",
      "nullable": false
    },
    "ThanhTien": {
      "name": "ThanhTien",
      "type": "decimal",
      "nullable": true,
      "precision": 18,
      "scale": 2,
      "insert": false,
      "update": false
    }
  },
  "relations": {
    "FK__DocumentR__Reque__6383C8BA": {
      "type": "many-to-one",
      "target": "svc_demo_DonDeNghi",
      "joinColumn": [
        {
          "name": "ID",
          "referencedColumnName": "ID"
        }
      ],
      "createForeignKeyConstraints": false
    },
    "FK_DemoDocumentCatalog": {
      "type": "many-to-one",
      "target": "svc_demo_Sys_VanBan",
      "joinColumn": [
        {
          "name": "IDCode",
          "referencedColumnName": "IDCode"
        },
        {
          "name": "MaVanban",
          "referencedColumnName": "MaVanBan"
        }
      ],
      "createForeignKeyConstraints": false
    }
  }
});
