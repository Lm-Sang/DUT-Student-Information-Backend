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
  return [-1,0,1].map(offset=>({...shiftSemester(currentCode,offset),position:offset===0?'current':offset<0?'previous':'next'}));
}
export function validatePeriod(input,currentCode,parent) {
  if(!semesterChoices(currentCode).some(item=>item.code===input.startSemesterCode))
    throw new AppError('Chỉ chọn kỳ trước, kỳ hiện tại hoặc kỳ sau. Vui lòng tải lại danh sách học kỳ.',409);
  if(input.kind==='extension') {
    if(!parent||!['approved','paper_received'].includes(parent.status))throw new AppError('Gia hạn cần liên kết với đơn trước đã được duyệt trên hệ thống này.',409);
    if(input.startSemesterCode!==shiftSemester(parent.startSemesterCode,parent.semesterCount).code)
      throw new AppError('Kỳ bắt đầu gia hạn phải nối tiếp thời gian ngừng học của đơn trước.',409);
  }
}
export function applicationView(row,now=new Date()) {
  if(!row)return null;
  return {...row,printUrl:'/api/academic-leave/print?MADN='+encodeURIComponent(row.requestCode),
    statusLabel:statusLabels[row.status],reasonLabel:reasons.find(item=>item.code===row.reasonCode)?.label,
    startSemester:semester(row.startSemesterCode),endSemester:shiftSemester(row.startSemesterCode,row.semesterCount-1),
    returnSemester:shiftSemester(row.startSemesterCode,row.semesterCount),
    overdue:row.status==='approved'&&Date.parse(row.paperDeadlineAt)<now.getTime(),
    canEdit:['draft','needs_changes'].includes(row.status),canPrint:['submitted','approved','paper_received'].includes(row.status)};
}
