-- Read-only catalogue/metadata audit. Run with the configured secondary login.
-- No passwords, student records, staff names or request free text are selected.

-- 1. The six request types matching the supplied dropdown.
SELECT STT, KyHieuDon, LoaiDon, HieuLuc, ChoSVDoc, LoaiCombo, NoiNhanGiaoHS
FROM DATA_SV1.dbo.LoaiDon
WHERE HieuLuc = 1 AND LoaiCombo = 1
ORDER BY STT;

-- 2. Account-support types, including DUT-LMS (MaEmail = '3').
SELECT MaEmail, TenDenghi, HieuLuc
FROM DATA_GVien1.dbo.Sys_Email
ORDER BY ID;

-- 3. Form history grouped by request type; no individual payloads.
SELECT d.LoaiDon, t.LoaiDon AS typeName, COUNT_BIG(*) AS requestCount
FROM DATA_SV1.dbo.His_InDon d
LEFT JOIN DATA_SV1.dbo.LoaiDon t ON RTRIM(t.KyHieuDon) = RTRIM(d.LoaiDon)
GROUP BY d.LoaiDon, t.LoaiDon
ORDER BY d.LoaiDon;

-- 4. Request-reception and processing permissions are separate flags.
SELECT MaLoaiDon, QuyenNhanDon, QuyenXuLy,
       COUNT_BIG(*) AS assignments, COUNT(DISTINCT MaHS) AS staffCount
FROM DATA_GVien1.dbo.SV_QuyenXN
GROUP BY MaLoaiDon, QuyenNhanDon, QuyenXuLy
ORDER BY MaLoaiDon, QuyenNhanDon, QuyenXuLy;

-- 5. Document catalogue and issuing department for the latest catalogue term.
SELECT v.IDCode, v.MaVanBan, v.TenVanBan, v.HieuLuc,
       v.ThongTinDinhKem, v.MaDVcap, dv.TenDV,
       v.LePhiThuong, v.LePhiNhanh
FROM DATA_GVien1.dbo.Sys_VanBan v
LEFT JOIN DATA_GVien1.dbo.tmDonVi dv ON RTRIM(dv.MaDV) = RTRIM(v.MaDVcap)
WHERE v.IDCode = (SELECT MAX(IDCode) FROM DATA_GVien1.dbo.Sys_VanBan)
ORDER BY v.MaVanBan;

-- 6. Do not assume (IDCode, MaVanBan) is unique.
SELECT IDCode, MaVanBan, COUNT_BIG(*) AS copies
FROM DATA_GVien1.dbo.Sys_VanBan
WHERE IDCode = (SELECT MAX(IDCode) FROM DATA_GVien1.dbo.Sys_VanBan)
GROUP BY IDCode, MaVanBan
HAVING COUNT_BIG(*) > 1;

-- 7. Document permissions by term/type; no staff identifiers selected.
SELECT IDCode, MaVBXN, COUNT(DISTINCT MaND) AS staffCount
FROM DATA_GVien1.dbo.tmQuyenXNVB
WHERE IDCode = (SELECT MAX(IDCode) FROM DATA_GVien1.dbo.tmQuyenXNVB)
GROUP BY IDCode, MaVBXN
ORDER BY MaVBXN;

-- 8. Metadata only: fields used by request types and request payloads.
SELECT t.name AS tableName, c.name AS columnName, ty.name AS dataType,
       c.max_length AS maxLengthBytes, c.is_nullable AS nullable,
       c.is_identity AS isIdentity
FROM DATA_SV1.sys.tables t
JOIN DATA_SV1.sys.columns c ON c.object_id = t.object_id
JOIN DATA_SV1.sys.types ty ON ty.user_type_id = c.user_type_id
WHERE t.name IN ('LoaiDon', 'His_InDon', 'DeNghiEmail', 'DeNghiVanBan')
ORDER BY t.name, c.column_id;
