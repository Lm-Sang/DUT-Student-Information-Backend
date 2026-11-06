// Migration/test seed only. Runtime catalog is loaded from svc_demo.LoaiDon.
export const paperRequestCodes = ['DonSV01', 'DonSV03', 'DonSV04', 'DonSV05', 'DonSV07', 'DonSV06'];
const isPaperRequest = code => paperRequestCodes.includes(code);

export const requestTypes = [
  { code: 'DonSV01', name: 'Cấp lại thẻ sinh viên', department: 'CTSV', icon: 'card', description: 'Mất, hỏng thẻ hoặc cần thay đổi thông tin.' },
  { code: 'DonSV03', name: 'Xét công nhận tốt nghiệp', department: 'DT', icon: 'graduation', description: 'Đăng ký học kỳ dự kiến tốt nghiệp.' },
  { code: 'DonSV04', name: 'Hoãn công nhận tốt nghiệp', department: 'DT', icon: 'calendar', description: 'Đơn theo mẫu cố định để học cải thiện; tự động điền hồ sơ sinh viên.' },
  { code: 'DonSV05', name: 'Xét học bổng khuyến học', department: 'CTSV', icon: 'award', description: 'Đề nghị xét học bổng theo học kỳ, kèm lý do.' },
  { code: 'DonSV07', name: 'Đăng ký chương trình 2', department: 'DT', icon: 'books', description: 'Chọn chương trình đào tạo và kỳ bắt đầu.' },
  { code: 'DonSV06', name: 'Giải quyết thủ tục thôi học', department: 'DT', icon: 'file', description: 'Đề nghị thôi học theo nguyện vọng hoặc chuyển trường.' },
  { code: 'CONFIRMATION', name: 'Cấp văn bản xác nhận', department: 'BY_DOCUMENT', icon: 'file', description: 'Bảng điểm, xác nhận sinh viên, vay vốn, hoãn NVQS và kết quả rèn luyện.' },
  { code: 'LMS_SUPPORT', name: 'Cấp lại mật khẩu DUT-LMS', department: 'IT', icon: 'card', description: 'Bấm gửi yêu cầu. Chuyên viên sẽ phản hồi mật khẩu trong chi tiết yêu cầu.' },
].map(type => ({ ...type, group: isPaperRequest(type.code) ? 'PETITION' : type.code === 'CONFIRMATION' ? 'CONFIRMATION' : 'LMS',
  submissionMode: isPaperRequest(type.code) ? 'PAPER_FORM' : 'WEB',
  active: true, validationProfile: type.code, templateCode: isPaperRequest(type.code) ? type.code : null,
  formTemplateStatus: isPaperRequest(type.code) ? 'READY' : null }));


