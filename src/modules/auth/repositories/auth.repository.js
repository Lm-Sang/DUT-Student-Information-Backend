import { queryLocalDatabase } from '../../../infrastructure/database/index.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { createHash } from 'node:crypto';

const columns = `CONVERT(varchar(36), Id) AS id, Username AS username,
  DisplayName AS displayName, PasswordHash AS passwordHash, Channel AS channel,
  IsActive AS isActive, CONVERT(varchar(18), CAST([Version] AS binary(8)), 1) AS accountVersion`;
const list = rows => [...new Set(rows.map(r => r.value))].sort();
const version = row => createHash('sha256').update(JSON.stringify([row.accountVersion, row.passwordHash, row.roles, row.permissions, row.isActive, row.requestActorId, row.channel])).digest('hex');

export function createAuthRepository({ query = queryLocalDatabase } = {}) {
  async function find(condition, value) {
    try {
      const row = (await query(`SELECT TOP(1) ${columns} FROM auth.LocalAccounts WHERE ${condition}=?`, [value])).first?.[0];
      if (!row) return null;
      const [roles, permissions] = await Promise.all([
        query('SELECT RoleName AS value FROM auth.AccountRoles WHERE AccountId=? ORDER BY RoleName', [row.id]),
        query(`SELECT PermissionName AS value FROM auth.AccountPermissions WHERE AccountId=? UNION
          SELECT p.PermissionName FROM auth.RolePermissions p JOIN auth.AccountRoles r ON r.RoleName=p.RoleName WHERE r.AccountId=?`, [row.id,row.id]),
      ]);
      const account = { ...row, roles: list(roles.first), permissions: list(permissions.first), isActive: row.isActive === true || row.isActive === 1 };
      if (!['student','admin'].includes(account.channel) || !account.displayName?.trim()) throw new Error();
      return { ...account, version: version(account) };
    } catch { throw new AppError('Local account database is not ready', 503); }
  }
  async function findStaff(condition,value) {
    try {
      const row=(await query(`SELECT a.MaHS AS id,c.TenDangNhap AS username,a.Hoten AS displayName,c.MatKhauBam AS passwordHash,
        a.HieuLuc AS isActive,a.PhienBanQuyen AS accountVersion,a.MaHS AS requestActorId
        FROM svc_demo.DangNhapChuyenVien c JOIN svc_demo.TaiKhoan a ON a.MaHS=c.MaHS
        WHERE ${condition}=? AND a.VaiTro IN ('STAFF','ADMIN') AND a.NguonDanhTinh='LOCAL'`,[value])).first?.[0];
      if(!row)return null;
      const [roles,permissions]=await Promise.all([
        query(`SELECT r.MaRole AS value FROM svc_demo.TaiKhoanVaiTro u JOIN svc_demo.VaiTroRBAC r ON r.MaRole=u.MaRole WHERE u.MaHS=? AND r.HieuLuc=1 ORDER BY r.MaRole`,[row.id]),
        query('SELECT MaQuyen AS value FROM svc_demo.vQuyenHieuLuc WHERE MaHS=? ORDER BY MaQuyen',[row.id]),
      ]);
      const account={...row,channel:'staff',roles:list(roles.first),permissions:list(permissions.first),isActive:row.isActive===true||row.isActive===1};
      return {...account,version:version(account)};
    }catch{throw new AppError('Specialist account database is not ready',503);}
  }
  return Object.freeze({
    findLocalByUsername: username => find('Username', username),
    findLocalById: id => find('Id', id),
    findStaffByUsername: username=>findStaff('c.TenDangNhap',username),
    findStaffById: id=>findStaff('a.MaHS',id),
    async createLocalAccount({ id, username, displayName, passwordHash, channel, roles, permissions }) {
      if(channel!=='admin')throw new AppError('Student accounts use DUT SSO; only admin local accounts can be provisioned here',400);
      const params=[id,username,displayName,passwordHash,channel];
      let sql=`INSERT auth.LocalAccounts(Id,Username,DisplayName,PasswordHash,Channel) VALUES(?,?,?,?,?);`;
      for(const role of [...new Set(roles)]){sql+=`IF NOT EXISTS(SELECT 1 FROM auth.Roles WITH(UPDLOCK,HOLDLOCK) WHERE RoleName=?) INSERT auth.Roles(RoleName) VALUES(?);INSERT auth.AccountRoles(AccountId,RoleName) VALUES(?,?);`;params.push(role,role,id,role);}
      for(const permission of [...new Set(permissions)]){sql+=`IF NOT EXISTS(SELECT 1 FROM auth.Permissions WITH(UPDLOCK,HOLDLOCK) WHERE PermissionName=?) INSERT auth.Permissions(PermissionName) VALUES(?);INSERT auth.AccountPermissions(AccountId,PermissionName) VALUES(?,?);`;params.push(permission,permission,id,permission);}
      try{await query(`SET XACT_ABORT ON;BEGIN TRY BEGIN TRANSACTION;${sql}COMMIT TRANSACTION;END TRY BEGIN CATCH IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;THROW;END CATCH;`,params);}
      catch{throw new AppError('Unable to create local account; check database setup and username uniqueness',503);}
    },
  });
}
export const authRepository = createAuthRepository();
