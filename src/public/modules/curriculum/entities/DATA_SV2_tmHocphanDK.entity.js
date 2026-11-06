import {EntitySchema} from 'typeorm';
// School metadata mapping. SELECT only; the DataSource also rejects all writes.
export const DATA_SV2_tmHocphanDK=new EntitySchema({
  "name": "DATA_SV2_tmHocphanDK",
  "tableName": "tmHocphanDK",
  "schema": "dbo",
  "database": "DATA_SV2",
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
    "MaHPdk": {
      "name": "MaHPdk",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 7
    },
    "LoaiDK": {
      "name": "LoaiDK",
      "type": "int",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "Ghichu": {
      "name": "Ghichu",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "Hoac": {
      "name": "Hoac",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "ktra1": {
      "name": "ktra1",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 50
    }
  },
  "type": "view"
});
