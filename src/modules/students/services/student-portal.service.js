import { AppError } from '../../../shared/errors/app-error.js';
import { createSchoolStudentReader, createStudentGradesReader, studentNumberFromIdentity } from '../../student-requests/index.js';
import { createStudentPortalRepository } from '../repositories/student-portal.repository.js';
import { createCurriculumReader } from '../../curriculum/index.js';
import { createStudentAvatarReader } from '../repositories/student-avatar.repository.js';
import { studentAvatarThumbnail } from './student-avatar.service.js';

const text=value=>String(value??'').trim()||null;
function birthday(value) {
  if(!value)return null;
  const date=new Date(value);
  return Number.isNaN(date.getTime())?null:`${String(date.getUTCDate()).padStart(2,'0')}/${String(date.getUTCMonth()+1).padStart(2,'0')}/${date.getUTCFullYear()}`;
}
export function createStudentPortalService({readProfile=createSchoolStudentReader(),readGrades=createStudentGradesReader(),
  repository=createStudentPortalRepository(),curriculum=createCurriculumReader(),readAvatar=createStudentAvatarReader()}={}) {
  function number(claims) {
    if(claims?.channel!=='student'||claims.authMethod!=='sso')throw new AppError('Cần đăng nhập bằng tài khoản Microsoft sinh viên.',403);
    return studentNumberFromIdentity(claims.identity);
  }
  async function read(operation) {
    try{return await operation();}catch(error){
      if(error instanceof AppError)throw error;
      throw new AppError('Chưa đọc được dữ liệu học tập từ trường. Vui lòng thử lại.',503,{code:'SCHOOL_DATA_UNAVAILABLE'});
    }
  }
  return {
    avatar(claims) {const studentNumber=number(claims);return read(async()=>studentAvatarThumbnail(await readAvatar(studentNumber)));},
    profile(claims) {const studentNumber=number(claims);return read(async()=>{
      const rows=await readProfile(studentNumber);
      if(rows.length!==1||!rows[0].MaHS||String(rows[0].SoTheSV).trim()!==studentNumber)
        throw new AppError('Chưa xác định được duy nhất hồ sơ sinh viên.',409,{code:'STUDENT_PROFILE_MISMATCH'});
      const p=rows[0];
      return {name:text(p.Hoten)||'',studentNumber,className:text(p.ClassName),dateOfBirth:birthday(p.DateOfBirth??p.Ngaysinh),
        identityNumber:text(p.IdentityNumber),phone:text(p.Phone),birthPlace:text(p.BirthPlace),gender:text(p.Gender),ethnicity:text(p.Ethnicity),
        programName:text(p.ProgramName),programId:text(p.ProgramCode),source:'school',isSimulation:false,
        academic:p.academic,semesterResults:p.semesterResults};
    });},
    grades(claims) {const studentNumber=number(claims);return read(()=>readGrades(studentNumber));},
    schedule(claims) {const studentNumber=number(claims);return read(()=>repository.schedule(studentNumber));},
    curriculum(claims) {const studentNumber=number(claims);return read(async()=>{
      const programId=await repository.currentProgram(studentNumber);
      if(!programId)throw new AppError('Hồ sơ trường chưa xác định chương trình đào tạo hiện hành.',404,{code:'STUDENT_PROGRAM_MISSING'});
      return curriculum.getCurriculum(programId,{publicOnly:false});
    });},
  };
}
