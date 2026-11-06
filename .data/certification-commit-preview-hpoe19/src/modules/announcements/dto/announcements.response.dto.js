/**
 * @typedef {Object} AnnouncementSummaryDto
 * @property {number} id
 * @property {string | null} code
 * @property {string | null} title
 * @property {Date | string | null} postedAt
 * @property {string | null} author
 * @property {string | null} category
 * @property {string | null} subcategory
 */

/** @typedef {AnnouncementSummaryDto & { contentHtml: string | null }} AnnouncementDetailDto */

/**
 * @param {{ items: AnnouncementSummaryDto[], totalRecords: number, pageIndex: number, pageSize: number, totalPages: number }} data
 * @returns {{ items: AnnouncementSummaryDto[], totalRecords: number, pageIndex: number, pageSize: number, totalPages: number }}
 */
export function createAnnouncementsPageDto({ items, totalRecords, pageIndex, pageSize, totalPages }) {
  return { items, totalRecords, pageIndex, pageSize, totalPages };
}
