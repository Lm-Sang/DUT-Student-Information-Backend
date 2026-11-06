import {
  queryLocalDatabase,
  transactionLocalDatabase,
  entitySchema,
} from "../../../database.js";
import { AppError } from "../../../shared/errors/app-error.js";
import { createHash } from "node:crypto";
import {
  assertLocalDemoTarget,
  localDatabaseGuardSql,
} from "../../../infrastructure/database/local-write-guard.js";
import {
  selectEntity,
  selectRows,
  selectOne,
} from "../../../infrastructure/database/typeorm-repository.js";

const columns = `CONVERT(varchar(36), Id) AS id, Username AS username,
  DisplayName AS displayName, PasswordHash AS passwordHash, Channel AS channel,
  IsActive AS isActive, CONVERT(varchar(18), CAST([Version] AS binary(8)), 1) AS accountVersion`;
const list = (rows) => [...new Set(rows.map((r) => r.value))].sort();
const version = (row) =>
  createHash("sha256")
    .update(
      JSON.stringify([
        row.accountVersion,
        row.passwordHash,
        row.roles,
        row.permissions,
        row.isActive,
        row.requestActorId,
        row.channel,
      ]),
    )
    .digest("hex");

export function createAuthRepository({
  query = queryLocalDatabase,
  transaction = query === queryLocalDatabase ? transactionLocalDatabase : query,
  guard = assertLocalDemoTarget,
} = {}) {
  async function find(condition, value) {
    try {
      const row = await selectOne(
        selectEntity("auth.LocalAccounts", "a")
          .select(columns)
          .where(`a.${condition}=:value`, { value }),
        query,
      );
      if (!row) return null;
      const [roles, direct, inherited] = await Promise.all([
        selectRows(
          selectEntity("auth.AccountRoles", "r")
            .select("r.RoleName", "value")
            .where("r.AccountId=:id", { id: row.id })
            .orderBy("r.RoleName"),
          query,
        ),
        selectRows(
          selectEntity("auth.AccountPermissions", "p")
            .select("p.PermissionName", "value")
            .where("p.AccountId=:id", { id: row.id }),
          query,
        ),
        selectRows(
          selectEntity("auth.RolePermissions", "p")
            .innerJoin(
              entitySchema("auth.AccountRoles"),
              "r",
              "r.RoleName=p.RoleName",
            )
            .select("p.PermissionName", "value")
            .where("r.AccountId=:id", { id: row.id }),
          query,
        ),
      ]);
      const account = {
        ...row,
        roles: list(roles),
        permissions: list([...direct, ...inherited]),
        isActive: row.isActive === true || row.isActive === 1,
      };
      if (
        !["student", "admin"].includes(account.channel) ||
        !account.displayName?.trim()
      )
        throw new Error();
      return { ...account, version: version(account) };
    } catch {
      throw new AppError("Local account database is not ready", 503);
    }
  }
  async function findStaff(condition, value) {
    try {
      const row = await selectOne(
        selectEntity("svc_demo.DangNhapChuyenVien", "c")
          .innerJoin(entitySchema("svc_demo.TaiKhoan"), "a", "a.MaHS=c.MaHS")
          .select([
            "a.MaHS AS id",
            "c.TenDangNhap AS username",
            "a.Hoten AS displayName",
            "c.MatKhauBam AS passwordHash",
            "a.HieuLuc AS isActive",
            "a.PhienBanQuyen AS accountVersion",
            "a.MaHS AS requestActorId",
          ])
          .where(`${condition}=:value`, { value })
          .andWhere(
            "a.VaiTro IN ('STAFF','ADMIN') AND a.NguonDanhTinh='LOCAL'",
          ),
        query,
      );
      if (!row) return null;
      const [roles, permissions] = await Promise.all([
        selectRows(
          selectEntity("svc_demo.TaiKhoanVaiTro", "u")
            .innerJoin(
              entitySchema("svc_demo.VaiTroRBAC"),
              "r",
              "r.MaRole=u.MaRole",
            )
            .select("r.MaRole", "value")
            .where("u.MaHS=:id", { id: row.id })
            .andWhere("r.HieuLuc=1")
            .orderBy("r.MaRole"),
          query,
        ),
        selectRows(
          selectEntity("svc_demo.vQuyenHieuLuc", "p")
            .select("p.MaQuyen", "value")
            .where("p.MaHS=:id", { id: row.id })
            .orderBy("p.MaQuyen"),
          query,
        ),
      ]);
      const account = {
        ...row,
        channel: "staff",
        roles: list(roles),
        permissions: list(permissions),
        isActive: row.isActive === true || row.isActive === 1,
      };
      return { ...account, version: version(account) };
    } catch {
      throw new AppError("Specialist account database is not ready", 503);
    }
  }
  return Object.freeze({
    findLocalByUsername: (username) => find("Username", username),
    findLocalById: (id) => find("Id", id),
    findStaffByUsername: (username) => findStaff("c.TenDangNhap", username),
    findStaffById: (id) => findStaff("a.MaHS", id),
    async updateStaffPassword({ actor, account, passwordHash, reset = false }) {
      guard();
      try {
        await transaction(
          `SET NOCOUNT ON;SET XACT_ABORT ON;${localDatabaseGuardSql}
          DECLARE @actor nvarchar(40)=?,@target nvarchar(40)=?;
          IF NOT EXISTS(SELECT 1 FROM svc_demo.TaiKhoan a WITH(UPDLOCK,HOLDLOCK)
            JOIN svc_demo.DangNhapChuyenVien c WITH(UPDLOCK,HOLDLOCK) ON c.MaHS=a.MaHS
            WHERE a.MaHS=@actor AND a.HieuLuc=1 AND a.NguonDanhTinh='LOCAL' AND a.VaiTro IN('STAFF','ADMIN')
              AND a.PhienBanQuyen=? AND c.MatKhauBam=?) THROW 51201,'PASSWORD_ACTOR_STALE',1;
          ${
            reset
              ? `IF @actor=@target OR NOT EXISTS(SELECT 1 FROM svc_demo.vQuyenHieuLuc WITH(UPDLOCK,HOLDLOCK)
            WHERE MaHS=@actor AND MaQuyen='rbac.staff.manage') THROW 51202,'PASSWORD_FORBIDDEN',1;`
              : "IF @actor<>@target THROW 51202,'PASSWORD_FORBIDDEN',1;"
          }
          UPDATE c SET MatKhauBam=? FROM svc_demo.DangNhapChuyenVien c
            JOIN svc_demo.TaiKhoan a WITH(UPDLOCK,HOLDLOCK) ON a.MaHS=c.MaHS
            WHERE c.MaHS=@target AND c.MatKhauBam=? AND a.HieuLuc=1
              AND a.NguonDanhTinh='LOCAL' AND a.VaiTro IN('STAFF','ADMIN');
          IF @@ROWCOUNT<>1 THROW 51203,'PASSWORD_TARGET_STALE',1;
          UPDATE svc_demo.TaiKhoan SET PhienBanQuyen=PhienBanQuyen+1 WHERE MaHS=@target;
          INSERT svc_demo.LichSuRBAC(MaNguoiThucHien,ThaoTac,MaTaiKhoan,MoTa)
            VALUES(@actor,?,@target,?);
          `,
          [
            actor.id,
            account.id,
            actor.accountVersion,
            actor.passwordHash,
            passwordHash,
            account.passwordHash,
            reset ? "RESET_PASSWORD" : "CHANGE_PASSWORD",
            reset
              ? "Quản trị viên đặt lại mật khẩu tài khoản."
              : "Chủ tài khoản tự đổi mật khẩu.",
          ],
        );
      } catch (error) {
        if (/PASSWORD_FORBIDDEN/.test(error.message))
          throw new AppError(
            "Bạn chưa có quyền đặt lại mật khẩu tài khoản này.",
            403,
          );
        if (/PASSWORD_ACTOR_STALE/.test(error.message))
          throw new AppError(
            "Tài khoản hoặc quyền của bạn vừa thay đổi. Vui lòng đăng nhập lại.",
            401,
          );
        if (/PASSWORD_TARGET_STALE/.test(error.message))
          throw new AppError(
            "Tài khoản đã thay đổi. Hãy tải lại trước khi đặt mật khẩu.",
            409,
          );
        throw new AppError(
          "Chưa cập nhật được mật khẩu trong DB local. Vui lòng thử lại.",
          503,
        );
      }
    },
    async createLocalAccount({
      id,
      username,
      displayName,
      passwordHash,
      channel,
      roles,
      permissions,
    }) {
      if (channel !== "admin")
        throw new AppError(
          "Student accounts use DUT SSO; only admin local accounts can be provisioned here",
          400,
        );
      const params = [id, username, displayName, passwordHash, channel];
      let sql = `INSERT auth.LocalAccounts(Id,Username,DisplayName,PasswordHash,Channel) VALUES(?,?,?,?,?);`;
      for (const role of [...new Set(roles)]) {
        sql += `IF NOT EXISTS(SELECT 1 FROM auth.Roles WITH(UPDLOCK,HOLDLOCK) WHERE RoleName=?) INSERT auth.Roles(RoleName) VALUES(?);INSERT auth.AccountRoles(AccountId,RoleName) VALUES(?,?);`;
        params.push(role, role, id, role);
      }
      for (const permission of [...new Set(permissions)]) {
        sql += `IF NOT EXISTS(SELECT 1 FROM auth.Permissions WITH(UPDLOCK,HOLDLOCK) WHERE PermissionName=?) INSERT auth.Permissions(PermissionName) VALUES(?);INSERT auth.AccountPermissions(AccountId,PermissionName) VALUES(?,?);`;
        params.push(permission, permission, id, permission);
      }
      try {
        await transaction(
          `SET XACT_ABORT ON;${localDatabaseGuardSql}${sql}`,
          params,
        );
      } catch {
        throw new AppError(
          "Unable to create local account; check database setup and username uniqueness",
          503,
        );
      }
    },
  });
}
export const authRepository = createAuthRepository();
