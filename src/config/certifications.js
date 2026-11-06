import "./env.js";

function integer(name, fallback, min, max) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isSafeInteger(value) || value < min || value > max)
    throw new Error(`Invalid ${name}.`);
  return value;
}

export const certificationConfig = Object.freeze({
  maxFileBytes: integer(
    "CERTIFICATIONS_MAX_FILE_BYTES",
    10485760,
    1024,
    20971520,
  ),
  // IT upload limit. Foreign-language certificates always accept exactly one file.
  maxFiles: integer("CERTIFICATIONS_MAX_FILES", 4, 1, 10),
  maxPixels: integer("CERTIFICATIONS_MAX_PIXELS", 40000000, 1000000, 80000000),
  minImageSide: integer("CERTIFICATIONS_MIN_IMAGE_SIDE", 600, 100, 2000),
  blurThreshold: integer("CERTIFICATIONS_BLUR_THRESHOLD", 0, 0, 100000),
  uploadTtlSeconds: integer("CERTIFICATIONS_UPLOAD_TTL_SECONDS", 300, 60, 900),
  downloadTtlSeconds: 120,
  imageInspection: Object.freeze({
    concurrency: integer("CERTIFICATIONS_IMAGE_CONCURRENCY", 2, 1, 8),
    maxQueued: integer("CERTIFICATIONS_IMAGE_MAX_QUEUED", 150, 0, 1000),
    waitTimeoutMs: integer(
      "CERTIFICATIONS_IMAGE_QUEUE_TIMEOUT_MS",
      20000,
      1000,
      60000,
    ),
  }),
  events: Object.freeze({
    maxConnections: integer(
      "CERTIFICATIONS_SSE_MAX_CONNECTIONS",
      1000,
      1,
      100000,
    ),
    maxPerActor: integer("CERTIFICATIONS_SSE_MAX_PER_ACTOR", 2, 1, 10),
    heartbeatMs: integer("CERTIFICATIONS_SSE_HEARTBEAT_MS", 25000, 1000, 60000),
    lifetimeMs: integer(
      "CERTIFICATIONS_SSE_LIFETIME_MS",
      300000,
      10000,
      600000,
    ),
  }),
  r2: Object.freeze({
    privateConfirmed:
      process.env.CERTIFICATIONS_R2_PRIVATE_CONFIRMED === "true",
    accountId: process.env.R2_ACCOUNT_ID || process.env.R2_AccountId || "",
    accessKeyId:
      process.env.R2_ACCESS_KEY_ID || process.env.R2_AccessKeyId || "",
    secretAccessKey:
      process.env.R2_SECRET_ACCESS_KEY || process.env.R2_SecretAccessKey || "",
    bucket: process.env.R2_BUCKET_NAME || process.env.R2_bucketName || "",
  }),
});
