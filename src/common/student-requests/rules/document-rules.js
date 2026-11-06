import { AppError } from '../../../shared/errors/app-error.js';

export const documentPeriod = code => ['04', '08'].includes(code) ? 'TERM' : ['05', '09'].includes(code) ? 'YEAR' : 'NONE';

export function normalizeDocuments(rows) {
  const active = rows.filter(row => row.HieuLuc === 1 && row.Caohoc !== 1 && ['115', '120'].includes(row.MaDVcap?.trim()));
  const seen = new Set();
  return active.map(row => {
    const key = `${row.IDCode}:${row.MaVanBan}`;
    if (seen.has(key)) throw new Error(`Duplicate active document catalogue key: ${key}`);
    seen.add(key);
    return { termCode: row.IDCode, code: row.MaVanBan, sourceId: row.ID, name: row.TenVanBan,
      department: row.MaDVcap.trim() === '115' ? 'DT' : 'CTSV', guidance: row.ThongTinDinhKem || '',
      normalFee: row.LePhiThuong, rushFee: row.LePhiNhanh,
      freeAllowed: row.KhongMienPhi === 0, feePolicyKnown: row.KhongMienPhi !== null && row.KhongMienPhi !== undefined, dailyFreeQuota: row.SoLuongMien_Ngay,
      registrationRequired: row.KhongCapNeuKhongHoc === 1, period: documentPeriod(row.MaVanBan), active: true };
  });
}

export function documentSnapshot(document, payload) {
  if (!document) throw new AppError('Loại văn bản không còn nằm trong danh mục được mở.', 400);
  if (payload.feeMode === 'FREE' && !document.freeAllowed) throw new AppError('Danh mục chưa cho phép miễn phí loại văn bản này.', 400);
  if (payload.feeMode === 'FREE' && document.dailyFreeQuota !== null && payload.quantity > document.dailyFreeQuota) throw new AppError('Số bản vượt số lượng miễn phí tham khảo trong danh mục.', 400);
  const fee = payload.serviceSpeed === 'RUSH' ? document.rushFee : document.normalFee;
  if (payload.feeMode === 'PAID' && (fee === null || !Number.isFinite(fee) || fee < 0)) throw new AppError('Chưa có mức phí cho lựa chọn này trong danh mục.', 400);
  const unitFee = payload.feeMode === 'FREE' ? 0 : fee;
  return { ...document, unitFee, totalFee: unitFee * payload.quantity, feeMode: payload.feeMode,
    serviceSpeed: payload.serviceSpeed, quantity: payload.quantity, isEstimate: true,
    eligibilityVerified: false, source: 'DATA_GVien1.Sys_VanBan' };
}

export function schoolYears(terms) {
  return [...new Set(terms.map(term => 2000 + Number(term.code.slice(0, 2))))]
    .sort((a, b) => a - b).map(year => `${year}-${year + 1}`);
}
