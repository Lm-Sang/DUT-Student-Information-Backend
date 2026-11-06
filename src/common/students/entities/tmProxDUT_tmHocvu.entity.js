import {EntitySchema} from 'typeorm';
// School metadata mapping. SELECT only; the DataSource also rejects all writes.
export const tmProxDUT_tmHocvu=new EntitySchema({
  "name": "tmProxDUT_tmHocvu",
  "tableName": "tmHocvu",
  "schema": "dbo",
  "database": "tmProxDUT",
  "synchronize": false,
  "columns": {
    "ID": {
      "name": "ID",
      "type": "int",
      "nullable": false,
      "insert": false,
      "update": false
    },
    "IDCode": {
      "name": "IDCode",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 3
    },
    "MaHS": {
      "name": "MaHS",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 9
    },
    "HPDangky": {
      "name": "HPDangky",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHT": {
      "name": "DiemTBHT",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHB": {
      "name": "DiemTBHB",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "XepLoai": {
      "name": "XepLoai",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 50
    },
    "HPTichluy": {
      "name": "HPTichluy",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBTL": {
      "name": "DiemTBTL",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "Namhoc": {
      "name": "Namhoc",
      "type": "int",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "HPBatbuoc": {
      "name": "HPBatbuoc",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "SoTCHoclai": {
      "name": "SoTCHoclai",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "XepLoaiCK": {
      "name": "XepLoaiCK",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 50
    },
    "DiemTB2Ky": {
      "name": "DiemTB2Ky",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemRL": {
      "name": "DiemRL",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemRLCK": {
      "name": "DiemRLCK",
      "type": "float",
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
    "HK": {
      "name": "HK",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHT10": {
      "name": "DiemTBHT10",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "locked": {
      "name": "locked",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "Manganh": {
      "name": "Manganh",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 7
    },
    "LoaiThoihoc": {
      "name": "LoaiThoihoc",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 50
    },
    "Thoihoc": {
      "name": "Thoihoc",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "LydoThoi": {
      "name": "LydoThoi",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "SoQDThoi": {
      "name": "SoQDThoi",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 50
    },
    "NgayQDThoi": {
      "name": "NgayQDThoi",
      "type": "date",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "ngunghoc": {
      "name": "ngunghoc",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "NgayNH": {
      "name": "NgayNH",
      "type": "date",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "LydoNgung": {
      "name": "LydoNgung",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "SoQDinh": {
      "name": "SoQDinh",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 50
    },
    "NgayQDinh": {
      "name": "NgayQDinh",
      "type": "date",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "SokyNgung": {
      "name": "SokyNgung",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "IDCodeHoc": {
      "name": "IDCodeHoc",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 4
    },
    "NgayHoc": {
      "name": "NgayHoc",
      "type": "date",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "SoQDinhHoc": {
      "name": "SoQDinhHoc",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 50
    },
    "NgayQDinhHoc": {
      "name": "NgayQDinhHoc",
      "type": "date",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "iLast": {
      "name": "iLast",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "Voikhoa": {
      "name": "Voikhoa",
      "type": "int",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "Dunghoc": {
      "name": "Dunghoc",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "KLDK": {
      "name": "KLDK",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "KLHL": {
      "name": "KLHL",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "TBHT": {
      "name": "TBHT",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "TBHB": {
      "name": "TBHB",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "ThoiCT2": {
      "name": "ThoiCT2",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "LoaiCB": {
      "name": "LoaiCB",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 50
    },
    "CB": {
      "name": "CB",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "LydoCB": {
      "name": "LydoCB",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "HPKysau": {
      "name": "HPKysau",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "XongCT1": {
      "name": "XongCT1",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemI": {
      "name": "DiemI",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBTLThang10": {
      "name": "DiemTBTLThang10",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "KhongTinhDRL": {
      "name": "KhongTinhDRL",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "MaHS_IDCode": {
      "name": "MaHS_IDCode",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 13
    },
    "TCKhung": {
      "name": "TCKhung",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "TCTiendo": {
      "name": "TCTiendo",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "TCTyle": {
      "name": "TCTyle",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    }
  },
  "type": "view"
});
