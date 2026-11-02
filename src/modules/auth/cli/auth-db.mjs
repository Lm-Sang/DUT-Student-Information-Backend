import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { parseArgs } from 'node:util';
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { queryLocalDatabase, disconnectLocalDatabase } from '../../../infrastructure/database/index.js';
import { authRepository } from '../repositories/auth.repository.js';
import { hashPassword } from '../services/password.service.js';

async function passwordPrompt(prompt) {
  if (!process.stdin.isTTY) throw new Error('Run account creation in an interactive terminal. Passwords are never accepted as arguments.');
  process.stdout.write(prompt);
  const hiddenOutput = new Writable({ write(_chunk, _encoding, done) { done(); } });
  const input = createInterface({ input: process.stdin, output: hiddenOutput, terminal: true });
  try { return await input.question(''); }
  finally { input.close(); process.stdout.write('\n'); }
}

try {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: {
    username: { type: 'string' }, name: { type: 'string' }, channel: { type: 'string', default: 'admin' },
    roles: { type: 'string', default: '' }, permissions: { type: 'string', default: '' },
  } });
  if (positionals.length !== 1 || !['init', 'create'].includes(positionals[0])) {
    throw new Error('Usage: npm run auth:db:init | npm run auth:user:create -- --username NAME --name DISPLAY --channel admin --permissions permission:one,permission:two');
  }
  if (positionals[0] === 'init') {
    const sql = await readFile(new URL('../repositories/local-auth-schema.sql', import.meta.url), 'utf8');
    try { await queryLocalDatabase(sql); }
    catch { throw new Error('Cannot initialize the local auth schema. Check LOCAL_DB_* and the Windows account SQL permissions.'); }
    console.log('Local auth schema is ready. No accounts were created.');
  } else {
    const username = values.username?.toLowerCase(), displayName = values.name?.trim();
    if (!username || !/^[a-z0-9][a-z0-9._@-]{2,127}$/.test(username)
      || !displayName || displayName.length > 150 || !['student', 'admin'].includes(values.channel)) {
      throw new Error('A valid username, display name and channel (student/admin) are required.');
    }
    const list = value => [...new Set(value.split(',').map(item => item.trim()).filter(Boolean))];
    const roles = list(values.roles), permissions = list(values.permissions);
    if (roles.length > 16 || permissions.length > 32
      || ![...roles, ...permissions].every(value => /^[a-z][a-z0-9:-]{0,99}$/.test(value))) {
      throw new Error('Invalid role or permission names. Use explicit lowercase names separated by commas.');
    }
    const password = await passwordPrompt('Password (12–128 characters, hidden): ');
    if (password !== await passwordPrompt('Confirm password (hidden): ')) throw new Error('Passwords do not match.');
    const passwordHash = await hashPassword(password);
    await authRepository.createLocalAccount({ id: randomUUID(), username, displayName, channel: values.channel, passwordHash, roles, permissions });
    console.log('Local account created. No SSO capability was granted.');
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Local account operation failed.');
  process.exitCode = 1;
} finally { await disconnectLocalDatabase(); }
