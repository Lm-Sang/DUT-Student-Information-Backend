import 'dotenv/config';

function parsePort(name, value, fallback) {
  const port = Number(value ?? fallback);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`${name} must be an integer between 1 and 65535.`);
  }

  return port;
}

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === '') return fallback;
  return value.toLowerCase() === 'true';
}

function parseInteger(name, value, fallback, min, max) {
  const number = Number(value ?? fallback);
  if (!Number.isInteger(number) || number < min || number > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}.`);
  }
  return number;
}

function parseBaseUrl(name, value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be an absolute HTTP(S) URL.`);
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error(`${name} must be an HTTP(S) URL without credentials, query or fragment.`);
  }
  return url.href.replace(/\/$/, '');
}

function parseList(value) {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseOrigin(name, value) {
  let url;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be an absolute HTTP(S) origin.`);
  }

  if (!['http:', 'https:'].includes(url.protocol) || url.origin !== value) {
    throw new Error(`${name} must be an HTTP(S) origin without a path or trailing slash.`);
  }

  return url.origin;
}

const studentFrontendUrl = parseOrigin(
  'STUDENT_FRONTEND_URL',
  process.env.STUDENT_FRONTEND_URL ?? 'http://localhost:5173',
);
const adminFrontendUrl = parseOrigin(
  'ADMIN_FRONTEND_URL',
  process.env.ADMIN_FRONTEND_URL ?? 'http://localhost:5174',
);
const corsOrigins = Object.freeze(
  [...new Set([
    ...parseList(process.env.CORS_STUDENT_ORIGINS ?? studentFrontendUrl),
    ...parseList(process.env.CORS_ADMIN_ORIGINS ?? adminFrontendUrl),
  ])].map((origin, index) => parseOrigin(`CORS_ORIGINS[${index}]`, origin)),
);

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parsePort('PORT', process.env.PORT, 3003),
  app: Object.freeze({
    name: process.env.APP_NAME ?? 'DUT Student Information Backend',
    url: process.env.APP_URL ?? 'http://localhost:3003',
    studentFrontendUrl,
    adminFrontendUrl,
    corsOrigins,
  }),
  database: Object.freeze({
    connectionMode: process.env.DB_CONNECTION_MODE ?? 'ssh',
    host: process.env.DB_HOST ?? '',
    port: parsePort('DB_PORT', process.env.DB_PORT, 1433),
    encrypt: parseBoolean(process.env.DB_ENCRYPT, true),
    trustServerCertificate: parseBoolean(
      process.env.DB_TRUST_SERVER_CERTIFICATE,
      true,
    ),
    primary: Object.freeze({
      user: process.env.DB_PRIMARY_USER ?? '',
      password: process.env.DB_PRIMARY_PASSWORD ?? '',
      defaultDatabase: process.env.DB_PRIMARY_DEFAULT_DATABASE ?? '',
    }),
    secondary: Object.freeze({
      user: process.env.DB_SECONDARY_USER ?? '',
      password: process.env.DB_SECONDARY_PASSWORD ?? '',
      defaultDatabase: process.env.DB_SECONDARY_DEFAULT_DATABASE ?? '',
    }),
  }),
  ssh: Object.freeze({
    host: process.env.SSH_HOST ?? '',
    port: parsePort('SSH_PORT', process.env.SSH_PORT, 22),
    user: process.env.SSH_USER ?? '',
    password: process.env.SSH_PASSWORD ?? '',
    privateKeyPath: process.env.SSH_PRIVATE_KEY_PATH ?? '',
  }),
  jwt: Object.freeze({
    secret: process.env.JWT_SECRET ?? '',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
    issuer: process.env.JWT_ISSUER ?? 'dut-student-information-backend',
    studentAudience:
      process.env.JWT_STUDENT_AUDIENCE ?? 'dut-student-information-student',
    adminAudience:
      process.env.JWT_ADMIN_AUDIENCE ?? 'dut-student-information-admin',
  }),
  microsoftSso: Object.freeze({
    baseUrl:
      process.env.MICROSOFT_SSO_BASE_URL ?? 'https://sso.dev.dut.navia.io.vn',
    loginPath: process.env.MICROSOFT_SSO_LOGIN_PATH ?? '/microsoft/login',
    logoutPath: process.env.MICROSOFT_SSO_LOGOUT_PATH ?? '/microsoft/logout',
    mePath: process.env.MICROSOFT_SSO_ME_PATH ?? '/api/microsoft/me',
    studentCallbackUrl:
      process.env.MICROSOFT_SSO_STUDENT_CALLBACK_URL ??
      'http://localhost:3003/api/student/auth/microsoft/callback',
    adminCallbackUrl:
      process.env.MICROSOFT_SSO_ADMIN_CALLBACK_URL ??
      'http://localhost:3003/api/admin/auth/microsoft/callback',
    jwtSecret: process.env.MICROSOFT_SSO_JWT_SECRET ?? '',
  }),
  curriculum: Object.freeze({
    primaryDatabase: process.env.CURRICULUM_PRIMARY_DATABASE || 'DHBK_CDS',
    metadataDatabase: process.env.CURRICULUM_METADATA_DATABASE || 'DATA_GVien1',
  }),
  publicApis: Object.freeze({
    sources: Object.freeze({
      'course-registration': parseBaseUrl(
        'COURSE_REGISTRATION_API_BASE_URL',
        process.env.COURSE_REGISTRATION_API_BASE_URL ?? 'https://dangkytinchi.dut.udn.vn',
      ),
      tkb: parseBaseUrl(
        'TKB_API_BASE_URL',
        process.env.TKB_API_BASE_URL ?? 'https://timetable.dut.udn.vn',
      ),
    }),
    timeoutMs: parseInteger('PUBLIC_API_TIMEOUT_MS', process.env.PUBLIC_API_TIMEOUT_MS, 8000, 100, 60000),
    maxResponseBytes: parseInteger(
      'PUBLIC_API_MAX_RESPONSE_BYTES', process.env.PUBLIC_API_MAX_RESPONSE_BYTES, 5242880, 1024, 20971520,
    ),
  }),
});
