import { sqlTypes as sql } from "../../../infrastructure/database/typeorm-types.js";
import { connectDatabase } from "../../../database.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { parseSchoolSchedule } from "../domain/school-schedule.js";

const text = (value) => String(value ?? "").trim() || null;
const date = (value) =>
  value instanceof Date
    ? value.toISOString().slice(0, 10)
    : /^\d{4}-\d{2}-\d{2}/.test(String(value ?? ""))
      ? String(value).slice(0, 10)
      : null;
const week = (value) =>
  Number.isInteger(value) && value >= 1 && value <= 60 ? value : null;
export function examTime(value) {
  const match = /^(\d{1,2})(?::|h)(\d{2})?(?::\d{2})?$/.exec(
    String(value ?? "").trim(),
  );
  return match && Number(match[1]) < 24 && Number(match[2] ?? 0) < 60
    ? `${match[1].padStart(2, "0")}:${match[2] ?? "00"}`
    : null;
}

export function mapStudentSchedule(
  number,
  rows,
  changes = [],
  holidays = [],
  dated = [],
) {
  const terms = new Map();
  const classes = [],
    exams = [];
  for (const row of rows) {
    const termCode = text(row.IDCode) ?? "";
    const termName = text(row.TermName) ?? termCode;
    const published = row.TermRows === 1 && row.PubLichThi === 1;
    terms.set(termCode, {
      code: termCode,
      name: termName,
      startDate: date(row.TermStart),
      firstWeek: week(row.FirstWeek),
      examsPublished: published,
    });
    const identity = {
      id: String(row.ID),
      termCode,
      termName,
      courseCode: text(row.MaHP) ?? "",
      classCode: text(row.MalopHP) ?? "",
      name: text(row.CourseName),
    };
    classes.push({
      ...identity,
      meetings:
        row.ClassRows === 1
          ? [...parseSchoolSchedule(row.TKB), ...parseSchoolSchedule(row.TKB1)]
          : [],
      weeks: row.ClassRows === 1 ? text(row.TuanHoc) : null,
      excludedWeeks: row.ClassRows === 1 ? text(row.TuanCam) : null,
      startDate: row.ClassRows === 1 ? date(row.NgayDau) : null,
      endDate: row.ClassRows === 1 ? date(row.NgayCuoi) : null,
    });
    const shared = row.ThiChung === 1;
    const matched =
      row.ClassRows === 1 &&
      (shared ? row.CommonRows === 1 : row.SeparateRows === 1);
    const examDate =
      published && matched
        ? date(shared ? row.CommonDate : row.ExamDate)
        : null;
    exams.push({
      ...identity,
      group: text(row.Manhom),
      shared,
      date: examDate,
      time: examDate ? examTime(shared ? row.CommonTime : row.ExamTime) : null,
      room: examDate ? text(shared ? row.PersonalRoom : row.ExamRoom) : null,
      seatNumber:
        examDate && Number.isInteger(row.STTthi) && row.STTthi > 0
          ? row.STTthi
          : null,
      status: !published ? "unpublished" : examDate ? "scheduled" : "pending",
    });
  }
  const owned = new Set(classes.map((c) => `${c.termCode}/${c.classCode}`));
  const mappedChanges = changes
    .filter(
      (r) =>
        owned.has(`${text(r.IDCode)}/${text(r.MaLopHP)}`) &&
        !r.Huy &&
        !r.NgayHuy &&
        [1, 2].includes(r.Loai),
    )
    .map((r) => ({
      id: `change-${r.ID}`,
      termCode: text(r.IDCode),
      classCode: text(r.MaLopHP),
      date: date(r.NgayNB),
      kind: r.Loai === 1 ? "cancel" : "makeup",
      startPeriod: r.TietDau,
      endPeriod: r.TietCuoi,
      room: text(r.Phong),
    }))
    .filter(
      (r) =>
        r.date &&
        Number.isInteger(r.startPeriod) &&
        Number.isInteger(r.endPeriod) &&
        r.startPeriod >= 1 &&
        r.endPeriod >= r.startPeriod &&
        r.endPeriod <= 20,
    );
  for (const r of holidays) {
    if (!r.NgayLe || r.KoShow || r.LichThi || !date(r.Ngay)) continue;
    for (const c of classes.filter((c) => c.classCode === text(r.MalopHP))) {
      mappedChanges.push({
        id: `holiday-${r.Source ?? 'lecturer'}-${r.ID}-${c.id}`,
        termCode: c.termCode,
        classCode: c.classCode,
        date: date(r.Ngay),
        kind: "holiday",
        startPeriod: r.TietDau > 0 ? r.TietDau : null,
        endPeriod: r.TietCuoi > 0 ? r.TietCuoi : null,
        room: null,
      });
    }
  }
  const classCodes = new Set(classes.map((c) => c.classCode));
  const datedMeetings = dated
    .filter(
      (r) =>
        classCodes.has(text(r.MalopHP)) &&
        !r.KoShow &&
        !r.LichThi &&
        !r.NgayLe &&
        !text(r.MaNB) &&
        date(r.Ngay) &&
        Number.isInteger(r.TietDau) &&
        Number.isInteger(r.TietCuoi) &&
        r.TietDau >= 1 &&
        r.TietCuoi >= r.TietDau &&
        r.TietCuoi <= 20,
    )
    .map((r) => ({
      id: `dated-${r.ID}`,
      classCode: text(r.MalopHP),
      date: date(r.Ngay),
      startPeriod: r.TietDau,
      endPeriod: r.TietCuoi,
      room: text(r.Phong),
    }));
  return {
    studentNumber: number,
    terms: [...terms.values()],
    classes,
    exams,
    changes: mappedChanges,
    datedMeetings,
  };
}

