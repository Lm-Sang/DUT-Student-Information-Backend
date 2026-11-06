import './env.js';

function integer(name, fallback, min, max) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isSafeInteger(value) || value < min || value > max) throw new Error(`Invalid ${name}.`);
  return value;
}

export const certificationConfig = Object.freeze({
  maxFileBytes: integer('CERTIFICATIONS_MAX_FILE_BYTES', 10485760, 1024, 20971520),
  maxFiles: integer('CERTIFICATIONS_MAX_FILES', 4, 1, 10),
  maxPixels: integer('CERTIFICATIONS_MAX_PIXELS', 40000000, 1000000, 80000000),
  minImageSide: integer('CERTIFICATIONS_MIN_IMAGE_SIDE', 600, 100, 2000),
  blurThreshold: integer('CERTIFICATIONS_BLUR_THRESHOLD', 0, 0, 100000),
  uploadTtlSeconds: integer('CERTIFICATIONS_UPLOAD_TTL_SECONDS', 300, 60, 900),
  downloadTtlSeconds: 120,
  r2: Object.freeze({
    privateConfirmed: process.env.CERTIFICATIONS_R2_PRIVATE_CONFIRMED === 'true',
    accountId: process.env.R2_ACCOUNT_ID || process.env.R2_AccountId || '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || process.env.R2_AccessKeyId || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || process.env.R2_SecretAccessKey || '',
    bucket: process.env.R2_BUCKET_NAME || process.env.R2_bucketName || '',
  }),
});
