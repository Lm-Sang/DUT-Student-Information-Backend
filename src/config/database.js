import { readFileSync } from 'node:fs';
import { createServer } from 'node:net';

import sql from 'mssql';
import { Client as SshClient } from 'ssh2';

import { env } from './env.js';

const pools = new Map();
let tunnel;

function required(value, name) {
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function getAccount(accountName) {
  if (!['primary', 'secondary'].includes(accountName)) {
    throw new Error(`Unknown database account: ${accountName}`);
  }

  return env.database[accountName];
}

function createSshConfig() {
  const config = {
    host: required(env.ssh.host, 'SSH_HOST'),
    port: env.ssh.port,
    username: required(env.ssh.user, 'SSH_USER'),
    readyTimeout: 15_000,
  };

  if (env.ssh.privateKeyPath) {
    config.privateKey = readFileSync(env.ssh.privateKeyPath);
  } else {
    config.password = required(env.ssh.password, 'SSH_PASSWORD');
  }

  return config;
}

async function createSshTunnel() {
  const client = new SshClient();

  await new Promise((resolve, reject) => {
    client.once('ready', resolve);
    client.once('error', reject);
    client.connect(createSshConfig());
  });

  const server = createServer((socket) => {
    client.forwardOut(
      socket.remoteAddress ?? '127.0.0.1',
      socket.remotePort ?? 0,
      required(env.database.host, 'DB_HOST'),
      env.database.port,
      (error, stream) => {
        if (error) {
          socket.destroy(error);
          return;
        }

        socket.pipe(stream).pipe(socket);
      },
    );
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  const address = server.address();
  return {
    host: '127.0.0.1',
    port: address.port,
    close: async () => {
      await new Promise((resolve) => server.close(resolve));
      client.end();
    },
  };
}

async function getDatabaseEndpoint() {
  if (env.database.connectionMode === 'direct') {
    return { host: required(env.database.host, 'DB_HOST'), port: env.database.port };
  }

  if (env.database.connectionMode !== 'ssh') {
    throw new Error('DB_CONNECTION_MODE must be either "direct" or "ssh".');
  }

  required(env.database.host, 'DB_HOST');
  tunnel ??= await createSshTunnel();
  return tunnel;
}

export async function connectDatabase(accountName = 'primary', databaseName) {
  const account = getAccount(accountName);
  const selectedDatabase = databaseName ?? account.defaultDatabase;
  if (typeof selectedDatabase !== 'string') {
    throw new Error('databaseName must be a string.');
  }

  const poolKey = JSON.stringify([accountName, selectedDatabase]);
  if (pools.has(poolKey)) return pools.get(poolKey);

  const endpoint = await getDatabaseEndpoint();
  const config = {
    server: endpoint.host,
    port: endpoint.port,
    user: required(account.user, `DB_${accountName.toUpperCase()}_USER`),
    password: required(
      account.password,
      `DB_${accountName.toUpperCase()}_PASSWORD`,
    ),
    options: {
      encrypt: env.database.encrypt,
      trustServerCertificate: env.database.trustServerCertificate,
    },
    pool: { min: 0, max: 10, idleTimeoutMillis: 30_000 },
    connectionTimeout: 15_000,
    requestTimeout: 30_000,
  };

  if (selectedDatabase) config.database = selectedDatabase;

  const pool = await new sql.ConnectionPool(config).connect();
  pools.set(poolKey, pool);
  return pool;
}

export async function disconnectDatabases() {
  await Promise.all([...pools.values()].map((pool) => pool.close()));
  pools.clear();

  if (tunnel) {
    await tunnel.close();
    tunnel = undefined;
  }
}