/** Current lecturer data owns assigned exam sessions and leave/makeup records. */
export function createStudentScheduleReader({
  connect = connectDatabase,
} = {}) {
  return async (number, schoolId) => {
    const pool = await connect("secondary", "DATA_GVien1");
    const profile = await pool
      .request()
      .input("number", sql.NVarChar(30), number)
      .query(
        "SELECT TOP(2) MaHS,SoTheSV FROM dbo.tmHoSoSV WHERE SoTheSV=@number",
      );
    if (
      profile.recordset.length !== 1 ||
      text(profile.recordset[0].MaHS) !== schoolId ||
      text(profile.recordset[0].SoTheSV) !== number
    )
      throw new AppError(
        "Hồ sơ lịch học không khớp tài khoản đã xác thực.",
        409,
        { code: "STUDENT_PROFILE_MISMATCH" },
      );
    const read = (query) =>
      pool.request().input("id", sql.NVarChar(30), schoolId).query(query);
    const [classes, changes, holidays] = await Promise.all([
      read(`SELECT TOP(2001) d.ID,d.IDCode,d.MaHP,d.MalopHP,d.Manhom,l.ClassRows,l.ThiChung,h.CourseName,
          k.TermRows,k.TermName,k.TermStart,k.FirstWeek,k.PubLichThi,l.TKB,l.TKB1,l.TuanHoc,l.TuanCam,l.NgayDau,l.NgayCuoi,
          CASE WHEN k.PubLichThi=1 THEN d.PhongThi END AS PersonalRoom,CASE WHEN k.PubLichThi=1 THEN d.STTthi END AS STTthi,
          t.SeparateRows,t.ExamDate,t.ExamRoom,t.ExamTime,c.CommonRows,c.CommonDate,c.CommonTime
        FROM dbo.tmDiemkyhoc d
        OUTER APPLY(SELECT CASE WHEN COUNT(DISTINCT TenHP)=1 THEN MAX(TenHP) END AS CourseName FROM dbo.tmHocPhan WHERE MaHP=d.MaHP) h
        OUTER APPLY(SELECT COUNT(*) AS TermRows,CASE WHEN COUNT(*)=1 THEN MAX(TenKH) END AS TermName,
          CASE WHEN COUNT(*)=1 THEN MAX(NgayDau) END AS TermStart,CASE WHEN COUNT(*)=1 THEN MAX(Tuandau) END AS FirstWeek,
          CASE WHEN COUNT(*)=1 THEN MAX(PubLichThi) END AS PubLichThi,MAX(ID) AS TermId
          FROM dbo.tmKehoach WHERE IDCode=d.IDCode) k
        OUTER APPLY(SELECT COUNT(*) AS ClassRows,MAX(ThiChung) AS ThiChung,MAX(TKB) AS TKB,MAX(TKB1) AS TKB1,
          MAX(TuanHoc) AS TuanHoc,MAX(TuanCam) AS TuanCam,MAX(NgayDau) AS NgayDau,MAX(NgayCuoi) AS NgayCuoi FROM dbo.tmLopHP
          WHERE MalopHP=d.MalopHP AND (MaKH IS NULL OR LTRIM(RTRIM(MaKH))='' OR MaKH=d.IDCode OR MaKH=CONVERT(nvarchar(30),k.TermId))) l
        OUTER APPLY(SELECT COUNT(*) AS SeparateRows,MAX(NgayThi) AS ExamDate,MAX(PhongThi) AS ExamRoom,MAX(GioThi) AS ExamTime
          FROM dbo.tmThi WHERE MalopHP=d.MalopHP AND ISNULL(MaNhom,'')=ISNULL(d.Manhom,'') AND k.PubLichThi=1) t
        OUTER APPLY(SELECT COUNT(*) AS CommonRows,MAX(ct.Ngay) AS CommonDate,MAX(clock.GioThi) AS CommonTime
          FROM dbo.tmThiCaCT ct OUTER APPLY(SELECT CASE WHEN COUNT(*)=1 THEN MAX(GioThi) END AS GioThi FROM dbo.ThoiGianThi WHERE MaCT=ct.Xuat) clock
          WHERE ct.MaCa=d.MaCaThi AND k.PubLichThi=1 AND EXISTS(SELECT 1 FROM dbo.tmThiCaHP WHERE LopHP=d.MalopHP AND MaCaTong=ct.CaTong)) c
        WHERE d.MaHS=@id ORDER BY d.IDCode,d.MaHP,d.ID;`),
      read(`SELECT TOP(4001) n.ID,n.IDCode,n.MaLopHP,n.NgayNB,n.Loai,n.TietDau,n.TietCuoi,n.Phong,n.Huy,n.NgayHuy
        FROM dbo.tmNghiBu n WHERE ISNULL(n.Huy,0)=0 AND n.NgayHuy IS NULL AND n.Loai IN(1,2)
        AND EXISTS(SELECT 1 FROM dbo.tmDiemkyhoc d WHERE d.MaHS=@id AND d.MalopHP=n.MaLopHP AND d.IDCode=n.IDCode) ORDER BY n.NgayNB,n.ID;`),
      read(`SELECT TOP(4001) l.ID,l.MalopHP,l.Ngay,l.TietDau,l.TietCuoi,l.NgayLe FROM dbo.tmLichTrinh l WHERE l.NgayLe=1
        AND EXISTS(SELECT 1 FROM dbo.tmDiemkyhoc d WHERE d.MaHS=@id AND d.MalopHP=l.MalopHP) ORDER BY l.Ngay,l.ID;`),
    ]);
    if (
      classes.recordset.length > 2000 ||
      changes.recordset.length > 4000 ||
      holidays.recordset.length > 4000
    )
      throw new AppError("Lịch cá nhân vượt giới hạn đọc.", 502);
    const codes = [
      ...new Set(classes.recordset.map((r) => text(r.MalopHP)).filter(Boolean)),
    ];
    let dated = [];
    if (codes.length) {
      const calendar = await connect("primary");
      const request = calendar.request();
      const selectors = codes.map((code, index) => {
        request.input(`class${index}`, sql.NVarChar(50), code);
        return `@class${index}`;
      });
      const result =
        await request.query(`SELECT TOP(4001) ID,MalopHP,Ngay,TietDau,TietCuoi,Phong,KoShow,LichThi,NgayLe,MaNB
        FROM dbo.tmPhongHocHT WHERE MalopHP IN (${selectors.join(",")}) AND ISNULL(KoShow,0)=0 AND ISNULL(LichThi,0)=0
        AND ISNULL(MaNB,'')='' ORDER BY Ngay,ID;`);
      if (result.recordset.length > 4000)
        throw new AppError("Lịch theo ngày vượt giới hạn đọc.", 502);
      dated = result.recordset;
    }
    return mapStudentSchedule(
      number,
      classes.recordset,
      changes.recordset,
      [...holidays.recordset, ...dated.filter((r) => r.NgayLe === 1).map(r => ({ ...r, Source: 'room' }))],
      dated,
    );
  };
}
