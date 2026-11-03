import {EntitySchema} from 'typeorm';
// School metadata mapping. SELECT only; the DataSource also rejects all writes.
export const DATA_GVien1_tmLop=new EntitySchema({
  "name": "DATA_GVien1_tmLop",
  "tableName": "tmLop",
  "schema": "dbo",
  "database": "DATA_GVien1",
  "synchronize": false,
  "columns": {
    "ID": {
      "name": "ID",
      "type": "int",
      "nullable": false,
      "insert": false,
      "update": false,
      "primary": true
    },
    "MaLop": {
      "name": "MaLop",
      "type": "nvarchar",
      "nullable": false,
      "insert": false,
      "update": false,
      "length": 7
    },
    "TenLop": {
      "name": "TenLop",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 50
    },
    "MaKhung": {
      "name": "MaKhung",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 7
    },
    "Ghichu": {
      "name": "Ghichu",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "hinhthuc": {
      "name": "hinhthuc",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 6
    },
    "capdaotao": {
      "name": "capdaotao",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 6
    },
    "Locked": {
      "name": "Locked",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "Totnghiep": {
      "name": "Totnghiep",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "NhomTKB": {
      "name": "NhomTKB",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 50
    },
    "ThuHP": {
      "name": "ThuHP",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemRL": {
      "name": "DiemRL",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "LopCLC": {
      "name": "LopCLC",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemPVCDYC": {
      "name": "DiemPVCDYC",
      "type": "int",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "LopGhep": {
      "name": "LopGhep",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "KhoaQL": {
      "name": "KhoaQL",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 10
    }
  }
});
