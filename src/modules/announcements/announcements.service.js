import { AppError } from '../../shared/errors/app-error.js';

function decode(value) {
  if (value == null) return null;
  const source = value.trim();
  try {
    return decodeURIComponent(source.replace(/\+/g, ' '));
  } catch {
    return source;
  }
}

function summary(row) {
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

async function readSource(operation) {
  try {
    return await operation();
  } catch {
    throw new AppError('Announcements are temporarily unavailable.', 503);
  }
}

export function createAnnouncementsService(repository) {
  return {
    async list({ pageIndex, pageSize }) {
      const { totalRecords, rows } = await readSource(() => repository.list({ pageIndex, pageSize }));
      return {
        items: rows.map(summary), totalRecords, pageIndex, pageSize,
        totalPages: Math.ceil(totalRecords / pageSize),
      };
    },

    async getById(id) {
      const row = await readSource(() => repository.getById(id));
      if (!row) throw new AppError('Announcement not found.', 404);
      return { ...summary(row), contentHtml: decode(row.Noidung) };
    },
  };
}
