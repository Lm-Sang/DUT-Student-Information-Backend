import {AppError} from '../../../shared/errors/app-error.js';
const text=value=>value==null?'':String(value).trim();
const first=(...values)=>values.map(text).find(Boolean)||'';
function birthDate(day,month,year){
  if(!/^\d{1,2}$/.test(text(day))||!/^\d{1,2}$/.test(text(month))||!/^\d{4}$/.test(text(year)))return null;
  const d=+day,m=+month,y=+year,date=new Date(Date.UTC(y,m-1,d));
  return y>=1900&&date.getUTCFullYear()===y&&date.getUTCMonth()===m-1&&date.getUTCDate()===d?date:null;
}
function ethnicity(code,label){const value=text(code);return text(label)||(/\d/.test(value)&&/^\d+$/.test(value)?'':value);}
const place=(raw,label)=>text(label)||(/^\d+$/.test(text(raw))?'':text(raw));
export function mapSchoolProfile(base,current=null){
  if(current&&(text(current.CurrentStudentNumber)!==text(base.SoTheSV)||text(current.CurrentMaHS)!==text(base.MaHS)))throw new AppError('Thông tin nhân thân không khớp mã hồ sơ và MSSV đã xác minh.',409,{code:'STUDENT_PROFILE_MISMATCH'});
  const n=current||{};
  const currentClass=text(n.CurrentClassNameFromCode)||(/^\d+$/.test(text(n.CurrentClass))?'':text(n.CurrentClass));
  return{
    ...base,
    MaHS:text(base.MaHS),SoTheSV:text(base.SoTheSV),
    Hoten:first(n.CurrentName,base.Hoten),
    ClassName:text(n.CurrentClass)?currentClass:text(base.AdmissionClassName),
    IdentityNumber:first(n.CurrentCccd,n.CurrentIdentity,base.SoCMND),
    Phone:first(n.CurrentPhone,base.Mobile,base.AdmissionPhone),
    DateOfBirth:birthDate(n.BirthDay,n.BirthMonth,n.BirthYear)||base.Ngaysinh||null,
    BirthPlace:n.ForeignBirth===1?first(n.ForeignBirthPlace,place(n.CurrentBirthPlace,n.CurrentBirthPlaceName)):text(n.CurrentBirthPlace)?place(n.CurrentBirthPlace,n.CurrentBirthPlaceName):place(base.NoiSinh,base.AdmissionBirthPlaceName),
    Gender:n.CurrentGender===1?'Nam':n.CurrentGender===2?'Nữ':base.Gioitinh===1?'Nam':base.Gioitinh===0?'Nữ':'',
    Ethnicity:text(n.CurrentEthnicityCode)?ethnicity(n.CurrentEthnicityCode,n.CurrentEthnicityName):ethnicity(base.DanToc,base.AdmissionEthnicityName),
    ProgramName:first(n.CurrentProgramName,base.AdmissionProgramName),
    Source:current?'DATA_SV1.NhanThan + DATA_GVien1':'DATA_GVien1.tmHoSoSV',
  };
}
