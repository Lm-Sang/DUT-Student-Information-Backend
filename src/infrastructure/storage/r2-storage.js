import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import { AppError } from '../../shared/errors/app-error.js';

export function createR2Storage({ config, client, sign = getSignedUrl }) {
  let connection = client;
  function connect() {
    if (connection) return connection;
    if (
      !/^[a-f0-9]{32}$/i.test(config.accountId) ||
      !config.accessKeyId ||
      !config.secretAccessKey ||
      !config.bucket
    ) {
      throw new AppError('R2 chưa được cấu hình đầy đủ.', 503, { code: 'R2_NOT_CONFIGURED' });
    }
    connection = new S3Client({
      region: 'auto',
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
      // The browser supplies the bytes later. Do not sign a checksum of an empty body.
      requestChecksumCalculation: 'WHEN_REQUIRED',
      maxAttempts: 2,
    });
    return connection;
  }
  async function send(command) {
    try {
      return await connect().send(command, { abortSignal: AbortSignal.timeout(20000) });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Không thể xử lý file trên R2. Vui lòng thử lại.', 502, {
        code: 'R2_REQUEST_FAILED',
      });
    }
  }
  return Object.freeze({
    bucket: config.bucket,
    async presignUpload(key, contentType, ttl) {
      if (!config.privateConfirmed)
        throw new AppError(
          'Cần chuyển bucket R2 sang private và xác nhận cấu hình trước khi nộp minh chứng.',
          503,
          { code: 'R2_PRIVATE_REQUIRED' }
        );
      const url = await sign(
        connect(),
        new PutObjectCommand({ Bucket: config.bucket, Key: key, ContentType: contentType, IfNoneMatch: '*' }),
        { expiresIn: ttl, signableHeaders: new Set(['content-type', 'if-none-match']) }
      );
      return { url, method: 'PUT', headers: { 'Content-Type': contentType, 'If-None-Match': '*' } };
    },
    async head(key) {
      const result = await send(new HeadObjectCommand({ Bucket: config.bucket, Key: key }));
      return { sizeBytes: result.ContentLength, contentType: result.ContentType };
    },
    async read(key, limit) {
      const result = await send(new GetObjectCommand({ Bucket: config.bucket, Key: key }));
      const body = result.Body;
      const timer = setTimeout(() => body?.destroy?.(new Error('Read deadline exceeded')), 20000);
      timer.unref?.();
      try {
        if (!body || result.ContentLength > limit) throw new AppError('File vượt giới hạn dung lượng.', 422);
        const chunks = [];
        let size = 0;
        for await (const chunk of body) {
          size += chunk.length;
          if (size > limit) throw new AppError('File vượt giới hạn dung lượng.', 422);
          chunks.push(chunk);
        }
        return Buffer.concat(chunks, size);
      } catch (error) {
        if (error instanceof AppError) throw error;
        throw new AppError('Không thể đọc đầy đủ file từ R2.', 502, { code: 'R2_READ_FAILED' });
      } finally {
        clearTimeout(timer);
        body?.destroy?.();
      }
    },
    async download(key, ttl) {
      return sign(
        connect(),
        new GetObjectCommand({
          Bucket: config.bucket,
          Key: key,
          ResponseContentDisposition: 'inline',
          ResponseCacheControl: 'private, no-store',
        }),
        { expiresIn: ttl }
      );
    },
    async remove(key) {
      await send(new DeleteObjectCommand({ Bucket: config.bucket, Key: key }));
    },
  });
}
