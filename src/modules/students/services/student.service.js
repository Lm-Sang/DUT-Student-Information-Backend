import { AppError } from "../../../shared/errors/app-error.js";
import { studentRepository } from "../repositories/student.repository.js";

const sourceTable = "DATA_SV1.dbo.NhanThan";
const citizenId = (value) =>
  typeof value === "string" && /^\d{12}$/.test(value.trim())
    ? value.trim()
    : null;

export function createStudentService({ repository = studentRepository } = {}) {
  return Object.freeze({
    // actor must come from trusted server-side authentication/profile context.
    async getIdentityForAuthenticatedStudent(actor) {
      if (
        actor?.role !== "student" ||
        typeof actor.studentCode !== "string" ||
        !/^\d{9}$/.test(actor.studentCode)
      )
        throw new AppError("Cần hồ sơ sinh viên đã xác thực để tra CCCD.", 403);
      let rows;
      try {
        rows = await repository.findIdentityRowsByStudentCode(
          actor.studentCode,
        );
      } catch {
        throw new AppError(
          "Chưa đọc được CCCD từ DB trường. Vui lòng thử lại.",
          503,
        );
      }
      if (!rows.length)
        return { status: "not_found", cccd: null, source: sourceTable };
      if (rows.length !== 1)
        return { status: "ambiguous", cccd: null, source: sourceTable };
      if (rows[0].studentCode?.trim() !== actor.studentCode)
        throw new AppError("Hồ sơ DB không khớp sinh viên đã xác thực.", 502);
      const primary = citizenId(rows[0].citizenId);
      if (primary)
        return {
          status: "found",
          cccd: primary,
          source: sourceTable + ".CCCD_So",
        };
      // Old cmnd can contain a 12-digit CCCD. Never label a 9-digit CMND as CCCD.
      const legacy = citizenId(rows[0].legacyIdentityNumber);
      if (legacy)
        return { status: "found", cccd: legacy, source: sourceTable + ".cmnd" };
      return { status: "missing", cccd: null, source: sourceTable };
    },
  });
}

export const studentService = createStudentService();
