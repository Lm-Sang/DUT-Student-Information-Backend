// First-time local provisioning. Credentials arrive via stdin, never command arguments/files.
import { randomUUID } from 'node:crypto';
import { parseArgs } from 'node:util';
import { createOrganizationRepository, validateUsername, validatePassword, parseOrganizationAccount, hashPassword } from '../../src/common/auth/index.js';
import { createOrganizationService } from '../../src/admin/modules/organization/services/organization.service.js';
import { queryLocalDatabase, disconnectLocalDatabase } from '../../src/infrastructure/database/local-sql-server.js';
import { assertLocalDemoTarget } from '../../src/infrastructure/database/local-write-guard.js';

try {
  assertLocalDemoTarget();
  const { values } = parseArgs({ options: { 'adopt-existing-root': { type: 'boolean', default: false } } });
  let input = '';
  for await (const chunk of process.stdin) {
    input += chunk;
    if (Buffer.byteLength(input) > 65536) throw new Error('Bootstrap input is too large');
  }
  let payload;
  try { payload = JSON.parse(input); }
  catch { throw new Error('Invalid bootstrap JSON'); }
  const { root, departments } = payload;
  const username = validateUsername(root?.username);
  validatePassword(root.password, username);
  if (typeof root.displayName !== 'string' || !root.displayName.trim() || root.displayName.length > 150 || /[\u0000-\u001f]/.test(root.displayName)) throw new Error('Root displayName is required');
  if (!Array.isArray(departments) || departments.length > 20) throw new Error('Departments must be an array (maximum 20)');
  const names = [username.toLowerCase()];
  for (const department of departments) {
    const { specialists, ...admin } = department;
    if (admin.accessLevel !== 'department_admin') throw new Error('Expected department_admin');
    names.push(parseOrganizationAccount(admin).username.toLowerCase());
    if (!Array.isArray(specialists) || specialists.length > 100) throw new Error('Specialists must be an array (maximum 100)');
    for (const account of specialists) {
      if (account.accessLevel !== 'specialist' || account.fieldCode !== admin.fieldCode) throw new Error('Specialists must belong to their manager department');
      names.push(parseOrganizationAccount(account).username.toLowerCase());
    }
  }
  if (new Set(names).size !== names.length) throw new Error('Duplicate bootstrap usernames');
  // Preflight all conflicts before promoting the explicitly selected root account.
  for (const name of names) {
    const result = await queryLocalDatabase(`SELECT Username AS username FROM auth.LocalAccounts WHERE Username=?;`, [name]);
    if (result.first.length && !(name === username.toLowerCase() && values['adopt-existing-root']))
      throw new Error(`Username already exists: ${name}`);
  }
  const repository = createOrganizationRepository(), service = createOrganizationService(repository);
  const [createdRoot] = await repository.bootstrapSuperAdmin({ id: randomUUID(), username, displayName: root.displayName.trim(), passwordHash: await hashPassword(root.password), adoptExisting: values['adopt-existing-root'] });
  const rootActor = { authorizationStatus: 'active', organization: await repository.authorization(createdRoot.accountId) };
  console.log(JSON.stringify({ username, accessLevel: 'super_admin', taskIds: [] }));
  for (const department of departments) {
    const { specialists, ...data } = department;
    const manager = await service.saveAccount(rootActor, null, data);
    console.log(JSON.stringify({ username: manager.username, accessLevel: manager.accessLevel, fieldCode: manager.fieldCode, taskIds: manager.taskIds }));
    const actor = { authorizationStatus: 'active', organization: await repository.authorization(manager.accountId) };
    for (const data of specialists) {
      const account = await service.saveAccount(actor, null, data);
      console.log(JSON.stringify({ username: account.username, accessLevel: account.accessLevel, fieldCode: account.fieldCode, taskIds: account.taskIds }));
    }
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { await disconnectLocalDatabase(); }
