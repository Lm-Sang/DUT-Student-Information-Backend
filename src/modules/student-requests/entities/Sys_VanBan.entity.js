import {EntitySchema} from 'typeorm';

// Generated from local SQL Server metadata. Database names and constraints are owned by SQL.
export const svc_demo_Sys_VanBan=new EntitySchema({
  "name": "svc_demo_Sys_VanBan",
  "tableName": "Sys_VanBan",
  "schema": "svc_demo",
  "synchronize": false,
  "columns": {
    "IDCode": {
      "name": "IDCode",
      "type": "nvarchar",
      "nullable": false,
      "primary": true,
      "length": 12
    },
    "MaVanBan": {
      "name": "MaVanBan",
      "type": "nvarchar",
      "nullable": false,
      "primary": true,
      "length": 2
    },
    "ID": {
      "name": "ID",
      "type": "int",
      "nullable": true
    },
    "TenVanBan": {
      "name": "TenVanBan",
      "type": "nvarchar",
      "nullable": false,
      "length": 500
    },
    "MaDVcap": {
      "name": "MaDVcap",
      "type": "varchar",
      "nullable": false,
      "length": 20
    },
    "ThongTinDinhKem": {
      "name": "ThongTinDinhKem",
      "type": "nvarchar",
      "nullable": false,
      "length": 2000
    },
    "LePhiThuong": {
      "name": "LePhiThuong",
      "type": "decimal",
      "nullable": true,
      "precision": 18,
      "scale": 2
    },
    "LePhiNhanh": {
      "name": "LePhiNhanh",
      "type": "decimal",
      "nullable": true,
      "precision": 18,
      "scale": 2
    },
    "KhongMienPhi": {
      "name": "KhongMienPhi",
      "type": "bit",
      "nullable": true
    },
    "SoLuongMien_Ngay": {
      "name": "SoLuongMien_Ngay",
      "type": "int",
      "nullable": true
    },
    "KhongCapNeuKhongHoc": {
      "name": "KhongCapNeuKhongHoc",
      "type": "bit",
      "nullable": false
    },
    "HieuLuc": {
      "name": "HieuLuc",
      "type": "bit",
      "nullable": false
    },
    "NgayDongBo": {
      "name": "NgayDongBo",
      "type": "datetime2",
      "nullable": false,
      "precision": 3
    }
  },
  "relations": {
    "FK__DocumentT__TermC__5AEE82B9": {
      "type": "many-to-one",
      "target": "svc_demo_tmKehoach",
      "joinColumn": [
        {
          "name": "IDCode",
          "referencedColumnName": "IDCode"
        }
      ],
      "createForeignKeyConstraints": false
    }
  }
});
