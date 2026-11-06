-- Read-only queries, verified against the SQL Server configured in this repo.
-- Run using the primary SQL account. No student records or database writes.
USE [DHBK_CDS];

DECLARE @FacultyCode nvarchar(3) = N'102';
DECLARE @EducationLevelCode nvarchar(6) = N'CD01';
DECLARE @ProgramId nvarchar(7) = N'1021049';

-- 1. Public programmes by faculty. For faculty 102 / CD01 this reproduces
-- all 91 programme codes and names in G_ListCTDT.aspx at inspection time.
SELECT
    n.MaNganh AS ProgramId,
    LEFT(n.MaNganh, 3) AS FacultyId,
    dv.TenDV AS FacultyName,
    n.Kyhieu AS MajorCode,
    n.TenNganh AS ProgramName,
    n.TenCN AS Specialization,
    n.SoTinChi AS RequiredCredits,
    n.Sotuchon AS ElectiveCredits,
    n.SoTinChi - n.Sotuchon AS CompulsoryCredits,
    n.SoHK AS Semesters,
    RTRIM(n.CapDT) AS EducationLevelCode,
    RTRIM(n.NgNguDT) AS TrainingLanguageCode,
    n.BatDau AS StartDate,
    n.KetThuc AS EndDate
FROM dbo.tmNganh n
LEFT JOIN dbo.DonVi dv ON dv.MaDV = LEFT(n.MaNganh, 3)
WHERE LEFT(n.MaNganh, 3) = @FacultyCode
  AND n.CapDT = @EducationLevelCode
  AND n.PubWeb = 1
  AND n.InUse = 1
ORDER BY n.Kyhieu, n.TenNganh, n.MaNganh;

-- 2. Programme summary. MaNganh is the PROGRAMME code, not the major code.
SELECT
    n.MaNganh AS ProgramId,
    n.TenNganh AS ProgramName,
    n.Kyhieu AS MajorCode,
    n.TenCN AS Specialization,
    LEFT(n.MaNganh, 3) AS FacultyId,
    n.SoTinChi AS RequiredCredits,
    n.Sotuchon AS ElectiveCredits,
    n.SoTinChi - n.Sotuchon AS CompulsoryCredits,
    n.SoHK AS Semesters,
    n.BatDau AS StartDate,
    n.KetThuc AS EndDate
FROM dbo.tmNganh n
WHERE n.MaNganh = @ProgramId AND n.PubWeb = 1 AND n.InUse = 1;

-- 3. All curriculum rows, including replacement-course rows.
-- Keep LEFT JOIN: missing course catalogue data must not drop curriculum rows.
-- DATA_GVien1 has supplemental course metadata; the two SQL accounts have
-- different permissions, so export-public-curriculum.js combines these in JS.
-- MaHPTT is returned raw. In the verified web example 1021049, the 95 displayed
-- rows have empty MaHPTT; the database additionally contains 19 replacement rows.
SELECT
    ct.ID AS CurriculumRowId,
    ct.MaKhung AS ProgramId,
    ct.MaHP AS CourseId,
    hp.TenHP AS CourseName,
    hp.KyHieu AS CourseShortName,
    hp.SoTC AS Credits,
    ct.Hocky AS Semester,
    ct.Kyhoc AS SemesterText,
    ct.STT AS DisplayOrder,
    ct.Tuchon AS ElectiveFlag,
    ct.HTDA AS PreProjectFlag,
    ct.TQDA AS ProjectPrerequisiteFlag,
    ct.DATN AS GraduationProjectFlag,
    ct.MaHPTT AS AlternativeCourseId,
    ct.Note AS Notes,
    ct.LoaiKT AS AssessmentType,
    ct.NhomKT AS AssessmentGroup
FROM dbo.tmKhungCT ct
JOIN dbo.tmNganh n ON n.MaNganh = ct.MaKhung
LEFT JOIN dbo.tmHocPhan hp ON hp.MaHP = ct.MaHP
WHERE ct.MaKhung = @ProgramId AND n.PubWeb = 1 AND n.InUse = 1
ORDER BY ct.Hocky, ct.STT, ct.ID;

-- 4. All dependencies, fetched separately to prevent multiplying course rows.
-- Source LoaiDK: 0 previous; 1 prerequisite; 2 co-requisite; 3 supporting.
-- Preserve Hoac and Ghichu; do not silently convert every condition to AND.
SELECT
    dk.ID AS RequirementRowId,
    dk.MaKhung AS ProgramId,
    dk.MaHP AS CourseId,
    dk.MaHPdk AS RequiredCourseId,
    hp.TenHP AS RequiredCourseName,
    dk.LoaiDK AS SourceRequirementType,
    dk.Hoac AS AlternativeCondition,
    dk.Ghichu AS Notes
FROM dbo.tmHocphanDK dk
JOIN dbo.tmNganh n ON n.MaNganh = dk.MaKhung
LEFT JOIN dbo.tmHocPhan hp ON hp.MaHP = dk.MaHPdk
WHERE dk.MaKhung = @ProgramId AND n.PubWeb = 1 AND n.InUse = 1
ORDER BY dk.MaHP, dk.LoaiDK, dk.ID;

