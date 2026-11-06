import { createHash, createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { parse } from 'dotenv';

const values = parse(readFileSync('.env'));
const accountId = values.R2_AccountId;
const accessKeyId = values.R2_AccessKeyId;
const secretAccessKey = values.R2_SecretAccessKey;
const bucket = values.R2_bucketName;
if (!/^[a-f0-9]{32}$/i.test(accountId ?? '') || !accessKeyId || !secretAccessKey ||
    !/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket ?? '')) {
  console.log(JSON.stringify({ configurationValid: false }));
  process.exit(1);
}

const host = `${accountId}.r2.cloudflarestorage.com`;
const path = `/${bucket}`;
const hash = (value) => createHash('sha256').update(value).digest('hex');
const hmac = (key, value) => createHmac('sha256', key).update(value).digest();

async function probe(operation, method, query = '') {
  const timestamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  const day = timestamp.slice(0, 8);
  const scope = `${day}/auto/s3/aws4_request`;
  const payloadHash = hash('');
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${timestamp}\n`;
  const canonicalRequest = [method, path, query, canonicalHeaders, signedHeaders, payloadHash].join('\n');
  const signingKey = hmac(hmac(hmac(hmac(`AWS4${secretAccessKey}`, day), 'auto'), 's3'), 'aws4_request');
  const signature = hmac(signingKey, `AWS4-HMAC-SHA256\n${timestamp}\n${scope}\n${hash(canonicalRequest)}`).toString('hex');
  try {
    const response = await fetch(`https://${host}${path}${query ? `?${query}` : ''}`, {
      method,
      headers: {
        'x-amz-date': timestamp,
        'x-amz-content-sha256': payloadHash,
        Authorization: `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
      },
      signal: AbortSignal.timeout(20000),
      redirect: 'error',
    });
    const body = method === 'HEAD' ? '' : await response.text();
    const errorCode = body.match(/<Code>([A-Za-z0-9]+)<\/Code>/)?.[1];
    const keyCount = body.match(/<KeyCount>(\d+)<\/KeyCount>/)?.[1];
    console.log(JSON.stringify({ operation, status: response.status, ok: response.ok,
      ...(errorCode ? { errorCode } : {}),
      ...(keyCount !== undefined ? { returnedObjectCount: Number(keyCount) } : {}) }));
    return response.ok;
  } catch (error) {
    console.log(JSON.stringify({ operation, ok: false, errorType: error.name,
      networkCode: error.cause?.code ?? error.code ?? null }));
    return false;
  }
}

const headOk = await probe('HeadBucket', 'HEAD');
const listOk = await probe('ListObjectsV2', 'GET', 'list-type=2&max-keys=1');
process.exitCode = headOk && listOk ? 0 : 1;
