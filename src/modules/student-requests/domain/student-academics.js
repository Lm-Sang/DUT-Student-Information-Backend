import {AppError} from '../../../shared/errors/app-error.js';
const clean=value=>String(value??'').trim();
const number=(value,max=10000)=>value!==null&&value!==undefined&&value!==''&&Number.isFinite(Number(value))&&Number(value)>=0&&Number(value)<=max?Number(value):null;
// Ordinary Hocvu semesters are YY1/YY2; course/catalog keys are YY10/YY20.
// Summer and unknown codes are never folded into a different semester.
export const academicTermCode=value=>/^\d{2}[12]$/.test(clean(value))?clean(value)+'0':clean(value);
export function mapSchoolAcademics({summary=[],terms=[],catalog=[]}={}){
 if(summary.length>1)throw new AppError('Có nhiều bản tổng hợp học vụ; cần đối chiếu trước khi điền đơn.',409,{code:'STUDENT_ACADEMICS_AMBIGUOUS'});
 const s=summary[0]||{},seen=new Set();
 const semesterResults=terms.map(t=>{
  const code=academicTermCode(t.IDCode);
  if(!code||seen.has(code))throw new AppError('Kết quả học tập có học kỳ trùng; cần kiểm tra dữ liệu trường.',409,{code:'STUDENT_ACADEMICS_AMBIGUOUS'});
  seen.add(code);
  const term=catalog.find(c=>clean(c.IDCode)===code);
  return {termCode:code,termName:term?.TenKH||code,sortOrder:term?.ID??(Number(code)||0),
   credits:number(t.HPDangky),repeatedCredits:number(t.SoTCHoclai),scholarshipAverage:number(t.DiemTBHB,10),
   gpa:number(t.DiemTBHT,4),cumulativeGpa:number(t.DiemTBTL,4),conductScore:number(t.DiemRL,100),
   hasLowGrade:t.LowGradeCount>0?'Có':t.GradedCount>0&&t.GradedCount===t.CourseCount?'Không':null};
 }).sort((a,b)=>a.sortOrder-b.sortOrder||a.termCode.localeCompare(b.termCode));
 return {academic:{requiredCredits:number(s.SoTC),earnedCredits:number(s.HPTichluy),cumulativeGpa:number(s.DiemTBTL,4),conductAverage:number(s.DiemRL,100)},semesterResults};
}
