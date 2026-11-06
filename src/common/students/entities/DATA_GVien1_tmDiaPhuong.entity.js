import {EntitySchema} from 'typeorm';
// School metadata mapping. SELECT only; the DataSource also rejects all writes.
export const DATA_GVien1_tmDiaPhuong=new EntitySchema({
  "name": "DATA_GVien1_tmDiaPhuong",
  "tableName": "tmDiaPhuong",
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
    "MaDP": {
      "name": "MaDP",
      "type": "nvarchar",
      "nullable": false,
      "insert": false,
      "update": false,
      "length": 6
    },
    "TenDP": {
      "name": "TenDP",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 100
    }
  }
});
