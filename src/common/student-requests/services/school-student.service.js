import { createSchoolStudentReader } from '../repositories/school-student.repository.js';
import { AppError } from '../../../shared/errors/app-error.js';
import {studentNumberFromIdentity} from '../rules/student-identity.js';

// School adapters issue parameterized SELECTs only. Persistence targets the local cache.
export function createSchoolStudentService(repository,{connect,readProfile=createSchoolStudentReader({connect}),now=Date.now,linkTtlMs=300_000,maxEntries=1000}={}) {
  // Cache only the verified session-to-actor link. JWT/session validation and
  // current SQL account permissions still run in request-actor on every API call.
  const links=new Map(),recentSync=new Map();
  function remember(map,key,value){
    map.delete(key);map.set(key,value);
    while(map.size>maxEntries)map.delete(map.keys().next().value);
  }
  async function sync(profile){
    const id=await repository.syncSchoolStudent(profile);
    remember(recentSync,id,{at:now(),schoolId:String(profile.MaHS).trim(),number:String(profile.SoTheSV).trim()});
    return id;
  }
  async function load(studentNumber){
    let rows;
    try{rows=await readProfile(studentNumber);}catch(error){if(error instanceof AppError)throw error;throw new AppError('Chưa đọc được hồ sơ sinh viên từ hệ thống trường. Vui lòng thử liên kết lại.',503,{code:'STUDENT_PROFILE_UNAVAILABLE'});}
    if(!rows.length)throw new AppError('Đã xác minh SSO nhưng chưa tìm thấy hồ sơ theo MSSV trong dữ liệu trường. Vui lòng liên hệ bộ phận quản lý hồ sơ.',403,{code:'STUDENT_PROFILE_NOT_FOUND'});
    if(rows.length!==1)throw new AppError('Có nhiều hồ sơ cùng MSSV. Cần kiểm tra dữ liệu trước khi mở hồ sơ sinh viên.',403,{code:'STUDENT_PROFILE_AMBIGUOUS'});
    if(!rows[0].MaHS||String(rows[0].SoTheSV).trim()!==studentNumber)throw new AppError('Hồ sơ trả về không khớp MSSV đã xác minh từ SSO.',403,{code:'STUDENT_PROFILE_MISMATCH'});
    return rows[0];
  }
  return{
    async signIn(claims){
      const number=studentNumberFromIdentity(claims?.identity);
      // Raw SSO tokens are validated on every request; cache only their profile link.
      const identityKey=claims?.ssoTokenHash??claims?.sid;
      if(!identityKey)return sync(await load(number));
      const key=JSON.stringify([identityKey,claims.sub,claims.identity?.id,number]);
      const cached=links.get(key);
      if(cached&&cached.expiresAt>now())return cached.promise;
      for(const[k,entry]of links)if(entry.expiresAt<=now())links.delete(k);
      const entry={expiresAt:now()+linkTtlMs};
      entry.promise=load(number).then(sync).then(id=>{
        entry.expiresAt=now()+linkTtlMs;return id;
      }).catch(error=>{if(links.get(key)===entry)links.delete(key);throw error;});
      remember(links,key,entry);
      return entry.promise;
    },
    async refresh(studentId,{maxAgeMs=0}={}){
      const actor=await repository.actor(studentId);
      if(!actor||actor.Role!=='STUDENT'||actor.IdentitySource!=='SSO')throw new AppError('Không có hồ sơ SSO để làm mới.',403);
      const recent=recentSync.get(studentId);
      if(maxAgeMs>0&&recent&&now()-recent.at<Math.min(maxAgeMs,30_000)
        &&recent.schoolId===String(actor.SchoolId).trim()&&recent.number===String(actor.StudentNumber).trim())return studentId;
      recentSync.delete(studentId);
      const profile=await load(String(actor.StudentNumber).trim());
      if(String(profile.MaHS).trim()!==String(actor.SchoolId).trim())throw new AppError('Mã hồ sơ trường đã thay đổi; cần xác minh lại liên kết sinh viên.',409,{code:'STUDENT_PROFILE_MISMATCH'});
      const id=await sync(profile);if(id!==studentId){recentSync.delete(id);throw new AppError('Liên kết hồ sơ không khớp.',409);}return id;
    },
  };
}
