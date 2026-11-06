import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const svc_demo_ChongGuiTrung=new EntitySchema({
  "name": "svc_demo_ChongGuiTrung",
  "tableName": "ChongGuiTrung",
  "schema": "svc_demo",
  "synchronize": false,
  "columns": {
    "ID": {
      "name": "ID",
      "type": "bigint",
      "nullable": false,
      "primary": true,
      "generated": "increment"
    },
    "MaHS": {
      "name": "MaHS",
      "type": "nvarchar",
      "nullable": false,
      "length": 40
    },
    "MaThaoTac": {
      "name": "MaThaoTac",
      "type": "nvarchar",
      "nullable": false,
      "length": 100
    },
    "MaBamNoiDung": {
      "name": "MaBamNoiDung",
      "type": "varchar",
      "nullable": false,
      "length": 64
    },
    "IDDon": {
      "name": "IDDon",
      "type": "uniqueidentifier",
      "nullable": false
    },
    "NgayLap": {
      "name": "NgayLap",
      "type": "datetime2",
      "nullable": false,
      "precision": 3
    }
  },
  "relations": {
    "FK__CommandRe__Actor__534D60F1": {
      "type": "many-to-one",
      "target": "svc_demo_TaiKhoan",
      "joinColumn": [
        {
          "name": "MaHS",
          "referencedColumnName": "MaHS"
        }
      ],
      "createForeignKeyConstraints": false
    },
    "FK__CommandRe__Reque__5441852A": {
      "type": "many-to-one",
      "target": "svc_demo_DonDeNghi",
      "joinColumn": [
        {
          "name": "IDDon",
          "referencedColumnName": "ID"
        }
      ],
      "createForeignKeyConstraints": false
    }
  }
});
