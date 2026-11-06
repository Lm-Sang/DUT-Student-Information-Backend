import {EntitySchema} from 'typeorm';
// School metadata mapping. SELECT only; the DataSource also rejects all writes.
export const tmProxDUT_tmHocvuTK=new EntitySchema({
  "name": "tmProxDUT_tmHocvuTK",
  "tableName": "tmHocvuTK",
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
    "MaHS": {
      "name": "MaHS",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 9
    },
    "HPDangky1": {
      "name": "HPDangky1",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHT1": {
      "name": "DiemTBHT1",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "HPTichluy1": {
      "name": "HPTichluy1",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBTL1": {
      "name": "DiemTBTL1",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHB1": {
      "name": "DiemTBHB1",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "HPDangky2": {
      "name": "HPDangky2",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHT2": {
      "name": "DiemTBHT2",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "HPTichluy2": {
      "name": "HPTichluy2",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBTL2": {
      "name": "DiemTBTL2",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHB2": {
      "name": "DiemTBHB2",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHT2K2": {
      "name": "DiemTBHT2K2",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "HPDangky3": {
      "name": "HPDangky3",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHT3": {
      "name": "DiemTBHT3",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "HPTichluy3": {
      "name": "HPTichluy3",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBTL3": {
      "name": "DiemTBTL3",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHB3": {
      "name": "DiemTBHB3",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHT2K3": {
      "name": "DiemTBHT2K3",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "HPDangky4": {
      "name": "HPDangky4",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHT4": {
      "name": "DiemTBHT4",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "HPTichluy4": {
      "name": "HPTichluy4",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBTL4": {
      "name": "DiemTBTL4",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHB4": {
      "name": "DiemTBHB4",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHT2K4": {
      "name": "DiemTBHT2K4",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "HPDangky5": {
      "name": "HPDangky5",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHT5": {
      "name": "DiemTBHT5",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "HPTichluy5": {
      "name": "HPTichluy5",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBTL5": {
      "name": "DiemTBTL5",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHB5": {
      "name": "DiemTBHB5",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHT2K5": {
      "name": "DiemTBHT2K5",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "HPDangky6": {
      "name": "HPDangky6",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHT6": {
      "name": "DiemTBHT6",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "HPTichluy6": {
      "name": "HPTichluy6",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBTL6": {
      "name": "DiemTBTL6",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHB6": {
      "name": "DiemTBHB6",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHT2K6": {
      "name": "DiemTBHT2K6",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "HPDangky7": {
      "name": "HPDangky7",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHT7": {
      "name": "DiemTBHT7",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "HPTichluy7": {
      "name": "HPTichluy7",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBTL7": {
      "name": "DiemTBTL7",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHB7": {
      "name": "DiemTBHB7",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHT2K7": {
      "name": "DiemTBHT2K7",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "HPDangky8": {
      "name": "HPDangky8",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHT8": {
      "name": "DiemTBHT8",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "HPTichluy8": {
      "name": "HPTichluy8",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBTL8": {
      "name": "DiemTBTL8",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHB8": {
      "name": "DiemTBHB8",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHT2K8": {
      "name": "DiemTBHT2K8",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "HPDangky9": {
      "name": "HPDangky9",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHT9": {
      "name": "DiemTBHT9",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "HPTichluy9": {
      "name": "HPTichluy9",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBTL9": {
      "name": "DiemTBTL9",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHB9": {
      "name": "DiemTBHB9",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHT2K9": {
      "name": "DiemTBHT2K9",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "HPDangky10": {
      "name": "HPDangky10",
      "type": "float",
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
    "HPTichluy10": {
      "name": "HPTichluy10",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBTL10": {
      "name": "DiemTBTL10",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHB10": {
      "name": "DiemTBHB10",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHT2K10": {
      "name": "DiemTBHT2K10",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "HPDangky11": {
      "name": "HPDangky11",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHT11": {
      "name": "DiemTBHT11",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "HPTichluy11": {
      "name": "HPTichluy11",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBTL11": {
      "name": "DiemTBTL11",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHB11": {
      "name": "DiemTBHB11",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHT2K11": {
      "name": "DiemTBHT2K11",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "HPDangky12": {
      "name": "HPDangky12",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHT12": {
      "name": "DiemTBHT12",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "HPTichluy12": {
      "name": "HPTichluy12",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBTL12": {
      "name": "DiemTBTL12",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHB12": {
      "name": "DiemTBHB12",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHT2K12": {
      "name": "DiemTBHT2K12",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "HPDangky": {
      "name": "HPDangky",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
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
    "DiemRL": {
      "name": "DiemRL",
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
    "Xeploai": {
      "name": "Xeploai",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 50
    },
    "Xuly": {
      "name": "Xuly",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 50
    },
    "SoTC": {
      "name": "SoTC",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "SoTCBB": {
      "name": "SoTCBB",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "SoTCTC": {
      "name": "SoTCTC",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "SoTCBBTL": {
      "name": "SoTCBBTL",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "SoTCTCTL": {
      "name": "SoTCTCTL",
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
    "MaNganh": {
      "name": "MaNganh",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 7
    },
    "CCGDTC": {
      "name": "CCGDTC",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CCGDQP": {
      "name": "CCGDQP",
      "type": "tinyint",
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
      "length": 50
    },
    "SoTCXet": {
      "name": "SoTCXet",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "SoTCThieu": {
      "name": "SoTCThieu",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "SoTCDATQ": {
      "name": "SoTCDATQ",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "SoDAThieu": {
      "name": "SoDAThieu",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "KLDoan": {
      "name": "KLDoan",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 4000
    },
    "NhanDA": {
      "name": "NhanDA",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "SoTCThieuTC": {
      "name": "SoTCThieuTC",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CodeDA": {
      "name": "CodeDA",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 4
    },
    "CCNN": {
      "name": "CCNN",
      "type": "int",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "TongTCTN": {
      "name": "TongTCTN",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "ThieuTCBB": {
      "name": "ThieuTCBB",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "ThieuTCTC": {
      "name": "ThieuTCTC",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "TN": {
      "name": "TN",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "NoteTN": {
      "name": "NoteTN",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 4000
    },
    "NoteCCTN": {
      "name": "NoteCCTN",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 4000
    },
    "CodeTN": {
      "name": "CodeTN",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 4
    },
    "KyluatTN": {
      "name": "KyluatTN",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 6
    },
    "SoInCN": {
      "name": "SoInCN",
      "type": "int",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "SoInBD": {
      "name": "SoInBD",
      "type": "int",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "sohieubang": {
      "name": "sohieubang",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 50
    },
    "sovaoso": {
      "name": "sovaoso",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 50
    },
    "SoQD": {
      "name": "SoQD",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 50
    },
    "NgayQD": {
      "name": "NgayQD",
      "type": "date",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "Mabang": {
      "name": "Mabang",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 6
    },
    "MaHinhthuc": {
      "name": "MaHinhthuc",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 6
    },
    "locked": {
      "name": "locked",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "GiamXL": {
      "name": "GiamXL",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DKBang": {
      "name": "DKBang",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "NgayDKB": {
      "name": "NgayDKB",
      "type": "datetime",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "STTBang": {
      "name": "STTBang",
      "type": "int",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "HPDangky13": {
      "name": "HPDangky13",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHT13": {
      "name": "DiemTBHT13",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "HPTichluy13": {
      "name": "HPTichluy13",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBTL13": {
      "name": "DiemTBTL13",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHB13": {
      "name": "DiemTBHB13",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHT2K13": {
      "name": "DiemTBHT2K13",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "HPDangky14": {
      "name": "HPDangky14",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHT14": {
      "name": "DiemTBHT14",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "HPTichluy14": {
      "name": "HPTichluy14",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBTL14": {
      "name": "DiemTBTL14",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHB14": {
      "name": "DiemTBHB14",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHT2K14": {
      "name": "DiemTBHT2K14",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "HPDangky15": {
      "name": "HPDangky15",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHT15": {
      "name": "DiemTBHT15",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "HPTichluy15": {
      "name": "HPTichluy15",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBTL15": {
      "name": "DiemTBTL15",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHB15": {
      "name": "DiemTBHB15",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHT2K15": {
      "name": "DiemTBHT2K15",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "HPDangky16": {
      "name": "HPDangky16",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHT16": {
      "name": "DiemTBHT16",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "HPTichluy16": {
      "name": "HPTichluy16",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBTL16": {
      "name": "DiemTBTL16",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHB16": {
      "name": "DiemTBHB16",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHT2K16": {
      "name": "DiemTBHT2K16",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "HPDangky17": {
      "name": "HPDangky17",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHT17": {
      "name": "DiemTBHT17",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "HPTichluy17": {
      "name": "HPTichluy17",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBTL17": {
      "name": "DiemTBTL17",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHB17": {
      "name": "DiemTBHB17",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHT2K17": {
      "name": "DiemTBHT2K17",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "HPDangky18": {
      "name": "HPDangky18",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHT18": {
      "name": "DiemTBHT18",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "HPTichluy18": {
      "name": "HPTichluy18",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBTL18": {
      "name": "DiemTBTL18",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHB18": {
      "name": "DiemTBHB18",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHT2K18": {
      "name": "DiemTBHT2K18",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "HPDangky19": {
      "name": "HPDangky19",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHT19": {
      "name": "DiemTBHT19",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "HPTichluy19": {
      "name": "HPTichluy19",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBTL19": {
      "name": "DiemTBTL19",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHB19": {
      "name": "DiemTBHB19",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHT2K19": {
      "name": "DiemTBHT2K19",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "Sosanh": {
      "name": "Sosanh",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 16
    },
    "HPDangky20": {
      "name": "HPDangky20",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHT20": {
      "name": "DiemTBHT20",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "HPTichluy20": {
      "name": "HPTichluy20",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBTL20": {
      "name": "DiemTBTL20",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHB20": {
      "name": "DiemTBHB20",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemTBHT2K20": {
      "name": "DiemTBHT2K20",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "NgayIn": {
      "name": "NgayIn",
      "type": "date",
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
    "GhiChuCC": {
      "name": "GhiChuCC",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 500
    },
    "_CCCCTH": {
      "name": "_CCCCTH",
      "type": "int",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CCTH": {
      "name": "CCTH",
      "type": "int",
      "nullable": true,
      "insert": false,
      "update": false
    }
  },
  "type": "view"
});
