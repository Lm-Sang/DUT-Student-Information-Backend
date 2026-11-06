const escape=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const field=value=>value?escape(value):'&nbsp;';
function birthday(value){if(!value)return '';const [year,month,day]=value.slice(0,10).split('-');return `${day}/${month}/${year}`;}

export function renderAcademicReturnPrint(row) {
  const student=row.snapshot.student;
  const parts=new Intl.DateTimeFormat('vi-VN',{timeZone:'Asia/Bangkok',day:'2-digit',month:'2-digit',year:'numeric'})
    .formatToParts(new Date(row.studentConfirmedAt));
  const part=type=>parts.find(item=>item.type===type)?.value;
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8">
  <title>ĐƠN XIN TRỞ LẠI HỌC TẬP · ${escape(row.requestCode)}</title>
  <style>
  @page{size:A4;margin:22mm 20mm 18mm}
  *{box-sizing:border-box}body{font-family:"Times New Roman",serif;font-size:13pt;line-height:1.6;color:#000;max-width:170mm;margin:0 auto}
  .heading{display:grid;grid-template-columns:39% 61%;text-align:center;font-size:11pt;line-height:1.25;gap:2mm}
  .school,.motto{font-weight:bold;text-decoration:underline;text-underline-offset:3px}.country{font-weight:bold;white-space:nowrap}
  h1{text-align:center;font-size:14pt;line-height:1.4;margin:9mm 0 6mm}
  .recipients{margin:0 0 14mm 13mm;line-height:1.35}.recipient-list{padding-left:22mm}
  .identity{margin-bottom:5mm}.identity-row{display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin-bottom:3mm}
  .identity-field{display:flex;align-items:baseline;gap:1mm;min-width:0}.label{white-space:nowrap}
  .value{flex:1;min-width:0;border-bottom:1px dotted #000;overflow-wrap:anywhere;line-height:1.4;padding:0 1mm}
  p{margin:0 0 3mm;text-align:justify;text-indent:10mm}.content{white-space:pre-wrap;overflow-wrap:anywhere}
  .signatures{display:grid;grid-template-columns:1fr 1fr;gap:7mm;margin-top:5mm;text-align:center;break-inside:avoid;line-height:1.2}
  .signature-date{font-style:italic;min-height:7mm;white-space:nowrap;font-size:12pt}
  .instructions{font-style:italic;font-size:11pt}.signature-space{height:22mm}
  .faculty{text-align:center;line-height:1.2;margin-top:8mm;break-inside:avoid}.faculty .signature-space{height:20mm}
  @media print{body{max-width:none}}
  </style></head><body>
  <header class="heading">
    <div>ĐẠI HỌC ĐÀ NẴNG<br><span class="school">TRƯỜNG ĐẠI HỌC BÁCH KHOA</span></div>
    <div><span class="country">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</span><br><span class="motto">Độc lập - Tự do - Hạnh phúc</span></div>
  </header>
  <h1>ĐƠN XIN TRỞ LẠI HỌC TẬP</h1>
  <div class="recipients">Kính gửi:
    <div class="recipient-list">- Ban Giám hiệu Trường Đại học Bách khoa - ĐHĐN;<br>- Phòng Đào tạo;<br>- Ban Chủ nhiệm Khoa</div>
  </div>
  <section class="identity">
    <div class="identity-row">
      <div class="identity-field"><span class="label">Họ và tên:</span><span class="value">${field(student.fullName)}</span></div>
      <div class="identity-field"><span class="label">Ngày sinh:</span><span class="value">${field(birthday(student.birthday))}</span></div>
    </div>
    <div class="identity-row">
      <div class="identity-field"><span class="label">Sinh viên lớp:</span><span class="value">${field(student.className)}</span></div>
      <div class="identity-field"><span class="label">MSSV:</span><span class="value">${field(student.studentCode)}</span></div>
    </div>
    <div class="identity-row">
      <div class="identity-field"><span class="label">Số điện thoại:</span><span class="value">${field(student.phoneNumber)}</span></div>
      <div class="identity-field"><span class="label">Email:</span><span class="value">${field(student.email)}</span></div>
    </div>
  </section>
  <p>Vừa qua, được sự đồng ý của Ban Giám hiệu Nhà Trường, tôi đã được nghỉ học tạm thời và bảo lưu kết quả đã học
  theo Quyết định số ……………/QĐ-ĐHBK ngày ……/……/………… và đến nay đã hết thời hạn quy định được phép nghỉ học.</p>
  <p>Vậy, tôi làm đơn này kính đề nghị Nhà Trường xem xét và giải quyết cho tôi được trở lại học tập.</p>
  ${row.content?`<p class="content">${escape(row.content)}</p>`:''}
  <p>Rất mong nhận được sự chấp thuận của Quý cấp.</p>
  <p>Trân trọng cảm ơn!</p>
  <section class="signatures">
    <div><div class="signature-date">&nbsp;</div><strong>Ý kiến của phụ huynh</strong><br><span class="instructions">(ký và ghi rõ họ tên)</span><div class="signature-space"></div></div>
    <div><div class="signature-date">Đà Nẵng, ngày ${part('day')} tháng ${part('month')} năm ${part('year')}</div><strong>Người làm đơn</strong><br><span class="instructions">(ký và ghi rõ họ tên)</span><div class="signature-space"></div><strong>${escape(student.fullName)}</strong></div>
  </section>
  <section class="faculty"><strong>Ý kiến của Ban Chủ nhiệm Khoa</strong><br><span class="instructions">(ký và ghi rõ họ tên)</span><div class="signature-space"></div></section>
  </body></html>`;
}
