import sql from 'mssql';

import { connectDatabase } from '../../config/database.js';
import { env } from '../../config/env.js';

const programSelect = `
  SELECT n.MaNganh, n.TenNganh, n.Kyhieu, n.TenCN, n.SoTinChi, n.Sotuchon,
         n.SoHK, n.CapDT, n.NgNguDT, n.BatDau, n.KetThuc,
         LEFT(n.MaNganh, 3) AS FacultyId, d.TenDV AS FacultyName
  FROM dbo.tmNganh n
  LEFT JOIN dbo.DonVi d ON d.MaDV = LEFT(n.MaNganh, 3)
`;

const trim = (value) => typeof value === 'string' ? value.trim() : value;
const missing = (value) => value == null || trim(value) === '';

// Bound batches stay below SQL Server's 2100-parameter limit. Only placeholder
// names are inserted into SQL; all user input and source codes are parameters.
async function selectByCodes(pool, statement, codes, extraInputs = {}) {
  const uniqueCodes = [...new Set(codes.filter((code) => !missing(code)).map(trim))];
  const rows = [];
  for (let offset = 0; offset < uniqueCodes.length; offset += 500) {
    const request = pool.request();
    for (const [name, value] of Object.entries(extraInputs)) {
      request.input(name, sql.NVarChar(20), value);
    }
    const parameters = uniqueCodes.slice(offset, offset + 500).map((code, index) => {
      request.input(`code${index}`, sql.NVarChar(20), code);
      return `@code${index}`;
    });
    const result = await request.query(statement.replace('/* codes */', parameters.join(', ')));
    rows.push(...result.recordset);
  }
  return rows;
}

