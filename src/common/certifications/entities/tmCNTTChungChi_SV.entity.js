import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const certification_tmCNTTChungChi_SV=new EntitySchema({
  "name": "certification_tmCNTTChungChi_SV",
  "tableName": "tmCNTTChungChi_SV",
  "schema": "certification",
  "synchronize": false,
  "columns": {
    "ID": {
      "name": "ID",
      "type": "int",
      "nullable": false,
      "primary": true
    },
    "MaHS": {
      "name": "MaHS",
      "type": "nvarchar",
      "nullable": true,
      "length": 9
    },
    "MaCC": {
      "name": "MaCC",
      "type": "nvarchar",
      "nullable": true,
      "length": 10
    },
    "SoHieu": {
      "name": "SoHieu",
      "type": "nvarchar",
      "nullable": true,
      "length": 20
    },
    "SoVaoSo": {
      "name": "SoVaoSo",
      "type": "nvarchar",
      "nullable": true,
      "length": 30
    },
    "SoNgayQD": {
      "name": "SoNgayQD",
      "type": "nvarchar",
      "nullable": true,
      "length": 250
    },
    "GhiChu": {
      "name": "GhiChu",
      "type": "nvarchar",
      "nullable": true,
      "length": 250
    },
    "CoSoCapCC": {
      "name": "CoSoCapCC",
      "type": "nvarchar",
      "nullable": true,
      "length": 250
    },
    "NgayCC": {
      "name": "NgayCC",
      "type": "date",
      "nullable": true
    },
    "MaHS_SoVaoSo": {
      "name": "MaHS_SoVaoSo",
      "type": "nvarchar",
      "nullable": true,
      "length": 100
    }
  },
  "relations": {
    "FK_CNTTStudent_Catalog": {
      "type": "many-to-one",
      "target": "certification_tmCNTTChungChi",
      "joinColumn": [
        {
          "name": "MaCC",
          "referencedColumnName": "MaCC"
        }
      ],
      "createForeignKeyConstraints": false
    }
  }
});
