import { queryLocalDatabase } from '../../../infrastructure/database/index.js';
import { AppError } from '../../../shared/errors/app-error.js';

const columns = `CONVERT(varchar(36), Id) AS id, Username AS username,
  DisplayName AS displayName, PasswordHash AS passwordHash, Channel AS channel,
  RolesJson AS rolesJson, PermissionsJson AS permissionsJson, IsActive AS isActive,
  CONVERT(varchar(18), CAST([Version] AS binary(8)), 1) AS accountVersion`;

function account(row) {
  if (!row) return null;
  try {
    const roles = JSON.parse(row.rolesJson), permissions = JSON.parse(row.permissionsJson);
    if (![roles, permissions].every(items => Array.isArray(items)
      && items.every(item => typeof item === 'string' && item.length > 0 && item.length <= 100))) throw new Error();
    if (typeof row.accountVersion !== 'string' || !/^0x[a-f0-9]{16}$/i.test(row.accountVersion)
      || typeof row.id !== 'string' || !/^[a-f0-9-]{36}$/i.test(row.id)
      || !['student', 'admin'].includes(row.channel)
      || typeof row.displayName !== 'string' || !row.displayName.trim() || row.displayName.length > 150) throw new Error();
    return { ...row, version: row.accountVersion, roles, permissions, isActive: row.isActive === true || row.isActive === 1 };
  } catch { throw new AppError('Invalid local account configuration', 503); }
}

export function createAuthRepository({ query = queryLocalDatabase } = {}) {
  async function find(condition, value) {
    try {
      const result = await query(`SELECT TOP(1) ${columns} FROM auth.LocalAccounts WHERE ${condition} = ?`, [value]);
      return account(result.first?.[0]);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Local account database is not ready', 503);
    }
  }
  return Object.freeze({
    findLocalByUsername: username => find('Username', username),
    findLocalById: id => find('Id', id),
    async createLocalAccount({ id, username, displayName, passwordHash, channel, roles, permissions }) {
      try {
        await query(`INSERT INTO auth.LocalAccounts
          (Id, Username, DisplayName, PasswordHash, Channel, RolesJson, PermissionsJson)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, username, displayName, passwordHash, channel, JSON.stringify(roles), JSON.stringify(permissions)]);
      } catch { throw new AppError('Unable to create local account; check database setup and username uniqueness', 503); }
    },
  });
}

export const authRepository = createAuthRepository();
