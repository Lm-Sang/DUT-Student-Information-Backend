import sql from 'mssql';
import {connectDatabase} from '../../../infrastructure/database/sql-server.js';
import {AppError} from '../../../shared/errors/app-error.js';
import {mapSchoolAcademics} from '../domain/student-academics.js';

// SELECT only. This source publishes current first-program academic summaries.
// DATA_GVien1's grade entry tables can be empty while these summaries exist.
export function createSchoolAcademicsReader({connect=connectDatabase}={}){
 return async({MaHS,SoTheSV})=>{
  const pool=await connect('secondary','tmProxDUT');
  const result=await pool.request().input('id',sql.NVarChar(30),String(MaHS).trim()).input('number',sql.NVarChar(30),String(SoTheSV).trim()).query(`
   SELECT TOP(2) h.MaHS,h.SoTheSV,h.MaNganh,p.ProgramName
   FROM dbo.tmHoSoSV h
   OUTER APPLY(SELECT CASE WHEN COUNT(DISTINCT TenNganh)=1 THEN MAX(TenNganh) END AS ProgramName FROM dbo.tmNganh WHERE MaNganh=h.MaNganh) p
   WHERE h.SoTheSV=@number ORDER BY h.MaHS;
   SELECT SoTC,HPTichluy,DiemTBTL,DiemRL FROM dbo.tmHocvuTK WHERE MaHS=@id;
   SELECT h.IDCode,h.HPDangky,h.SoTCHoclai,h.DiemTBHB,h.DiemTBHT,h.DiemTBTL,h.DiemRL,
    c.CourseCount,c.GradedCount,c.LowGradeCount
   FROM dbo.tmHocvu h
   LEFT JOIN(SELECT IDCode,COUNT(*) AS CourseCount,COUNT(Diem) AS GradedCount,
    SUM(CASE WHEN Diem>=0 AND Diem<5 THEN 1 ELSE 0 END) AS LowGradeCount
    FROM dbo.tmDiemkyhoc WHERE MaHS=@id GROUP BY IDCode) c
    ON c.IDCode=CASE WHEN LEN(LTRIM(RTRIM(h.IDCode)))=3 AND RIGHT(LTRIM(RTRIM(h.IDCode)),1) IN('1','2') THEN LTRIM(RTRIM(h.IDCode))+'0' ELSE LTRIM(RTRIM(h.IDCode)) END
   WHERE h.MaHS=@id ORDER BY h.IDCode;
   SELECT ID,IDCode,TenKH FROM DATA_GVien1.dbo.tmKehoach;`);
  const [identities,summary,terms,catalog]=result.recordsets;
  if(identities.length!==1||String(identities[0].MaHS).trim()!==String(MaHS).trim()||String(identities[0].SoTheSV).trim()!==String(SoTheSV).trim())throw new AppError('Hồ sơ học vụ không khớp mã hồ sơ và MSSV đã xác minh.',409,{code:'STUDENT_PROFILE_MISMATCH'});
  // MaNganh in the current academic registry changes after registration/transfer.
  // Never fall back to DATA_GVien1's admission program or a second-program code.
  return {...mapSchoolAcademics({summary,terms,catalog}),ProgramName:String(identities[0].ProgramName??'').trim()};
 };
}
