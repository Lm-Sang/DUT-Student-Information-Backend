import { env } from '../../config/env.js';
import { AppError } from '../../shared/errors/app-error.js';

function upstreamError(message, statusCode, source, upstreamStatus) {
  return new AppError(message, statusCode, {
    source,
    ...(upstreamStatus === undefined ? {} : { upstreamStatus }),
  });
}

async function readJson(response, maxResponseBytes, source) {
  if (!response.headers.get('content-type')?.toLowerCase().includes('json')) {
    await response.body?.cancel();
    throw upstreamError('Upstream did not return JSON.', 502, source);
  }
  if (Number(response.headers.get('content-length')) > maxResponseBytes) {
    await response.body?.cancel();
    throw upstreamError('Upstream response is too large.', 502, source);
  }
  const reader = response.body?.getReader();
  if (!reader) throw upstreamError('Upstream returned an empty response.', 502, source);
  const chunks = [];
  let bytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxResponseBytes) throw upstreamError('Upstream response is too large.', 502, source);
      chunks.push(Buffer.from(value));
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw upstreamError('Upstream returned invalid JSON.', 502, source);
  }
}

export function createPublicApiClient({
  sources = env.publicApis.sources,
  timeoutMs = env.publicApis.timeoutMs,
  maxResponseBytes = env.publicApis.maxResponseBytes,
  fetchImpl = globalThis.fetch,
} = {}) {
  return Object.freeze({
    async get(source, path, query = {}) {
      const baseUrl = sources[source];
      if (!baseUrl) throw upstreamError('Upstream service is not configured.', 503, source);
      // Preserve an optional deployment prefix in the configured base URL.
      const url = new URL(path.replace(/^\//, ''), `${baseUrl.replace(/\/$/, '')}/`);
      for (const [name, value] of Object.entries(query)) url.searchParams.set(name, value);
      const signal = AbortSignal.timeout(timeoutMs);
      try {
        const response = await fetchImpl(url, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          redirect: 'manual',
          signal,
        });
        if (!response.ok) {
          await response.body?.cancel();
          const status = response.status;
          if (status === 404) throw upstreamError('Upstream resource was not found.', 404, source, status);
          if (status === 400) throw upstreamError('Upstream rejected the request.', 400, source, status);
          if (status === 429 || status >= 500) {
            throw upstreamError('Upstream service is temporarily unavailable.', 503, source, status);
          }
          throw upstreamError('Upstream endpoint is unavailable for public access.', 502, source, status);
        }
        return await readJson(response, maxResponseBytes, source);
      } catch (error) {
        if (error instanceof AppError) throw error;
        if (signal.aborted) throw upstreamError('Upstream request timed out.', 504, source);
        throw upstreamError('Unable to connect to the upstream service.', 503, source);
      }
    },
  });
}
