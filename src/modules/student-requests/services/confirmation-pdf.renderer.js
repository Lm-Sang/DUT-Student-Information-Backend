import PDFDocument from 'pdfkit';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { AppError } from '../../../shared/errors/app-error.js';

const time = value => new Intl.DateTimeFormat('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
const money = value => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value || 0);

// Temporary, generic confirmation printout until official templates are supplied.
export function renderConfirmationPdf({ row, profile = {}, printedAt }) {
  const fonts = join(process.env.WINDIR || 'C:/Windows', 'Fonts');
  const regular = join(fonts, 'times.ttf'), bold = join(fonts, 'timesbd.ttf');
  if (!existsSync(regular) || !existsSync(bold)) throw new AppError('Chưa có font Times New Roman để xuất mẫu in xác nhận.', 503);
  const number = `DN-${String(row.Number).padStart(6, '0')}`, catalog = row.CatalogSnapshot || {}, payload = row.Payload;
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margins: { top: 96, bottom: 64, left: 56, right: 56 }, bufferPages: true,
      info: { Title: `Mẫu tượng trưng - ${catalog.name || 'Xác nhận sinh viên'}`, Author: 'DUT - Bản thử nghiệm local' } });
    const chunks = [];
    doc.on('data', part => chunks.push(part)); doc.on('error', reject);
    doc.on('end', () => resolve({ bytes: Buffer.concat(chunks) }));
    doc.registerFont('Body', regular); doc.registerFont('Bold', bold);
    const width = doc.page.width - 112;
    function header() {
      doc.font('Bold').fontSize(10).fillColor('#24344b').text('ĐẠI HỌC ĐÀ NẴNG - TRƯỜNG ĐẠI HỌC BÁCH KHOA', 56, 30, { width });
      doc.font('Body').fontSize(9).text('MẪU TƯỢNG TRƯNG - CHƯA PHẢI BIỂU MẪU CHÍNH THỨC', 56, 48, { width });
      doc.moveTo(56, 70).lineTo(doc.page.width - 56, 70).strokeColor('#b9c3cf').stroke();
      doc.font('Body').fontSize(11).fillColor('#17283c'); doc.x = 56; doc.y = 96;
    }
    header(); doc.on('pageAdded', header);
    doc.font('Bold').fontSize(17).fillColor('#142740').text('BẢN IN XỬ LÝ YÊU CẦU XÁC NHẬN', { width, align: 'center' });
    doc.moveDown(0.5).fontSize(14).text(catalog.name || row.DocumentName || 'Văn bản xác nhận', { width, align: 'center' });
    doc.moveDown(1).font('Body').fontSize(11).fillColor('#17283c');
    function line(label, value) {
      doc.font('Bold').text(label + ': ', { continued: true });
      doc.font('Body').text(String(value ?? '................................'), { width, lineGap: 3 });
    }
    line('Mã yêu cầu', number);
    line('Ngày sinh viên đăng ký', time(row.CreatedAt));
    line('Đơn vị tiếp nhận', row.Department === 'DT' ? 'Phòng Đào tạo' : 'Phòng Công tác sinh viên');
    line('Chuyên viên tiếp nhận', row.AssignedStaffName || '................................');
    doc.moveDown(0.7).font('Bold').fontSize(12).text('THÔNG TIN SINH VIÊN'); doc.moveDown(0.3).fontSize(11);
    line('Họ và tên', profile.name || row.StudentName);
    line('Mã sinh viên', row.StudentNumber);
    line('Lớp', profile.className || '................................');
    line('Ngày sinh', profile.dateOfBirth || '................................');
    doc.moveDown(0.7).font('Bold').fontSize(12).text('NỘI DUNG ĐỀ NGHỊ'); doc.moveDown(0.3).fontSize(11);
    line('Loại văn bản', catalog.name || row.DocumentName);
    line('Mã văn bản', payload.documentCode);
    line('Số lượng', payload.quantity);
    line('Hình thức phí', payload.feeMode === 'FREE' ? 'Miễn phí' : 'Theo mức phí danh mục');
    line('Lệ phí tham khảo', `${money(catalog.unitFee)} / bản; tổng ${money(catalog.totalFee)}`);
    doc.moveDown(0.5).font('Bold').text('Thông tin thêm do sinh viên đăng ký:');
    doc.moveDown(0.3).font('Body').text(payload.additionalInfo || 'Không có nội dung bổ sung.', { width, lineGap: 4 });
    if (doc.y > doc.page.height - 250) doc.addPage();
    doc.moveDown(1).fontSize(10).text('Mẫu tạm để kiểm thử quy trình tiếp nhận, xuất file in và ký bên ngoài. Chưa dùng để xác nhận kết quả học tập hay cấp văn bản chính thức.', { width, lineGap: 3 });
    const signY = doc.y + 25;
    doc.font('Bold').fontSize(11).text('NGƯỜI TIẾP NHẬN', 56, signY, { width: width / 2, align: 'center' });
    doc.text('NGƯỜI KÝ XÁC NHẬN', 56 + width / 2, signY, { width: width / 2, align: 'center' });
    doc.font('Body').fontSize(10).text('(Ký, ghi rõ họ tên)', 56, signY + 20, { width: width / 2, align: 'center' });
    doc.text('(Ký, ghi rõ họ tên theo quy trình)', 56 + width / 2, signY + 20, { width: width / 2, align: 'center' });
    const pages = doc.bufferedPageRange();
    for (let page = pages.start; page < pages.start + pages.count; page++) {
      doc.switchToPage(page);
      const bottom = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      doc.moveTo(56, doc.page.height - 50).lineTo(doc.page.width - 56, doc.page.height - 50).strokeColor('#b9c3cf').stroke();
      doc.font('Body').fontSize(8).fillColor('#4e5b6d').text(`${number} | Xuất file: ${time(printedAt)} | Trang ${page + 1}/${pages.count}`, 56, doc.page.height - 43,
        { width, align: 'center', lineBreak: false });
      doc.page.margins.bottom = bottom;
    }
    doc.end();
  });
}
