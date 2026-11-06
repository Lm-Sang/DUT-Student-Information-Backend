import {AppError} from '../../../shared/errors/app-error.js';

function invalid(message){throw new AppError(message,502,{code:'INVALID_ACADEMIC_STATISTICS'});}
function numeric(value) {
  if(value===null||value===undefined||(typeof value==='string'&&!value.trim()))return null;
  if(typeof value!=='number'&&typeof value!=='string')invalid('Điểm/tín chỉ từ DUT không hợp lệ.');
  const number=Number(String(value).trim().replace(',','.'));
  if(!Number.isFinite(number))invalid('Điểm/tín chỉ từ DUT không hợp lệ.');
  return number;
}

function semesterIdentity(value) {
  if(typeof value!=='string'||!value.trim()||value.length>80)invalid('Nhãn học kỳ từ DUT không hợp lệ.');
  const label=value.trim();
  const code=/^(\d{2})(10|20|21)$/.exec(label);
  if(code)return{key:code[1]+(code[2]==='21'?'20':code[2]),priority:code[2]==='21'?1:2};
  // Existing snapshots may already use the display label instead of the code.
  const display=label.replace(/^học\s*kỳ\s*/i,'').replace(/\s*năm\s*học\s*/i,' / ');
  const main=/^([12])\s*\/\s*(20\d{2})\s*[-–]\s*(20\d{2})$/.exec(display);
  if(main){
    if(Number(main[3])!==Number(main[2])+1)invalid('Năm học trong dữ liệu điểm không hợp lệ.');
    return{key:String(Number(main[2])-2000).padStart(2,'0')+main[1]+'0',priority:2};
  }
  return{key:label,priority:2};
}

export function normalizeAcademicRows(rows) {
  if(!Array.isArray(rows)||rows.length>200)invalid('Bảng thống kê học tập không hợp lệ.');
  const semesters=new Map();
  for(const item of rows){
    if(!item||typeof item!=='object'||Array.isArray(item))invalid('Dòng thống kê học tập không hợp lệ.');
    const {key,priority}=semesterIdentity(item.semester);
    const row={semester:key,credits:numeric(item.credits),gpa:numeric(item.gpa),conduct:numeric(item.conduct)};
    const previous=semesters.get(key);
    if(!previous||priority>previous.priority)semesters.set(key,{row,priority,conflict:false});
    else if(priority===previous.priority&&!['credits','gpa','conduct'].every(field=>previous.row[field]===row[field]))previous.conflict=true;
    // XX21 is already included in XX20. Never sum it or overwrite the main term.
  }
  for(const {conflict}of semesters.values())if(conflict)invalid('Một học kỳ có nhiều kết quả chính khác nhau. Cần đối chiếu dữ liệu nguồn trước khi lập đơn.');
  return [...semesters.values()].map(item=>item.row);
}

export function normalizeAcademicStatistics(data) {
  const labels=data?.semesters??data?.['Kỳ học']??data?.kyHoc??data?.ky_hoc;
  const gpa=data?.gpaPerSemester??data?.['GPA từng kỳ']??data?.gpa_tung_ky;
  const conduct=data?.conductPerSemester??data?.['Điểm rèn luyện từng kỳ']??data?.drl_tung_ky;
  const credits=data?.creditsPerSemester??data?.['Số tín chỉ đăng ký từng kì']??data?.tin_chi_tung_ky;
  if(![labels,gpa,conduct,credits].every(Array.isArray)||[gpa,conduct,credits].some(items=>items.length!==labels.length)||labels.length>200)
    invalid('Dữ liệu học kỳ và các cột điểm chưa khớp. Chưa thể lập bảng điểm trong đơn.');
  // Zip first, then deduplicate complete rows, so null/zero never shift columns.
  return normalizeAcademicRows(labels.map((semester,index)=>({semester,credits:credits[index],gpa:gpa[index],conduct:conduct[index]})));
}
