import { readFileSync } from 'node:fs';
import { renderPaperLayout } from './paper-layout.renderer.js';

const root = new URL('../../../../assets/request-forms/', import.meta.url);
const names = ['DonSV01-cap-lai-the-sinh-vien', 'DonSV03-xet-cong-nhan-tot-nghiep', 'DonSV04-hoan-cong-nhan-tot-nghiep',
  'DonSV05-xet-hoc-bong', 'DonSV07-hoc-chuong-trinh-2', 'DonSV06-thoi-hoc'];
export const paperTemplates = names.map(name => JSON.parse(readFileSync(new URL('templates/' + name + '.json', root), 'utf8')));

export function formDate(value) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit',
    day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(value)).map(p => [p.type, p.value]));
  return { footer: p.hour + ':' + p.minute + ' ' + p.day + '/' + p.month + '/' + p.year,
    written: 'Đà Nẵng, ngày ' + p.day + ' tháng ' + p.month + ' năm ' + p.year };
}
const inlineTerm = value => String(value || '').replace(/^Học kỳ (.*?) năm học (\d{4})-(\d{4})$/, 'học kỳ $1 / năm học $2 - $3');
// The history column uses the school's compact label, not the catalog's prose.
// Keep unusual/summer labels unless their year range is explicit in the label.
export function historyTerm(value) {
  const text = String(value ?? '').trim();
  const match = text.match(/^(?:(?:Học\s*kỳ|Kỳ)\s*)?(.+?)\s*(?:năm\s*học\s*|\/\s*)(\d{4})\s*[-–—]\s*(\d{4})$/iu);
  return match ? `${match[1].trim()} /${match[2]} - ${match[3]}` : text;
}
const historyNumber = (value, digits) => value == null || value === '' ? '' :
  Number.isFinite(Number(value)) ? Number(value).toFixed(digits) : String(value);
export const scholarshipReasonPrefix='Số tín chỉ tôi học trong học kỳ này không đủ ngưỡng quy định để xét học bổng, do';
export function scholarshipReason(reason){
  const text=String(reason||'').trim();
  return text.toLocaleLowerCase('vi').startsWith(scholarshipReasonPrefix.toLocaleLowerCase('vi'))?text:scholarshipReasonPrefix+' '+(text||'............');
}

export function paperWordValues({ template, snapshot = {}, blank = false }) {
  const profile = blank ? {} : snapshot.profile || {}, values = snapshot.values || {};
  const date = blank ? { footer: '{giờ_lập} {ngày_lập}', written: 'Đà Nẵng, ngày ...... tháng ...... năm ........' } : formDate(snapshot.createdAt);
  const empty = '............';
  const data = Object.fromEntries(['name', 'phone', 'dateOfBirth', 'birthPlace', 'gender', 'ethnicity', 'studentNumber', 'className', 'identityNumber']
    .map(key => [key, blank ? empty : profile[key] ?? empty]));
  Object.assign(data, { writtenDate: date.written, footer: template.code + ' ' + date.footer,
    primaryProgram: blank ? empty : profile.programName || empty,
    expectedTerm: blank ? empty : inlineTerm(values.expectedTerm), targetTerm: blank ? empty : inlineTerm(values.targetTerm),
    reviewTerm: blank ? empty : values.reviewTerm || empty, startTerm: blank ? empty : values.startTerm || empty,
    programName: blank ? empty : values.programName || empty, reason: blank ? empty : values.reason || empty,
    changeDescription: blank ? empty : values.changeDescription || empty,
    withdrawalReason: blank ? empty : (values.withdrawalReason || empty) + '.', reasonDetail: blank ? '' : values.reasonDetail || '' });
  if(template.code==='DonSV05')data.reason=scholarshipReason(blank?'':values.reason);
  // The supplied deferral form has a fixed paragraph, including "học kỳ này".
  // Student notes and old target-term selections are workflow data only.
  if(template.code==='DonSV04'){
    data.reason='Tôi có nhu cầu học cải thiện một số học phần để tăng điểm trung bình chung tích lũy toàn khóa học.';
    data.targetTerm='học kỳ này';
  }
  for (const key of ['requiredCredits', 'earnedCredits', 'cumulativeGpa', 'conductAverage']) data['academic_' + key] = blank ? '' : profile.academic?.[key] ?? 'Chưa có';
  for (const key of ['credits', 'repeatedCredits', 'scholarshipAverage', 'gpa', 'cumulativeGpa', 'hasLowGrade', 'conductScore']) data['scholarship_' + key] = blank ? '' : snapshot.scholarship?.[key] ?? 'Chưa có';
  const history = blank ? [] : profile.semesterResults || [];
  for (let i = 0; i < Math.max(7, history.length); i++) {
    data['history_' + i + '_index'] = i + 1;
    data['history_' + i + '_termName'] = historyTerm(history[i]?.termName);
    for (const key of ['credits', 'gpa', 'cumulativeGpa', 'conductScore']) {
      data['history_' + i + '_' + key] = historyNumber(history[i]?.[key], key === 'conductScore' ? 1 : 2);
    }
  }
  return data;
}

export async function renderPaperPdf({ template, snapshot = {}, blank = false, photo = null }) {
  if (!blank && !photo && snapshot.profile?.photoKind === 'DEMO') photo = readFileSync(new URL('images/demo-student.png', root));
  const stem = `${template.code}-${template.slug}${template.code === 'DonSV01' && snapshot.payload?.reasonCode === 'CHANGE_INFO' ? '-thay-doi-thong-tin' : ''}`;
  return renderPaperLayout({ stem, template, values: paperWordValues({ template, snapshot, blank }),
    photo, historyLength: blank ? 7 : snapshot.profile?.semesterResults?.length || 7 });
}