export function createCurriculumRepository({
  connect = connectDatabase,
  database = env.curriculum,
} = {}) {
  // Initialize lazily and once per module, including simultaneous first requests.
  // Startup and unrelated APIs do not require SQL or SSH to be available.
  let connectionPromise;
  function getConnections() {
    connectionPromise ??= (async () => {
      const primary = await connect('primary', database.primaryDatabase);
      const secondary = await connect('secondary', database.metadataDatabase);
      return { primary, secondary };
    })().catch((error) => {
      connectionPromise = undefined;
      throw error;
    });
    return connectionPromise;
  }

  async function supplementPrograms(secondary, programs) {
    if (programs.length === 0) return [];
    const supplemental = await selectByCodes(secondary,
      'SELECT MaNganh, BatDau, KetThuc FROM dbo.tmNganh WHERE MaNganh IN (/* codes */);',
      programs.filter((row) => missing(row.BatDau) || missing(row.KetThuc)).map((row) => row.MaNganh));
    const dateLookup = new Map(supplemental.map((row) => [trim(row.MaNganh), row]));
    const majorLookup = new Map();
    const levels = [...new Set(programs.map((row) => trim(row.CapDT)))];
    for (const level of levels) {
      const majors = await selectByCodes(secondary, `
        SELECT MaNganhQG, TenNganhQG FROM dbo.tmNganhQG
        WHERE CapDT = @educationLevelCode AND MaNganhQG IN (/* codes */);`,
      programs.filter((row) => trim(row.CapDT) === level).map((row) => row.Kyhieu),
      { educationLevelCode: level });
      for (const major of majors) {
        majorLookup.set(`${level}:${trim(major.MaNganhQG)}`, major.TenNganhQG);
      }
    }
    return programs.map((row) => ({
      ...row,
      BatDau: row.BatDau ?? dateLookup.get(trim(row.MaNganh))?.BatDau ?? null,
      KetThuc: row.KetThuc ?? dateLookup.get(trim(row.MaNganh))?.KetThuc ?? null,
      MajorName: majorLookup.get(`${trim(row.CapDT)}:${trim(row.Kyhieu)}`) ?? null,
    }));
  }

  return {
    async listPrograms({ facultyId, educationLevelCode }) {
      const { primary, secondary } = await getConnections();
      const result = await primary.request()
        .input('facultyId', sql.NVarChar(3), facultyId)
        .input('educationLevelCode', sql.NVarChar(4), educationLevelCode)
        .query(`${programSelect}
          WHERE LEFT(n.MaNganh, 3) = @facultyId AND n.CapDT = @educationLevelCode
            AND n.PubWeb = 1 AND n.InUse = 1
          ORDER BY n.Kyhieu, n.TenNganh, n.MaNganh;`);
      return supplementPrograms(secondary, result.recordset);
    },

    async getCurriculum(programId) {
      const { primary, secondary } = await getConnections();
      // Separate result sets prevent multiplying curriculum rows by the number
      // of requirements. Every SELECT enforces the same public visibility rule.
      const result = await primary.request().input('programId', sql.NVarChar(7), programId).query(`
        ${programSelect}
        WHERE n.MaNganh = @programId AND n.PubWeb = 1 AND n.InUse = 1;

        SELECT ct.ID, ct.MaHP, ct.MaHPTT, ct.Hocky, ct.Kyhoc, ct.STT,
               ct.Tuchon, ct.HTDA, ct.TQDA, ct.DATN, ct.Note, ct.LoaiKT, ct.NhomKT,
               hp.TenHP, hp.KyHieu, hp.SoTC
        FROM dbo.tmKhungCT ct
        JOIN dbo.tmNganh n ON n.MaNganh = ct.MaKhung
        LEFT JOIN dbo.tmHocPhan hp ON hp.MaHP = ct.MaHP
        WHERE ct.MaKhung = @programId AND n.PubWeb = 1 AND n.InUse = 1
        ORDER BY ct.Hocky, ct.STT, ct.ID;

        SELECT dk.ID, dk.MaHP, dk.MaHPdk, dk.LoaiDK, dk.Hoac, dk.Ghichu,
               hp.TenHP AS RequiredCourseName
        FROM dbo.tmHocphanDK dk
        JOIN dbo.tmNganh n ON n.MaNganh = dk.MaKhung
        LEFT JOIN dbo.tmHocPhan hp ON hp.MaHP = dk.MaHPdk
        WHERE dk.MaKhung = @programId AND n.PubWeb = 1 AND n.InUse = 1
        ORDER BY dk.MaHP, dk.LoaiDK, dk.ID;
      `);
      const [programs, courses, requirements] = result.recordsets;
      if (programs.length === 0) return null;

      const codes = [
        ...courses.filter((row) => missing(row.TenHP) || missing(row.KyHieu) || row.SoTC == null)
          .map((row) => row.MaHP),
        ...requirements.filter((row) => missing(row.RequiredCourseName)).map((row) => row.MaHPdk),
      ];
      const supplementalCourses = await selectByCodes(secondary,
        'SELECT MaHP, TenHP, KyHieu, SoTC FROM dbo.tmHocPhan WHERE MaHP IN (/* codes */);', codes);
      const lookup = new Map(supplementalCourses.map((row) => [trim(row.MaHP), row]));
      const [program] = await supplementPrograms(secondary, programs);
      return {
        program,
        courses: courses.map((row) => {
          const metadata = lookup.get(trim(row.MaHP));
          return {
            ...row,
            TenHP: missing(row.TenHP) ? metadata?.TenHP ?? null : row.TenHP,
            KyHieu: missing(row.KyHieu) ? metadata?.KyHieu ?? row.KyHieu ?? null : row.KyHieu,
            SoTC: row.SoTC ?? metadata?.SoTC ?? null,
          };
        }),
        requirements: requirements.map((row) => ({
          ...row,
          RequiredCourseName: missing(row.RequiredCourseName)
            ? lookup.get(trim(row.MaHPdk))?.TenHP ?? null : row.RequiredCourseName,
        })),
      };
    },
  };
}
