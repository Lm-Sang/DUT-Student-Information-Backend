import { renderAcademicReturnPrint } from "./academic-return-print.mapper.js";

const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
function date(value) {
  if (!value) return "";
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}
function term(value) {
  const match = /^(\d{2})([12])0$/.exec(value);
  return match
    ? `${match[2]} / ${2000 + Number(match[1])}-${2001 + Number(match[1])}`
    : value;
}
export function renderAcademicLeavePrint(row) {
  if (row.kind === "return") return renderAcademicReturnPrint(row);
  const student = row.snapshot.student,
    extension = row.kind === "extension";
  const title = extension
    ? "ĐƠN ĐỀ NGHỊ GIA HẠN NGỪNG HỌC"
    : "ĐƠN ĐỀ NGHỊ XÉT NGỪNG HỌC";
  const confirmed = new Date(row.studentConfirmedAt);
  const parts = new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Bangkok",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(confirmed);
  const part = (type) => parts.find((item) => item.type === type)?.value;
  const number = (value) =>
    value === null || value === undefined ? "" : escape(value);
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${title} · ${escape(row.requestCode)}</title>
  <style>@page{size:A4;margin:15mm 20mm 17mm}body{font-family:"Times New Roman",serif;font-size:12pt;line-height:1.2;color:#000;max-width:170mm;margin:20px auto}
  h1{font-size:14pt;text-align:center;margin:20px 0 24px}.center{text-align:center}.motto{font-weight:bold}.info{display:grid;grid-template-columns:1fr 1fr;gap:2px 24px;margin:14px 0 10px}
  table{width:100%;border-collapse:collapse;margin:10px 0;font-size:11pt}thead{display:table-header-group}tr{break-inside:avoid}th,td{border:1px solid #000;padding:2px 4px;text-align:center}p{margin:6px 0}
  .signature{text-align:center;width:57%;margin-left:auto;break-inside:avoid}.signature-space{height:17mm}.content{white-space:pre-wrap;overflow-wrap:anywhere}
  .code{font-size:8pt;margin-top:4px}.receipt{border-top:1px solid #000;break-inside:avoid;margin-top:6px;padding-top:4px}.receipt h2{text-align:center;font-size:14pt;margin:8px 0 16px}
  .receipt .signature{min-height:20mm}
  @media print{body{margin:0;max-width:none}}</style></head><body>
  <div class="center motto">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br>Độc lập - Tự do - Hạnh phúc</div><h1>${title}</h1>
  <p class="center"><strong><em>Kính gửi:</em> Ban Giám hiệu Trường Đại học Bách khoa – Đại học Đà Nẵng</strong></p>
  <div class="info"><div>Tôi tên là: <strong>${escape(student.fullName)}</strong></div><div>Điện thoại: <strong>${escape(student.phoneNumber)}</strong></div>
  <div>Sinh ngày: <strong>${escape(date(student.birthday))}</strong></div><div>CCCD số: <strong>${escape(student.cccd)}</strong></div>
  <div>Số thẻ SV: <strong>${escape(student.studentCode)}</strong></div><div>Lớp: <strong>${escape(student.className)}</strong></div></div>
  <table><thead><tr><th>TT</th><th>Học kỳ năm học</th><th>Số tín chỉ</th><th>Điểm TBC học tập</th><th>Điểm RL</th></tr></thead><tbody>
  ${row.snapshot.academicRows.map((item, index) => `<tr><td>${index + 1}</td><td>${escape(term(item.semester))}</td><td>${number(item.credits)}</td><td>${number(item.gpa)}</td><td>${number(item.conduct)}</td></tr>`).join("")}
  </tbody></table>
  <p>Tôi làm đơn này kính đề nghị Nhà trường cho phép tôi ${extension ? "gia hạn ngừng học" : "được ngừng học"}: <strong>${row.semesterCount} học kỳ</strong>,
    từ ${escape(row.startSemester.label.toLowerCase())}, với lý do: <strong>${escape(row.reasonLabel)}</strong>.</p>
  ${extension ? `<p>Gia hạn tiếp theo đơn đã được duyệt số ${escape(row.snapshot.parentRequestCode ?? row.parentApplicationId)}.</p>` : ""}
  ${row.content ? `<p class="content">${escape(row.content)}</p>` : ""}
  <div class="signature"><p><em>Đà Nẵng, ngày ${part("day")} tháng ${part("month")} năm ${part("year")}</em></p><p><strong>Kính đơn</strong></p><div class="signature-space"></div><p><strong>${escape(student.fullName)}</strong></p></div>
  <div class="code">${escape(row.requestCode)}, ${part("hour")}:${part("minute")} ${escape(date(row.studentConfirmedAt))}<br>
  Đơn được nộp tại “Hành chính một cửa sinh viên” lúc ……h…… ngày……/……/……</div>
  <section class="receipt"><h2>BIÊN NHẬN</h2>
  <p>Nhà trường đã nhận đơn đề nghị ${extension ? "gia hạn ngừng học" : "xét ngừng học"} của sinh viên ${escape(student.fullName)}
  (Lớp: ${escape(student.className)}, Số thẻ SV: ${escape(student.studentCode)}) nộp lúc ……h…… ngày……/……/……</p>
  <p>Đề nghị sinh viên theo dõi website “Hệ thống thông tin sinh viên” để biết tiến trình xử lý hồ sơ và đến nhận Quyết định khi hồ sơ được giải quyết.</p>
  <div class="signature"><p><em>Đà Nẵng, ngày …… tháng …… năm ${part("year")}</em></p><p><strong>Chuyên viên nhận hồ sơ</strong><br><em>(Ký và ghi rõ họ tên)</em></p></div></section>
  </body></html>`;
}
