function decode(value) {
  if (value == null) return null;
  const source = value.trim();
  try {
    return decodeURIComponent(source.replace(/\+/g, ' '));
  } catch {
    return source;
  }
}

/** @returns {import('../dto/announcements.response.dto.js').AnnouncementSummaryDto} */
export function toAnnouncementSummaryDto(row) {
  return {
    id: row.ID,
    code: row.MaThongBao?.trim() ?? null,
    title: decode(row.Tieude),
    postedAt: row.Ngaydang ?? null,
    author: row.Nguoidang?.trim() ?? null,
    category: row.LinhVuc?.trim() ?? null,
    subcategory: row.LinhVucCT?.trim() ?? null,
  };
}

/** @returns {import('../dto/announcements.response.dto.js').AnnouncementDetailDto} */
export function toAnnouncementDetailDto(row) {
  return { ...toAnnouncementSummaryDto(row), contentHtml: decode(row.Noidung) };
}
