import {EntitySchema} from 'typeorm';
// School metadata mapping. SELECT only; the DataSource also rejects all writes.
export const DATA_GVien1_tmNganhQG=new EntitySchema({
  "name": "DATA_GVien1_tmNganhQG",
  "tableName": "tmNganhQG",
  "schema": "dbo",
  "database": "DATA_GVien1",
  "synchronize": false,
  "columns": {
    "MaNganhQG": {
      "name": "MaNganhQG",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 15
    },
    "TenNganhQG": {
      "name": "TenNganhQG",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 250
    },
    "CapDT": {
      "name": "CapDT",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 10
    },
    "ID": {
      "name": "ID",
      "type": "int",
      "nullable": false,
      "insert": false,
      "update": false
    }
  },
  "type": "view"
});
