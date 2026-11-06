import { object, text, invalid, uuid, integer, evidenceContentType } from './certifications.request.dto.js';

export function validateItData(value, studentCode) {
  const data = object(value, ['MaHS', 'MaCC', 'SoHieu', 'SoVaoSo', 'SoNgayQD',
    'GhiChu', 'CoSoCapCC', 'NgayCC', 'MaHS_SoVaoSo'], 'data');
  const MaHS = text(data.MaHS ?? studentCode, 'MaHS', 9, true);
  if (!/^\d{9}$/.test(MaHS)) invalid('Mã hồ sơ sinh viên phải có chín chữ số.', 'MaHS');
  const NgayCC = data.NgayCC == null || data.NgayCC === '' ? null : data.NgayCC;
  if (NgayCC !== null && (typeof NgayCC !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(NgayCC)
    || NgayCC.startsWith('0000') || !Number.isFinite(Date.parse(NgayCC))
    || new Date(NgayCC).toISOString().slice(0, 10) !== NgayCC))
    invalid('Ngày cấp không hợp lệ. Dùng YYYY-MM-DD.', 'NgayCC');
  return {
    MaHS, MaCC: text(data.MaCC, 'MaCC', 10, true),
    SoHieu: text(data.SoHieu, 'SoHieu', 20), SoVaoSo: text(data.SoVaoSo, 'SoVaoSo', 30),
    SoNgayQD: text(data.SoNgayQD, 'SoNgayQD', 250), GhiChu: text(data.GhiChu, 'GhiChu', 250),
    CoSoCapCC: text(data.CoSoCapCC, 'CoSoCapCC', 250, true), NgayCC,
    MaHS_SoVaoSo: text(data.MaHS_SoVaoSo, 'MaHS_SoVaoSo', 100),
  };
}

export function parseItPreparation(body, config, studentCode) {
  const input = object(body, ['applicationId', 'data', 'files']);
  if (!Array.isArray(input.files) || !input.files.length || input.files.length > config.maxFiles)
    invalid('Số ảnh minh chứng không hợp lệ.', 'files');
  return {
    applicationId: input.applicationId === undefined ? null : uuid(input.applicationId, 'applicationId'),
    data: validateItData(input.data, studentCode),
    files: input.files.map(file => {
      object(file, ['purpose', 'fileName', 'contentType', 'sizeBytes']);
      if (file.purpose !== undefined && file.purpose !== 'general')
        invalid('Ảnh tin học chỉ nhận purpose general.', 'purpose');
      const contentType=evidenceContentType(file.contentType);
      return { purpose: 'general', fileName: text(file.fileName, 'fileName', 255, true),
        contentType, sizeBytes: integer(file.sizeBytes, 'sizeBytes', 1, config.maxFileBytes) };
    }),
  };
}
