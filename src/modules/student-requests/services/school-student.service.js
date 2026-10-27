import { createSchoolStudentReader } from '../repositories/school-student.repository.js';
import { AppError } from '../../../shared/errors/app-error.js';
import {studentNumberFromIdentity} from '../domain/student-identity.js';

// School adapters issue parameterized SELECTs only. Persistence targets the local cache.
export function createSchoolStudentService(repository,{connect,readProfile=createSchoolStudentReader({connect})}={}) {
  async function load(studentNumber){
    let rows;
    try{rows=await readProfile(studentNumber);}catch(error){if(error instanceof AppError)throw error;throw new AppError('Chưa đọc được hồ sơ sinh viên từ hệ thống trường. Vui lòng thử liên kết lại.',503,{code:'STUDENT_PROFILE_UNAVAILABLE'});}
    if(!rows.length)throw new AppError('Đã xác minh SSO nhưng chưa tìm thấy hồ sơ theo MSSV trong dữ liệu trường. Vui lòng liên hệ bộ phận quản lý hồ sơ.',403,{code:'STUDENT_PROFILE_NOT_FOUND'});
    if(rows.length!==1)throw new AppError('Có nhiều hồ sơ cùng MSSV. Cần kiểm tra dữ liệu trước khi mở hồ sơ sinh viên.',403,{code:'STUDENT_PROFILE_AMBIGUOUS'});
    if(!rows[0].MaHS||String(rows[0].SoTheSV).trim()!==studentNumber)throw new AppError('Hồ sơ trả về không khớp MSSV đã xác minh từ SSO.',403,{code:'STUDENT_PROFILE_MISMATCH'});
    return rows[0];
  }
  return{
    async signIn(claims){return repository.syncSchoolStudent(await load(studentNumberFromIdentity(claims?.identity)));},
    async refresh(studentId){
      const actor=await repository.actor(studentId);
      if(!actor||actor.Role!=='STUDENT'||actor.IdentitySource!=='SSO')throw new AppError('Không có hồ sơ SSO để làm mới.',403);
      const profile=await load(String(actor.StudentNumber).trim());
      if(String(profile.MaHS).trim()!==String(actor.SchoolId).trim())throw new AppError('Mã hồ sơ trường đã thay đổi; cần xác minh lại liên kết sinh viên.',409,{code:'STUDENT_PROFILE_MISMATCH'});
      const id=await repository.syncSchoolStudent(profile);if(id!==studentId)throw new AppError('Liên kết hồ sơ không khớp.',409);return id;
    },
  };
}
