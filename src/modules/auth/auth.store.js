import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { env } from '../../config/env.js';

// SQLite keeps sessions across restarts and consumes state/codes atomically.
// Multiple processes on one host must use the same local database file.
export function createAuthStore({ filename = ':memory:', now = Date.now, maxEntries = 50000 } = {}) {
  let db;
  function database() {
    if (db) return db;
    if (filename !== ':memory:') mkdirSync(dirname(resolve(filename)), { recursive: true });
    db = new DatabaseSync(filename);
    db.exec('PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL;');
    db.exec(`CREATE TABLE IF NOT EXISTS auth_entries (
      key TEXT PRIMARY KEY, expires_at INTEGER NOT NULL, payload TEXT NOT NULL
    ); CREATE INDEX IF NOT EXISTS auth_entries_expiry ON auth_entries(expires_at);`);
    return db;
  }
  return {
    put(key, value, expiresAt) {
      const connection = database();
      connection.prepare('DELETE FROM auth_entries WHERE expires_at <= ?').run(now());
      if (connection.prepare('SELECT COUNT(*) AS count FROM auth_entries').get().count >= maxEntries) {
        throw new Error('Auth store capacity reached');
      }
      connection.prepare('INSERT INTO auth_entries(key, expires_at, payload) VALUES (?, ?, ?)')
        .run(key, expiresAt, JSON.stringify(value));
    },
    get(key) {
      const row = database().prepare('SELECT payload FROM auth_entries WHERE key = ? AND expires_at > ?').get(key, now());
      return row ? JSON.parse(row.payload) : null;
    },
    consume(key) {
      // DELETE RETURNING is one atomic statement, including concurrent workers.
      const row = database().prepare('DELETE FROM auth_entries WHERE key = ? RETURNING expires_at, payload').get(key);
      return row && row.expires_at > now() ? JSON.parse(row.payload) : null;
    },
    delete(key) { database().prepare('DELETE FROM auth_entries WHERE key = ?').run(key); },
    close() { db?.close(); db = undefined; },
  };
}

export const authStore = createAuthStore({ filename: env.auth.databasePath });
