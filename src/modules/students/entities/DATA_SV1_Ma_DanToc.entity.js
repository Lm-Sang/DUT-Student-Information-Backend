import {EntitySchema} from 'typeorm';
// School metadata mapping. SELECT only; the DataSource also rejects all writes.
export const DATA_SV1_Ma_DanToc=new EntitySchema({
  "name": "DATA_SV1_Ma_DanToc",
  "tableName": "Ma_DanToc",
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
    "MaDT": {
      "name": "MaDT",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 2
    },
    "MaDT_Cu": {
      "name": "MaDT_Cu",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 2
    },
    "DanToc": {
      "name": "DanToc",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 100
    },
    "TenKhac": {
      "name": "TenKhac",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": "MAX"
    }
  },
  "type": "view"
});
