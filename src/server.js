import { createApp } from './app.js';
import { env } from './config/env.js';

// Admin SSO is an optional module, loaded only when explicitly enabled.
const adminAuthModule = env.features.adminAuthEnabled
  ? (await import('./modules/auth/admin/index.js')).adminAuthModule
  : undefined;
const app = createApp({ adminAuthModule });

app.listen(env.port, () => {
  console.log(`${env.app.name} is running at ${env.app.url}`);
});
