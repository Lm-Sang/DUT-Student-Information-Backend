import { asyncHandler } from '../../../shared/utils/async-handler.js';
import { sendSuccess } from '../../../shared/utils/response.js';
import { parseAnnouncementsListQuery, parseAnnouncementDetailRequest } from '../dto/announcements.request.dto.js';

export function createAnnouncementsController(service) {
  return {
    list: asyncHandler(async (req, res) => {
      const query = parseAnnouncementsListQuery(req.query);
      res.setHeader('Cache-Control', 'no-store');
      return sendSuccess(res, await service.list(query));
    }),

    getById: asyncHandler(async (req, res) => {
      const { id } = parseAnnouncementDetailRequest(req.params, req.query);
      res.setHeader('Cache-Control', 'no-store');
      return sendSuccess(res, await service.getById(id));
    }),
  };
}
