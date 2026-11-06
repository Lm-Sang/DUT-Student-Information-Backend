import { AppError } from '../../../shared/errors/app-error.js';
import { createAnnouncementsPageDto } from '../dto/announcements.response.dto.js';
import { toAnnouncementSummaryDto, toAnnouncementDetailDto } from '../mappers/announcements.mapper.js';

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
      return createAnnouncementsPageDto({
        items: rows.map(toAnnouncementSummaryDto), totalRecords, pageIndex, pageSize,
        totalPages: Math.ceil(totalRecords / pageSize),
      });
    },

    async getById(id) {
      const row = await readSource(() => repository.getById(id));
      if (!row) throw new AppError('Announcement not found.', 404);
      return toAnnouncementDetailDto(row);
    },
  };
}
