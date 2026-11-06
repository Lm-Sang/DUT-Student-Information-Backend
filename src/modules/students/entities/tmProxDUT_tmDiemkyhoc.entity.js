import {EntitySchema} from 'typeorm';
// School metadata mapping. SELECT only; the DataSource also rejects all writes.
export const tmProxDUT_tmDiemkyhoc=new EntitySchema({
  "name": "tmProxDUT_tmDiemkyhoc",
  "tableName": "tmDiemkyhoc",
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
      "length": 4
    },
    "MaHS": {
      "name": "MaHS",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 10
    },
    "MaHP": {
      "name": "MaHP",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 7
    },
    "MalopHP": {
      "name": "MalopHP",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 16
    },
    "MaHPTT": {
      "name": "MaHPTT",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 7
    },
    "Diem": {
      "name": "Diem",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemC": {
      "name": "DiemC",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 2
    },
    "Diem4": {
      "name": "Diem4",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "Diem_K": {
      "name": "Diem_K",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemC_K": {
      "name": "DiemC_K",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 2
    },
    "Diem4_K": {
      "name": "Diem4_K",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "Note": {
      "name": "Note",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "Note_K": {
      "name": "Note_K",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "LockDiem": {
      "name": "LockDiem",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 200
    },
    "HocLai": {
      "name": "HocLai",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "Status": {
      "name": "Status",
      "type": "int",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "IsChecked": {
      "name": "IsChecked",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "Nhom": {
      "name": "Nhom",
      "type": "int",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "TenDetai": {
      "name": "TenDetai",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "Nhanxet": {
      "name": "Nhanxet",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "GVienDK": {
      "name": "GVienDK",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 5
    },
    "GVienPB1": {
      "name": "GVienPB1",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 5
    },
    "GVienPB2": {
      "name": "GVienPB2",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 5
    },
    "NXPB1": {
      "name": "NXPB1",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "NXPB2": {
      "name": "NXPB2",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "PhongKT": {
      "name": "PhongKT",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 10
    },
    "STTKtra": {
      "name": "STTKtra",
      "type": "int",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "PhongThi": {
      "name": "PhongThi",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 10
    },
    "STTthi": {
      "name": "STTthi",
      "type": "int",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "Hocphi": {
      "name": "Hocphi",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "NoHphi": {
      "name": "NoHphi",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DotDong": {
      "name": "DotDong",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "SoCT": {
      "name": "SoCT",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 50
    },
    "CUSBT": {
      "name": "CUSBT",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSBT_K": {
      "name": "CUSBT_K",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSCC": {
      "name": "CUSCC",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSCC_K": {
      "name": "CUSCC_K",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSDA": {
      "name": "CUSDA",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSDA_K": {
      "name": "CUSDA_K",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSGK": {
      "name": "CUSGK",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSGK_K": {
      "name": "CUSGK_K",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSBV": {
      "name": "CUSBV",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSBV_K": {
      "name": "CUSBV_K",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSDG": {
      "name": "CUSDG",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSDG_K": {
      "name": "CUSDG_K",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSCK": {
      "name": "CUSCK",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSCK_K": {
      "name": "CUSCK_K",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSLT": {
      "name": "CUSLT",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSLT_K": {
      "name": "CUSLT_K",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "ctkhac": {
      "name": "ctkhac",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "NgayPK": {
      "name": "NgayPK",
      "type": "date",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "NgayHoanGK": {
      "name": "NgayHoanGK",
      "type": "date",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "NgayHoanCK": {
      "name": "NgayHoanCK",
      "type": "date",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "MaHPxoa": {
      "name": "MaHPxoa",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 5
    },
    "MalopHPxoa": {
      "name": "MalopHPxoa",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 12
    },
    "MaHPTTxoa": {
      "name": "MaHPTTxoa",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 5
    },
    "IDCodeTo": {
      "name": "IDCodeTo",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 4
    },
    "Manhom": {
      "name": "Manhom",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 2
    },
    "GVKhac": {
      "name": "GVKhac",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "CUSBT_KFix": {
      "name": "CUSBT_KFix",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSCC_KFix": {
      "name": "CUSCC_KFix",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSDA_KFix": {
      "name": "CUSDA_KFix",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSGK_KFix": {
      "name": "CUSGK_KFix",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSBV_KFix": {
      "name": "CUSBV_KFix",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSDG_KFix": {
      "name": "CUSDG_KFix",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSCK_KFix": {
      "name": "CUSCK_KFix",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSLT_KFix": {
      "name": "CUSLT_KFix",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "NoiDungDC": {
      "name": "NoiDungDC",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "NoteGK_K": {
      "name": "NoteGK_K",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "CUSTH": {
      "name": "CUSTH",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSTH_K": {
      "name": "CUSTH_K",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSTH_KFix": {
      "name": "CUSTH_KFix",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DaXL": {
      "name": "DaXL",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "MaCaThi": {
      "name": "MaCaThi",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 20
    },
    "SoPhach": {
      "name": "SoPhach",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 10
    },
    "DiemL1": {
      "name": "DiemL1",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemL2": {
      "name": "DiemL2",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "GhiChu": {
      "name": "GhiChu",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 255
    },
    "DaTinhTC": {
      "name": "DaTinhTC",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "DiemL1Fix": {
      "name": "DiemL1Fix",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "XLFix": {
      "name": "XLFix",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "Diem_KFix": {
      "name": "Diem_KFix",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSRD_K": {
      "name": "CUSRD_K",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSLN_K": {
      "name": "CUSLN_K",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSWR_K": {
      "name": "CUSWR_K",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSSP_K": {
      "name": "CUSSP_K",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSTT": {
      "name": "CUSTT",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSTT_K": {
      "name": "CUSTT_K",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSWR_KFix": {
      "name": "CUSWR_KFix",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSSP_KFix": {
      "name": "CUSSP_KFix",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSTT_KFix": {
      "name": "CUSTT_KFix",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSKT": {
      "name": "CUSKT",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSKT_K": {
      "name": "CUSKT_K",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSKT_KFix": {
      "name": "CUSKT_KFix",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSHD": {
      "name": "CUSHD",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSHD_K": {
      "name": "CUSHD_K",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSHD_KFix": {
      "name": "CUSHD_KFix",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSB1": {
      "name": "CUSB1",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSB1_K": {
      "name": "CUSB1_K",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSB1_KFix": {
      "name": "CUSB1_KFix",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSB2": {
      "name": "CUSB2",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSB2_K": {
      "name": "CUSB2_K",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSB2_KFix": {
      "name": "CUSB2_KFix",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSB3": {
      "name": "CUSB3",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSB3_K": {
      "name": "CUSB3_K",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSB3_KFix": {
      "name": "CUSB3_KFix",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSG1": {
      "name": "CUSG1",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSG1_K": {
      "name": "CUSG1_K",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSG1_KFix": {
      "name": "CUSG1_KFix",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSG2": {
      "name": "CUSG2",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSG2_K": {
      "name": "CUSG2_K",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSG2_KFix": {
      "name": "CUSG2_KFix",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUST1": {
      "name": "CUST1",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUST1_K": {
      "name": "CUST1_K",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUST1_KFix": {
      "name": "CUST1_KFix",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUST2": {
      "name": "CUST2",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUST2_K": {
      "name": "CUST2_K",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUST2_KFix": {
      "name": "CUST2_KFix",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUST3": {
      "name": "CUST3",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUST3_K": {
      "name": "CUST3_K",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUST3_KFix": {
      "name": "CUST3_KFix",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUST4": {
      "name": "CUST4",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUST4_K": {
      "name": "CUST4_K",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUST4_KFix": {
      "name": "CUST4_KFix",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSTN": {
      "name": "CUSTN",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSTN_K": {
      "name": "CUSTN_K",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSTN_KFix": {
      "name": "CUSTN_KFix",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSCK_PK": {
      "name": "CUSCK_PK",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSTK_PK": {
      "name": "CUSTK_PK",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSVI": {
      "name": "CUSVI",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSVI_K": {
      "name": "CUSVI_K",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSVI_KFix": {
      "name": "CUSVI_KFix",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSVD": {
      "name": "CUSVD",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSVD_K": {
      "name": "CUSVD_K",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSVD_KFix": {
      "name": "CUSVD_KFix",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSDO": {
      "name": "CUSDO",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSDO_K": {
      "name": "CUSDO_K",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSDO_KFix": {
      "name": "CUSDO_KFix",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSQT": {
      "name": "CUSQT",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSQT_K": {
      "name": "CUSQT_K",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSQT_KFix": {
      "name": "CUSQT_KFix",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSBC": {
      "name": "CUSBC",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSBC_K": {
      "name": "CUSBC_K",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSBC_KFix": {
      "name": "CUSBC_KFix",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "LockDiemHP": {
      "name": "LockDiemHP",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "MaHS_MaHP": {
      "name": "MaHS_MaHP",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 17
    },
    "MaHS_MalopHP": {
      "name": "MaHS_MalopHP",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": 27
    },
    "SoTC": {
      "name": "SoTC",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "FixedDot": {
      "name": "FixedDot",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "EncRec": {
      "name": "EncRec",
      "type": "nvarchar",
      "nullable": true,
      "insert": false,
      "update": false,
      "length": "MAX"
    },
    "EncErr": {
      "name": "EncErr",
      "type": "tinyint",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSH1": {
      "name": "CUSH1",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSH1_K": {
      "name": "CUSH1_K",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSH1_KFix": {
      "name": "CUSH1_KFix",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSH2": {
      "name": "CUSH2",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSH2_K": {
      "name": "CUSH2_K",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    },
    "CUSH2_KFix": {
      "name": "CUSH2_KFix",
      "type": "float",
      "nullable": true,
      "insert": false,
      "update": false
    }
  },
  "type": "view"
});
