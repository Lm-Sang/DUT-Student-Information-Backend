import {AppError} from '../../../shared/errors/app-error.js';

export const reasons=Object.freeze([
  {code:'medical',label:'Chữa bệnh'}, {code:'accident',label:'Tai nạn'},
  {code:'military',label:'Thực hiện nghĩa vụ quân sự'}, {code:'maternity',label:'Thai sản'},
]);
export const statusLabels=Object.freeze({draft:'Bản nháp',submitted:'Chờ chuyên viên xét duyệt',needs_changes:'Cần bổ sung',
  approved:'Đã duyệt online · chờ nộp giấy',rejected:'Không duyệt',paper_received:'Đã nhận đơn giấy',cancelled:'Đã hủy'});

export function semester(code) {
  const match=/^(\d{2})([12])0$/.exec(code??'');
  if(!match)throw new AppError('Mã học kỳ chính không hợp lệ.',400);
  const year=2000+Number(match[1]),term=Number(match[2]);
  return{code,year,term,ordinal:year*2+term-1,label:`Học kỳ ${term} năm học ${year}-${year+1}`};
}
export function shiftSemester(code,count) {
  const ordinal=semester(code).ordinal+count,year=Math.floor(ordinal/2),term=ordinal%2+1;
  if(year<2000||year>2099)throw new AppError('Học kỳ nằm ngoài phạm vi mã học kỳ của nguồn.',400);
  return semester(String(year-2000).padStart(2,'0')+term+'0');
}
export function semesterChoices(currentCode) {
  return [{...semester(currentCode),position:'current'}];
}
export function validatePeriod(input,currentCode,parent) {
  const maxCount=input.kind==='return'?0:input.reasonCode==='military'?4:1;
  if(!Number.isInteger(input.semesterCount)||input.semesterCount<(input.kind==='return'?0:1)||input.semesterCount>maxCount)
    throw new AppError('Mỗi lần ngừng học/gia hạn chỉ được 1 kỳ; nghĩa vụ quân sự được tối đa 4 kỳ. Đơn trở lại học không có thời lượng ngừng học.',400);
  if(!semesterChoices(currentCode).some(item=>item.code===input.startSemesterCode))
    throw new AppError('Chỉ được lập đơn cho học kỳ hiện tại. Gia hạn thực hiện khi sang kỳ tiếp theo.',409);
  if(['extension','return'].includes(input.kind)) {
    if(!parent||parent.kind==='return'||!['approved','paper_received'].includes(parent.status))throw new AppError('Cần liên kết với đơn ngừng học/gia hạn đã được duyệt trong lịch sử.',409);
    const returnSemester=shiftSemester(parent.startSemesterCode,parent.semesterCount);
    if(input.kind==='extension'&&input.startSemesterCode!==returnSemester.code)
      throw new AppError('Kỳ bắt đầu gia hạn phải nối tiếp thời gian ngừng học của đơn trước.',409);
    if(input.kind==='return'&&semester(currentCode).ordinal<returnSemester.ordinal)
      throw new AppError('Chưa đến học kỳ trở lại học theo đơn ngừng học/gia hạn trước.',409);
  }
}
export function applicationView(row,now=new Date()) {
  if(!row)return null;
  return {...row,printUrl:'/api/academic-leave/print?MADN='+encodeURIComponent(row.requestCode),
    statusLabel:statusLabels[row.status],reasonLabel:reasons.find(item=>item.code===row.reasonCode)?.label,
    startSemester:semester(row.startSemesterCode),endSemester:row.kind==='return'?null:shiftSemester(row.startSemesterCode,row.semesterCount-1),
    returnSemester:shiftSemester(row.startSemesterCode,row.semesterCount),
    overdue:row.status==='approved'&&Date.parse(row.paperDeadlineAt)<now.getTime(),
    canEdit:['draft','needs_changes'].includes(row.status),canPrint:['submitted','approved','paper_received'].includes(row.status)};
}
