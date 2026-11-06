import {EntitySchema} from 'typeorm';
// School metadata mapping. SELECT only; the DataSource also rejects all writes.
export const DATA_SV1_Ma_DiaPhuongC1=new EntitySchema({
  "name": "DATA_SV1_Ma_DiaPhuongC1",
  "tableName": "Ma_DiaPhuongC1",
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
    "MaTinhThanh": {
      "name": "MaTinhThanh",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "TinhThanh": {
      "name": "TinhThanh",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "Tinhthanh1": {
      "name": "Tinhthanh1",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    }
  },
  "type": "view"
});
