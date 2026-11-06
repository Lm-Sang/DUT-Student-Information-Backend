import {EntitySchema} from 'typeorm';
// School metadata mapping. SELECT only; the DataSource also rejects all writes.
export const DATA_GVien1_tmConfig=new EntitySchema({
  "name": "DATA_GVien1_tmConfig",
  "tableName": "tmConfig",
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
    "VarName": {
      "name": "VarName",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 50
    },
    "VarString1": {
      "name": "VarString1",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": "MAX"
    },
    "VarString2": {
      "name": "VarString2",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "VarString3": {
      "name": "VarString3",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "VarString4": {
      "name": "VarString4",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "VarValue1": {
      "name": "VarValue1",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "VarValue2": {
      "name": "VarValue2",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "VarValue3": {
      "name": "VarValue3",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "VarLong": {
      "name": "VarLong",
      "type": "int",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "VarType": {
      "name": "VarType",
      "type": "int",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "VarSTT": {
      "name": "VarSTT",
      "type": "int",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "Vartype2": {
      "name": "Vartype2",
      "type": "int",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "TenCotCK": {
      "name": "TenCotCK",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 50
    },
    "MaCotTC": {
      "name": "MaCotTC",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 10
    },
    "CTCotDiemTN": {
      "name": "CTCotDiemTN",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 10
    }
  }
});
