import PDFDocument from 'pdfkit';
import { readFileSync } from 'node:fs';

const root = new URL('../../../../assets/request-forms/', import.meta.url);
const layouts = new Map();
const fonts = Object.fromEntries(['Regular', 'Bold', 'Italic', 'BoldItalic'].map(name =>
  [name, readFileSync(new URL(`fonts/Tinos-${name}.ttf`, root))]));
const fontName = name => /Bold/.test(name) ? (/Italic/.test(name) ? 'BoldItalic' : 'Bold') : /Italic/.test(name) ? 'Italic' : 'Regular';
const replace = (text, values) => text.replace(/\{\{(\w+)\}\}/g, (_, key) => String(values[key] ?? ''));

// These immutable layouts were compiled once from the seven neutral Word forms.
// No desktop process, temporary DOCX, conversion queue or persisted student PDF is used here.
export async function renderPaperLayout({ stem, template, values, photo, historyLength = 7 }) {
  if (!layouts.has(stem)) layouts.set(stem, JSON.parse(readFileSync(new URL(`layouts/${stem}.json`, root), 'utf8')));
  const layout = layouts.get(stem);
  const doc = new PDFDocument({ autoFirstPage: false, bufferPages: true, compress: true,
    info: { Title: template.title, Author: 'DUT Student Services', Subject: template.code } });
  for (const [name, bytes] of Object.entries(fonts)) doc.registerFont(name, bytes);
  const chunks = [];
  const bytes = new Promise((resolve, reject) => {
    doc.on('data', c => chunks.push(c)); doc.on('end', () => resolve(Buffer.concat(chunks))); doc.on('error', reject);
  });
  const font = (name, size) => doc.font(fontName(name)).fontSize(size);
  function wrap(text, field) {
    font(field.font, field.size);
    const lines = []; let line = '', first = true;
    const available = () => Math.max(20, field.right - field.left - (first ? field.first : 0));
    const emit = () => { lines.push(line); line = ''; first = false; };
    for (const paragraph of String(text).replace(/\r\n?/g, '\n').split('\n')) {
      for (const word of paragraph.split(/\s+/).filter(Boolean)) {
        if (line && doc.widthOfString(line + ' ' + word) > available()) emit();
        if (doc.widthOfString(word) <= available()) line += (line ? ' ' : '') + word;
        else for (const char of word) {
          if (line && doc.widthOfString(line + char) > available()) emit();
          line += char;
        }
      }
      emit();
    }
    return lines;
  }
  function text(item, x, y, options = {}) {
    if (!item.t) return;
    font(item.f, item.s);
    const measured = doc.widthOfString(item.t);
    const scale = item.w && measured ? item.w / measured * 100 : 100;
    doc.text(item.t, x, y, { lineBreak: false, baseline: 'alphabetic', horizontalScaling: scale, ...options });
  }
  for (let sourcePage = 0; sourcePage < layout.pages.length; sourcePage++) {
    const page = layout.pages[sourcePage], height = page.height, bottom = height - 45;
    let fields = layout.fields.filter(f => f.page === sourcePage && !(f.text === '{{footer}}' && f.y > bottom));
    const spans = page.spans.filter(s => s.t.trim()).map(s => ({ ...s, t: replace(s.t, values) }));
    const lines = page.lines.map(l => [...l]); let rects = page.rects.map(r => [...r]);
    const growth = [];
    // Table rows retain the compiled column boundaries, wrap full term names,
    // repeat their header on overflow, and grow without squeezing text to illegible sizes.
    let history;
    const firstRow = fields.filter(f => f.text.includes('{{history_0_'));
    if (firstRow.length) {
      const second = fields.find(f => f.text.includes('{{history_1_index}}'));
      const step = second.y - firstRow[0].y;
      const top = Math.max(...rects.filter(r => r[3] < 2 && r[1] < firstRow[0].y).map(r => r[1]));
      const oldBottom = top + step * 7;
      const boundaries = firstRow.sort((a,b) => a.left - b.left).map(f => f.left - 3);
      boundaries.push(firstRow.at(-1).right + 3);
      const headerTop = Math.max(...rects.filter(r => r[3] < 2 && r[1] < top - 2).map(r => r[1]));
      history = { top, headerTop, headerHeight: top - headerTop, boundaries, rows: [],
        headerSpans: spans.filter(s => s.y >= headerTop && s.y < top),
        headerRects: rects.filter(r => r[1] >= headerTop - 0.5 && r[1] + r[3] <= top + 0.5) };
      let y = top;
      for (let index = 0; index < Math.max(7, historyLength); index++) {
        const cells = firstRow.map(f => {
          const field = { ...f, first: 0 };
          return { ...field, rows: wrap(replace(f.text.replaceAll('history_0_', `history_${index}_`), values), field) };
        });
        const rowHeight = Math.max(step, ...cells.map(f => f.rows.length * f.size * 1.15 + 2));
        history.rows.push({ y, height: rowHeight, cells }); y += rowHeight;
      }
      growth.push({ at: oldBottom + 0.5, delta: y - oldBottom });
      fields = fields.filter(f => !f.text.includes('{{history_'));
      rects = rects.filter(r => r[1] < top - 0.5 || r[1] > oldBottom + 0.5);
    }
    const prepared = fields.map(f => {
      const value = replace(f.text, values);
      if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value)) throw new Error('Invalid form control character');
      const field = { ...f, first: f.table || f.align === 'center' ? 0 : Math.max(0, f.x - f.left) };
      let size = f.size, rows;
      if (f.table) {
        font(f.font, size);
        size = Math.min(size, size * (f.right - f.left) / Math.max(1, doc.widthOfString(value)));
        rows = [value];
      } else rows = wrap(value, field);
      const step = f.size * 1.2;
      const newHeight = (rows.length - 1) * step + f.size * 1.15;
      if (!f.table && newHeight > f.height + 1) growth.push({ at: f.y + f.height - f.size * 0.7, delta: newHeight - f.height });
      return { ...field, size, rows, step };
    });
    const shifted = y => y + growth.reduce((sum, g) => sum + (y >= g.at ? g.delta : 0), 0);
    const date = fields.find(f => f.text === '{{writtenDate}}');
    const imageTop = page.images.length ? Math.min(...page.images.map(i => i[1])) : Infinity;
    const tail = date ? Math.min(date.y - date.size, imageTop) : Infinity;
    const staticEnd = Math.max(...spans.map(s => s.y + 3), ...prepared.filter(f => f.y >= tail).map(f => f.y + f.height), ...page.images.map(i => i[1] + i[3]));
    const signature = fields.find(f => f.text === '{{name}}' && !f.table);
    const bodyFooter = page.spans.find(s => s.t.includes('{{footer}}'));
    const keep = [];
    if (date) keep.push({ start: tail, end: template.code === 'DonSV01' ? staticEnd :
      Math.max((signature?.y ?? date.y) + 6, ...page.images.map(i => i[1]+i[3])) });
    if (bodyFooter) keep.push({ start: bodyFooter.y - bodyFooter.s, end: staticEnd });
    const kept = y => keep.some(k => y >= k.start && y <= k.end);
    const reservations = prepared.flatMap(f => f.rows.map((_, i) => ({ y: shifted(f.y, f.extraRow) + i * f.step - f.size * 0.85,
      height: f.size * 1.1, inTail: kept(f.y) })));
    reservations.push(...spans.filter(s => !kept(s.y)).map(s => ({ y: shifted(s.y) - s.s * 0.85, height: s.s * 1.1 })));
    for (const block of keep) reservations.push({ y: shifted(block.start), height: shifted(block.end) - shifted(block.start) + 4 });
    if (history) reservations.push(...history.rows.map(r => ({ y: r.y, height: r.height, history: true })));
    const breaks = [];
    const adjusted = y => y + breaks.reduce((n, b) => n + (y >= b.at ? b.delta : 0), 0);
    for (const r of reservations.filter(r => !r.inTail).sort((a,b) => a.y-b.y)) {
      const y = adjusted(r.y), local = y % height;
      if (local + r.height > bottom && r.height < bottom - 70) breaks.push({ at: r.y,
        delta: height + 70 + (r.history ? history.headerHeight : 0) - local });
    }
    const mapped = y => { const n = adjusted(y); return { page: Math.floor(n / height), y: n % height }; };
    const end = mapped(shifted(staticEnd)).page;
    const start = doc.bufferedPageRange().count;
    for (let n = 0; n <= end; n++) doc.addPage({ size: [page.width, height], margin: 0 });
    const select = logicalY => { const p = mapped(logicalY); doc.switchToPage(start + p.page); return p.y; };
    for (const s of spans) text(s, s.x, select(shifted(s.y)));
    for (const f of prepared) f.rows.forEach((row, i) => {
      font(f.font, f.size);
      const width = f.right - f.left - (i === 0 ? f.first : 0);
      const measured = doc.widthOfString(row);
      let x = f.left + (i === 0 ? f.first : 0);
      if (f.align === 'center') x += Math.max(0, (width - measured) / 2);
      // Source table cells and signature slots use their available width; never paint over a neighbouring label.
      const fit = measured > width ? width : undefined;
      const justify = f.align === 'both' && i < f.rows.length - 1 && row.includes(' ') && !fit;
      text({ t: row, f: f.font, s: f.size, w: fit }, x, select(shifted(f.y) + i * f.step),
        justify ? { wordSpacing: (width - measured) / (row.split(' ').length - 1) } : {});
    });
    for (const l of lines) {
      const top = shifted(l[1], l[5]), lower = shifted(l[3], l[5]);
      const p = mapped(top), q = mapped(lower);
      if (p.page !== q.page) continue;
      doc.switchToPage(start + p.page); doc.lineWidth(l[4] || 0.5).moveTo(l[0], p.y).lineTo(l[2], q.y).stroke();
    }
    for (const r of rects) {
      const y = select(shifted(r[1])); doc.rect(r[0], y, r[2], r[3]).fill();
    }
    if (history) {
      const seenPages = new Set();
      for (const row of history.rows) {
        const point = mapped(row.y);
        doc.switchToPage(start + point.page);
        if (!seenPages.has(point.page) && seenPages.size) {
          const offset = point.y - history.headerHeight - history.headerTop;
          for (const s of history.headerSpans) text(s, s.x, s.y + offset);
          for (const r of history.headerRects) doc.rect(r[0], r[1] + offset, r[2], r[3]).fill();
        }
        seenPages.add(point.page);
        for (let i = 0; i < history.boundaries.length - 1; i++) {
          const x = history.boundaries[i], width = history.boundaries[i+1] - x;
          doc.lineWidth(0.48).rect(x, point.y, width, row.height).stroke();
          const cell = row.cells[i];
          cell.rows.forEach((t,n) => {
            font(cell.font, cell.size); const w = doc.widthOfString(t);
            text({ t, f: cell.font, s: cell.size }, x + Math.max(3, (width-w)/2), point.y + 2 + cell.size * 0.8 + n * cell.size * 1.15);
          });
        }
      }
    }
    for (const image of page.images) {
      const y = select(shifted(image[1]));
      if (photo) doc.image(photo, image[0], y, { fit: [image[2], image[3]], align: 'center', valign: 'center' });
      else { doc.rect(image[0], y, image[2], image[3]).lineWidth(0.5).stroke();
        text({ t: 'Ảnh 3 × 4', f: 'TimesNewRomanPSMT', s: 11 }, image[0] + 12, y + image[3] / 2); }
    }
  }
  const pageCount = doc.bufferedPageRange().count;
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i); const y = doc.page.height - 19;
    text({ t: values.footer, f: 'TimesNewRomanPS-ItalicMT', s: 9 }, 32, y);
    text({ t: `-${i + 1}-`, f: 'TimesNewRomanPS-ItalicMT', s: 9 }, doc.page.width - 55, y);
  }
  doc.end(); return { bytes: await bytes, pageCount };
}
