import {EntitySchema} from 'typeorm';
// School metadata mapping. SELECT only; the DataSource also rejects all writes.
export const DHBK_CDS_DonVi=new EntitySchema({
  "name": "DHBK_CDS_DonVi",
  "tableName": "DonVi",
  "schema": "dbo",
  "database": "DHBK_CDS",
  "synchronize": false,
  "columns": {
    "ID": {
      "name": "ID",
      "type": "int",
      "nullable": false,
      "insert": false,
      "update": false
    },
    "MaDV": {
      "name": "MaDV",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 5
    },
    "MaBP": {
      "name": "MaBP",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 5
    },
    "TenDV": {
      "name": "TenDV",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "DiaChi": {
      "name": "DiaChi",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "DienThoai": {
      "name": "DienThoai",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 50
    },
    "Fax": {
      "name": "Fax",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 50
    },
    "Email": {
      "name": "Email",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "STT": {
      "name": "STT",
      "type": "int",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "IsDaotao": {
      "name": "IsDaotao",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "LuuTru": {
      "name": "LuuTru",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "MaDVxoa": {
      "name": "MaDVxoa",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 5
    }
  },
  "type": "view"
});
