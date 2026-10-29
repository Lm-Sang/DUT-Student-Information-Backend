import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { AppError } from '../../../shared/errors/app-error.js';

const derive = promisify(scrypt);
const options = { N: 131072, r: 8, p: 1, maxmem: 192 * 1024 * 1024 };
const dummy = `scrypt$131072$8$1$${'00'.repeat(16)}$${'00'.repeat(64)}`;
let running = 0;

async function boundedDerive(password, salt) {
  if (running >= 2) throw new AppError('Authentication is busy; try again shortly', 429, { retryAfterSeconds: 2 });
  running++;
  try { return await derive(password, salt, 64, options); }
  finally { running--; }
}

export async function hashPassword(password) {
  if (typeof password !== 'string' || [...password].length < 12 || password.length > 128) {
    throw new AppError('Password must contain between 12 and 128 characters', 400);
  }
  const salt = randomBytes(16);
  const hash = await boundedDerive(password, salt);
  return `scrypt$131072$8$1$${salt.toString('hex')}$${hash.toString('hex')}`;
}

export async function verifyPassword(password, encoded) {
  const pattern = /^scrypt\$131072\$8\$1\$([a-f0-9]{32})\$([a-f0-9]{128})$/;
  const valid = typeof encoded === 'string' && pattern.test(encoded);
  const [, salt, expected] = pattern.exec(valid ? encoded : dummy);
  const actual = await boundedDerive(password, Buffer.from(salt, 'hex'));
  return timingSafeEqual(actual, Buffer.from(expected, 'hex')) && valid;
}
