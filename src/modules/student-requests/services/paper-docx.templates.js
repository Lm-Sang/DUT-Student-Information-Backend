import PizZip from 'pizzip';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { readFileSync } from 'node:fs';
import { AppError } from '../../../shared/errors/app-error.js';

const root = new URL('../../../../assets/request-forms/', import.meta.url);
const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const textElements = document => Array.from(document.getElementsByTagNameNS(W, 't'));
const parse = source => new DOMParser({ onError: level => { if (level === 'error' || level === 'fatalError') throw new Error('Invalid Word template XML'); } }).parseFromString(source, 'application/xml');
const serialize = document => new XMLSerializer().serializeToString(document);

export function docxStem(template, payload = {}) {
  return `${template.code}-${template.slug}${template.code === 'DonSV01' && payload.reasonCode === 'CHANGE_INFO' ? '-thay-doi-thong-tin' : ''}`;
}

export function fillPaperDocx({ template, payload = {}, values = {}, photo = null, historyLength = 7 }) {
  const stem = docxStem(template, payload);
  if (!/^(?:DonSV01-cap-lai-the-sinh-vien(?:-thay-doi-thong-tin)?|DonSV03-xet-cong-nhan-tot-nghiep|DonSV04-hoan-cong-nhan-tot-nghiep|DonSV05-xet-hoc-bong|DonSV07-hoc-chuong-trinh-2|DonSV06-thoi-hoc)$/.test(stem)) throw new AppError('Mẫu Word không hợp lệ.', 400);
  const zip = new PizZip(readFileSync(new URL(`docx/${stem}.docx`, root)));
  for (const name of Object.keys(zip.files).filter(name => /^word\/(?:document|header\w*|footer\w*)\.xml$/.test(name))) {
    const source = zip.file(name).asText();
    if (!source.includes('{{')) continue;
    const document = parse(source);
    if (name === 'word/document.xml' && ['DonSV06', 'DonSV07'].includes(template.code) && historyLength > 7) {
      const rows = Array.from(document.getElementsByTagNameNS(W, 'tr'));
      const last = rows.find(row => row.textContent.includes('{{history_6_index}}'));
      for (let i = 7; i < historyLength; i++) {
        const copy = last.cloneNode(true);
        for (const text of textElements(copy)) text.textContent = text.textContent.replaceAll('history_6_', `history_${i}_`);
        last.parentNode.appendChild(copy);
      }
    }
    for (const text of textElements(document)) {
      if (!text.textContent.includes('{{')) continue;
      const value = text.textContent.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_, key) => String(values[key] ?? ''));
      if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value)) throw new AppError('Nội dung chứa ký tự điều khiển không hợp lệ cho biểu mẫu.', 422);
      const lines = value.replace(/\r\n?/g, '\n').split('\n');
      text.textContent = lines[0]; text.setAttribute('xml:space', 'preserve');
      let previous = text;
      for (const line of lines.slice(1)) {
        const br = document.createElementNS(W, 'w:br'), next = document.createElementNS(W, 'w:t');
        next.setAttribute('xml:space', 'preserve'); next.textContent = line;
        text.parentNode.insertBefore(br, previous.nextSibling); text.parentNode.insertBefore(next, br.nextSibling); previous = next;
      }
    }
    zip.file(name, serialize(document));
  }
  if (photo && zip.file('word/media/student-photo.png')) {
    const jpeg = photo.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
    if (jpeg) {
      zip.remove('word/media/student-photo.png'); zip.file('word/media/student-photo.jpg', photo);
      const rel = 'word/_rels/document.xml.rels'; zip.file(rel, zip.file(rel).asText().replaceAll('media/student-photo.png', 'media/student-photo.jpg'));
      const content = parse(zip.file('[Content_Types].xml').asText());
      if (!Array.from(content.documentElement.childNodes).some(node => node.nodeType === 1 && node.getAttribute('Extension') === 'jpg')) {
        const type = content.createElementNS('http://schemas.openxmlformats.org/package/2006/content-types', 'Default');
        type.setAttribute('Extension', 'jpg'); type.setAttribute('ContentType', 'image/jpeg'); content.documentElement.appendChild(type);
      }
      zip.file('[Content_Types].xml', serialize(content));
    } else zip.file('word/media/student-photo.png', photo);
  }
  return zip.generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}
