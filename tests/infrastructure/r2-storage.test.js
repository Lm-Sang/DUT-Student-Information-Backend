import assert from 'node:assert/strict';
import test from 'node:test';
import { createR2Storage } from '../../src/infrastructure/storage/r2-storage.js';

test('R2 evidence URL signs content type and create-once condition without an empty-body checksum', async () => {
  const storage = createR2Storage({ config: {
    accountId: 'a'.repeat(32), accessKeyId: 'test-key', secretAccessKey: 'test-secret',
    bucket: 'test-bucket', privateConfirmed: true,
  }});
  const upload = await storage.presignUpload('certifications/evidence/test.png', 'image/png', 300);
  const url = new URL(upload.url);
  assert.equal(upload.method, 'PUT');
  assert.deepEqual(upload.headers, {'Content-Type': 'image/png', 'If-None-Match': '*'});
  assert.equal(url.searchParams.get('X-Amz-Expires'), '300');
  assert.equal(url.searchParams.get('X-Amz-SignedHeaders'), 'content-type;host;if-none-match');
  assert.ok(url.searchParams.has('X-Amz-Signature'));
  for (const name of url.searchParams.keys()) assert.doesNotMatch(name, /checksum/i);
});
