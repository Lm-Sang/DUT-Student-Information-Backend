import { createApp } from './app.js';
import { env } from './config/env.js';
import { initializeDatabases, disconnectAllDatabases } from './infrastructure/database/index.js';

// Admin SSO is an optional module, loaded only when explicitly enabled.
const adminAuthModule = env.features.adminAuthEnabled
  ? (await import('./modules/auth/admin/index.js')).adminAuthModule
  : undefined;
const app = createApp({ adminAuthModule });

const server = app.listen(env.port, () => {
  console.log(`${env.app.name} is running at ${env.app.url}`);
});

const databaseStartup = initializeDatabases().then((results) => {
  for (const result of results) {
    if (result.connected) {
      const database = result.instance === 'local'
        ? env.localDatabase.name
        : env.database.primary.defaultDatabase || 'default';
      console.log(`[DB:${result.instance}] connected (${database})`);
    } else {
      console.error(`[DB:${result.instance}] connection failed: ${result.error?.message ?? result.error}`);
    }
  }
});

let shuttingDown = false;
async function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  const timeout = setTimeout(() => process.exit(1), 10000);
  timeout.unref();
  try {
    if (server.listening) await new Promise((resolve) => server.close(resolve));
    await databaseStartup;
    await disconnectAllDatabases();
    clearTimeout(timeout);
    process.exit(exitCode);
  } catch (error) {
    console.error(`Shutdown failed: ${error.message}`);
    process.exit(1);
  }
}

process.once('SIGINT', () => { void shutdown(); });
process.once('SIGTERM', () => { void shutdown(); });
server.once('error', (error) => {
  console.error(`HTTP server failed: ${error.message}`);
  void shutdown(1);
});
