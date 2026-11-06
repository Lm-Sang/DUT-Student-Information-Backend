import {EntitySchema} from 'typeorm';
// School metadata mapping. SELECT only; the DataSource also rejects all writes.
export const DHBK_CDS_TmKhungCT=new EntitySchema({
  "name": "DHBK_CDS_TmKhungCT",
  "tableName": "TmKhungCT",
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
    "MaKhung": {
      "name": "MaKhung",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 7
    },
    "MaHP": {
      "name": "MaHP",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 7
    },
    "MaHPTT": {
      "name": "MaHPTT",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 7
    },
    "Hocky": {
      "name": "Hocky",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "Tuchon": {
      "name": "Tuchon",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "STT": {
      "name": "STT",
      "type": "int",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "Note": {
      "name": "Note",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "TQDA": {
      "name": "TQDA",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DATN": {
      "name": "DATN",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "LoaiKT": {
      "name": "LoaiKT",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "MaHPxoa": {
      "name": "MaHPxoa",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 5
    },
    "MaHPTTxoa": {
      "name": "MaHPTTxoa",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 5
    },
    "NhomKT": {
      "name": "NhomKT",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 6
    },
    "HTDA": {
      "name": "HTDA",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "Kyhoc": {
      "name": "Kyhoc",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 4
    },
    "MaKhung_MaHP": {
      "name": "MaKhung_MaHP",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 15
    }
  },
  "type": "view"
});
