import {EntitySchema} from 'typeorm';
// School metadata mapping. SELECT only; the DataSource also rejects all writes.
export const DATA_SV1_ThongBao=new EntitySchema({
  "name": "DATA_SV1_ThongBao",
  "tableName": "ThongBao",
  "schema": "dbo",
  "database": "DATA_SV1",
  "synchronize": false,
  "columns": {
    "ID": {
      "name": "ID",
      "type": "int",
      "nullable": false,
      "insert": false,
      "update": false
    },
    "MaThongBao": {
      "name": "MaThongBao",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 20
    },
    "Tieude": {
      "name": "Tieude",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 500
    },
    "Noidung": {
      "name": "Noidung",
      "type": "ntext",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "Ngaydang": {
      "name": "Ngaydang",
      "type": "datetime",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "Nguoidang": {
      "name": "Nguoidang",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 20
    },
    "Doituong": {
      "name": "Doituong",
      "type": "nchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 10
    },
    "Hide": {
      "name": "Hide",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "MalopHP": {
      "name": "MalopHP",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 20
    },
    "LinhVuc": {
      "name": "LinhVuc",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 10
    },
    "LinhVucCT": {
      "name": "LinhVucCT",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 10
    },
    "DenCacKhoa": {
      "name": "DenCacKhoa",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 500
    },
    "Caohoc": {
      "name": "Caohoc",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    }
  },
  "type": "view"
});
