// Vietnamese SQL columns; API names remain stable at the HTTP boundary.
export const paperColumns = {
  reasonCode: 'LyDoDeNghi', changeDescription: 'ThongTinThayDoiThe', expectedTerm: 'HocKyDuKienTotNghiep',
  targetTerm: 'HocKyHoanTotNghiep', reviewTerm: 'HocKyXetHocBong', reason: 'LyDo',
  programCode: 'MaNganhTQ', startTerm: 'HocKyBatDau', reasonDetail: 'NoiDungTrinhBay',
};
export const documentColumns = { documentCode: 'MaVanban', additionalInfo: 'TTbosung', quantity: 'SoLuong',
  feeMode: 'MienPhi', serviceSpeed: 'Khan', periodTerm: 'HocKy', academicYear: 'NamHoc' };
export const emailColumns = { supportCode: 'MaEmail', issueCode: 'LoaiHoTro', description: 'NoiDungDeNghi',
  contactEmail: 'EmailLienHe', ownershipConfirmed: 'XacNhanChuTaiKhoan' };
export const allPayloadColumns = { ...paperColumns, ...documentColumns, ...emailColumns };
export const departmentToDatabase = value => ({ DT: '115', CTSV: '120' }[value] || value);

export function payloadColumns(typeCode) {
  return typeCode === 'CONFIRMATION' ? documentColumns : typeCode === 'LMS_SUPPORT' ? emailColumns : paperColumns;
}
export function payloadFromColumns(row, typeCode = row.TypeCode) {
  const out = {};
  for (const [key, column] of Object.entries(payloadColumns(typeCode))) {
    const value = row[column];
    if (key === 'feeMode') out[key] = value ? 'FREE' : 'PAID';
    else if (key === 'serviceSpeed') out[key] = value ? 'RUSH' : 'NORMAL';
    else if (key === 'quantity') out[key] = value;
    else if (key === 'ownershipConfirmed') out[key] = Boolean(value);
    else out[key] = value ?? '';
  }
  if (typeCode !== 'CONFIRMATION' && typeCode !== 'LMS_SUPPORT') {
    const keys = { DonSV01: ['reasonCode','changeDescription'], DonSV03: ['expectedTerm'], DonSV04: ['targetTerm','reason'],
      DonSV05: ['reviewTerm','reason'], DonSV07: ['programCode','startTerm'], DonSV06: ['reasonCode','reasonDetail'] }[typeCode] || [];
    return Object.fromEntries(keys.map(key => [key, out[key]]));
  }
  return out;
}
export function columnValue(key, payload) {
  if (key === 'feeMode') return payload.feeMode === 'FREE' ? 1 : 0;
  if (key === 'serviceSpeed') return payload.serviceSpeed === 'RUSH' ? 1 : 0;
  if (key === 'ownershipConfirmed') return payload.ownershipConfirmed ? 1 : 0;
  return payload[key] ?? null;
}
