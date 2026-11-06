import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const svc_demo_KetQuaHocTapHocKy=new EntitySchema({
  "name": "svc_demo_KetQuaHocTapHocKy",
  "tableName": "KetQuaHocTapHocKy",
  "schema": "svc_demo",
  "synchronize": false,
  "columns": {
    "MaHS": {
      "name": "MaHS",
      "type": "nvarchar",
      "nullable": false,
      "primary": true,
      "length": 40
    },
    "IDCode": {
      "name": "IDCode",
      "type": "nvarchar",
      "nullable": false,
      "primary": true,
      "length": 12
    },
    "ThuTu": {
      "name": "ThuTu",
      "type": "int",
      "nullable": false
    },
    "TenKH": {
      "name": "TenKH",
      "type": "nvarchar",
      "nullable": true,
      "length": 150
    },
    "SoTinChi": {
      "name": "SoTinChi",
      "type": "decimal",
      "nullable": true,
      "precision": 10,
      "scale": 2
    },
    "SoTinChiHocLai": {
      "name": "SoTinChiHocLai",
      "type": "decimal",
      "nullable": true,
      "precision": 10,
      "scale": 2
    },
    "DiemTBCHB": {
      "name": "DiemTBCHB",
      "type": "decimal",
      "nullable": true,
      "precision": 10,
      "scale": 2
    },
    "DiemTBC": {
      "name": "DiemTBC",
      "type": "decimal",
      "nullable": true,
      "precision": 10,
      "scale": 2
    },
    "DiemTBCTL": {
      "name": "DiemTBCTL",
      "type": "decimal",
      "nullable": true,
      "precision": 10,
      "scale": 2
    },
    "CoDiemDuoi5": {
      "name": "CoDiemDuoi5",
      "type": "nvarchar",
      "nullable": true,
      "length": 20
    },
    "DiemRL": {
      "name": "DiemRL",
      "type": "decimal",
      "nullable": true,
      "precision": 10,
      "scale": 2
    }
  },
  "relations": {
    "FK__KetQuaHocT__MaHS__0E6E26BF": {
      "type": "many-to-one",
      "target": "svc_demo_NhanThan",
      "joinColumn": [
        {
          "name": "MaHS",
          "referencedColumnName": "MaHS"
        }
      ],
      "createForeignKeyConstraints": false
    }
  }
});
