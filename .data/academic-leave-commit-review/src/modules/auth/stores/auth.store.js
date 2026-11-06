import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { env } from '../../../config/env.js';

// SQLite keeps sessions across restarts and consumes state/codes atomically.
// Multiple processes on one host must use the same local database file.
export function createAuthStore({ filename = ':memory:', now = Date.now, maxEntries = 50000 } = {}) {
  let db;
  function database() {
    if (db) return db;
    if (filename !== ':memory:') mkdirSync(dirname(resolve(filename)), { recursive: true, mode: 0o700 });
    db = new DatabaseSync(filename);
    db.exec('PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');
    db.exec(`CREATE TABLE IF NOT EXISTS auth_entries (
      key TEXT PRIMARY KEY, expires_at INTEGER NOT NULL, payload TEXT NOT NULL
    ); CREATE INDEX IF NOT EXISTS auth_entries_expiry ON auth_entries(expires_at);
    CREATE TABLE IF NOT EXISTS auth_sessions (
      id TEXT PRIMARY KEY, channel TEXT NOT NULL, subject TEXT NOT NULL,
      expires_at INTEGER NOT NULL, revoked INTEGER NOT NULL DEFAULT 0, payload TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS auth_sessions_expiry ON auth_sessions(expires_at);
    CREATE TABLE IF NOT EXISTS auth_refresh_tokens (
      hash TEXT PRIMARY KEY, session_id TEXT NOT NULL REFERENCES auth_sessions(id) ON DELETE CASCADE,
      used INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS auth_refresh_session ON auth_refresh_tokens(session_id);
    CREATE TABLE IF NOT EXISTS auth_rate_limits (
      key TEXT PRIMARY KEY, expires_at INTEGER NOT NULL, count INTEGER NOT NULL
    );`);
    return db;
  }

  function transaction(operation) {
    const connection = database();
    connection.exec('BEGIN IMMEDIATE');
    try {
      const result = operation(connection);
      connection.exec('COMMIT');
      return result;
    } catch (error) { connection.exec('ROLLBACK'); throw error; }
  }

  function cleanup(connection) {
    connection.prepare('DELETE FROM auth_entries WHERE expires_at <= ?').run(now());
    connection.prepare('DELETE FROM auth_sessions WHERE expires_at <= ?').run(now());
    connection.prepare('DELETE FROM auth_rate_limits WHERE expires_at <= ?').run(now());
  }

  function capacity(connection, table) {
    // Table names are fixed internal constants, never user input.
    if (connection.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count >= maxEntries) {
      throw new Error('Auth store capacity reached');
    }
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
    createSession(session, refreshHash) {
      transaction(connection => {
        cleanup(connection);
        capacity(connection, 'auth_sessions');
        capacity(connection, 'auth_refresh_tokens');
        connection.prepare(`INSERT INTO auth_sessions(id, channel, subject, expires_at, payload) VALUES (?, ?, ?, ?, ?)`)
          .run(session.id, session.channel, session.subject, session.expiresAt, JSON.stringify(session));
        connection.prepare('INSERT INTO auth_refresh_tokens(hash, session_id) VALUES (?, ?)').run(refreshHash, session.id);
      });
    },
    getSession(id) {
      const row = database().prepare('SELECT payload FROM auth_sessions WHERE id = ? AND revoked = 0 AND expires_at > ?').get(id, now());
      return row ? JSON.parse(row.payload) : null;
    },
    rotateRefresh(hash, nextHash, channel, sessionId) {
      return transaction(connection => {
        const row = connection.prepare(`SELECT r.used, s.id, s.channel, s.expires_at, s.revoked, s.payload
          FROM auth_refresh_tokens r JOIN auth_sessions s ON s.id = r.session_id WHERE r.hash = ?`).get(hash);
        if (!row || row.id !== sessionId || row.channel !== channel || row.revoked || row.expires_at <= now()) return null;
        if (row.used) {
          connection.prepare("UPDATE auth_sessions SET revoked = 1, payload = '{}' WHERE id = ?").run(row.id);
          return null;
        }
        capacity(connection, 'auth_refresh_tokens');
        connection.prepare('UPDATE auth_refresh_tokens SET used = 1 WHERE hash = ?').run(hash);
        connection.prepare('INSERT INTO auth_refresh_tokens(hash, session_id) VALUES (?, ?)').run(nextHash, row.id);
        return JSON.parse(row.payload);
      });
    },
    revokeSession(id) {
      database().prepare("UPDATE auth_sessions SET revoked = 1, payload = '{}' WHERE id = ?").run(id);
    },
    rateLimit(key, limit, windowMs) {
      return transaction(connection => {
        cleanup(connection);
        const row = connection.prepare('SELECT count, expires_at FROM auth_rate_limits WHERE key = ?').get(key);
        if (!row) {
          capacity(connection, 'auth_rate_limits');
          connection.prepare('INSERT INTO auth_rate_limits(key, expires_at, count) VALUES (?, ?, 1)').run(key, now() + windowMs);
          return 0;
        }
        if (row.count >= limit) return Math.max(1, Math.ceil((row.expires_at - now()) / 1000));
        connection.prepare('UPDATE auth_rate_limits SET count = count + 1 WHERE key = ?').run(key);
        return 0;
      });
    },
    close() { db?.close(); db = undefined; },
  };
}

export const authStore = createAuthStore({ filename: env.auth.databasePath });
export const closeAuthStore = () => authStore.close();
