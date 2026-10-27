import sql from 'mssql';
import {connectDatabase} from '../../../infrastructure/database/sql-server.js';
import {AppError} from '../../../shared/errors/app-error.js';
import {mapSchoolProfile} from '../domain/student-profile.js';
import {createSchoolAcademicsReader} from './school-academics.repository.js';

// School access is deliberately limited to this parameterized SELECT.
export function createSchoolStudentReader({connect=connectDatabase}={}) {
  const readAcademics=createSchoolAcademicsReader({connect});
  return async studentNumber=>{
    const pool=await connect('secondary','DATA_GVien1');
    const result=await pool.request().input('studentNumber',sql.NVarChar(30),studentNumber).query(`
      SELECT TOP(2) h.MaHS,h.SoTheSV,h.Hoten,h.MaLop,h.Ngaysinh,h.NoiSinh,h.Gioitinh,h.DanToc,h.SoCMND,h.Mobile,h.Dienthoai AS AdmissionPhone,
       l.ClassName AS AdmissionClassName,p.ProgramName AS AdmissionProgramName,d.EthnicityName AS AdmissionEthnicityName,b.PlaceName AS AdmissionBirthPlaceName
      FROM dbo.tmHoSoSV h
      OUTER APPLY(SELECT CASE WHEN COUNT(DISTINCT TenLop)=1 THEN MAX(TenLop) END AS ClassName FROM dbo.tmLop WHERE MaLop=h.MaLop) l
      OUTER APPLY(SELECT CASE WHEN COUNT(DISTINCT TenNganh)=1 THEN MAX(TenNganh) END AS ProgramName FROM dbo.tmNganh WHERE MaNganh=h.MaNganh) p
      OUTER APPLY(SELECT CASE WHEN COUNT(DISTINCT DanToc)=1 THEN MAX(DanToc) END AS EthnicityName FROM DATA_SV1.dbo.Ma_DanToc WHERE MaDT=CASE WHEN LEN(LTRIM(RTRIM(h.DanToc))) BETWEEN 1 AND 2 AND LTRIM(RTRIM(h.DanToc)) NOT LIKE '%[^0-9]%' THEN RIGHT('00'+LTRIM(RTRIM(h.DanToc)),2) ELSE LTRIM(RTRIM(h.DanToc)) END) d
      OUTER APPLY(SELECT CASE WHEN COUNT(DISTINCT TenDP)=1 THEN MAX(TenDP) END AS PlaceName FROM dbo.tmDiaPhuong WHERE MaDP=h.NoiSinh) b
      WHERE h.SoTheSV=@studentNumber ORDER BY h.MaHS`);
    if(result.recordset.length!==1)return result.recordset;
    const currentPool=await connect('secondary','DATA_SV1');
    const current=await currentPool.request().input('studentNumber',sql.NVarChar(30),studentNumber).query(`
      SELECT TOP(2) n.MaHS AS CurrentMaHS,n.SoThe AS CurrentStudentNumber,n.Hoten AS CurrentName,n.Lop AS CurrentClass,
       n.CCCD_So AS CurrentCccd,n.cmnd AS CurrentIdentity,n.dienthoai AS CurrentPhone,
       n.ngay AS BirthDay,n.thang AS BirthMonth,n.nam AS BirthYear,n.noisinh AS CurrentBirthPlace,n.gioitinh AS CurrentGender,
       n.Foreigner AS ForeignBirth,n.NoiSinhNN AS ForeignBirthPlace,b.PlaceName AS CurrentBirthPlaceName,
       n.dantoc AS CurrentEthnicityCode,d.EthnicityName AS CurrentEthnicityName,l.ClassName AS CurrentClassNameFromCode,p.ProgramName AS CurrentProgramName
      FROM dbo.NhanThan n
      OUTER APPLY(SELECT CASE WHEN COUNT(DISTINCT DanToc)=1 THEN MAX(DanToc) END AS EthnicityName FROM dbo.Ma_DanToc WHERE MaDT=CASE WHEN LEN(LTRIM(RTRIM(n.dantoc))) BETWEEN 1 AND 2 AND LTRIM(RTRIM(n.dantoc)) NOT LIKE '%[^0-9]%' THEN RIGHT('00'+LTRIM(RTRIM(n.dantoc)),2) ELSE LTRIM(RTRIM(n.dantoc)) END) d
      OUTER APPLY(SELECT CASE WHEN COUNT(DISTINCT TenLop)=1 THEN MAX(TenLop) END AS ClassName FROM DATA_GVien1.dbo.tmLop WHERE MaLop=n.Lop) l
      OUTER APPLY(SELECT CASE WHEN COUNT(DISTINCT TenNganh)=1 THEN MAX(TenNganh) END AS ProgramName FROM DATA_GVien1.dbo.tmNganh WHERE MaNganh=n.nganh) p
      OUTER APPLY(SELECT CASE WHEN COUNT(DISTINCT TinhThanh)=1 THEN MAX(TinhThanh) END AS PlaceName FROM dbo.Ma_DiaPhuongC1 WHERE MaTinhThanh=CASE WHEN LEN(LTRIM(RTRIM(n.noisinh))) BETWEEN 1 AND 2 AND LTRIM(RTRIM(n.noisinh)) NOT LIKE '%[^0-9]%' THEN RIGHT('00'+LTRIM(RTRIM(n.noisinh)),2) ELSE LTRIM(RTRIM(n.noisinh)) END) b
      WHERE n.SoThe=@studentNumber ORDER BY n.MaHS`);
    if(current.recordset.length>1)throw new AppError('Có nhiều bản ghi nhân thân cùng MSSV. Cần kiểm tra dữ liệu trước khi điền đơn.',409,{code:'STUDENT_PROFILE_AMBIGUOUS'});
    const profile=mapSchoolProfile(result.recordset[0],current.recordset[0]||null);
    return[{...profile,...await readAcademics(profile),Source:'DATA_SV1/DATA_GVien1/tmProxDUT'}];
  };
}
