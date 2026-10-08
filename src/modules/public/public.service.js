import { AppError } from '../../shared/errors/app-error.js';
import { validatePublicRequest } from './public.validation.js';

function unwrapResponse(payload, source) {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const successKey = ['success', 'Success', 'isSuccess', 'IsSuccess'].find((key) => Object.hasOwn(payload, key));
    if (successKey) {
      if (payload[successKey] !== true) {
        throw new AppError('Upstream reported an unsuccessful response.', 502, { source });
      }
      const dataKey = ['data', 'Data'].find((key) => Object.hasOwn(payload, key));
      if (!dataKey) throw new AppError('Upstream response is missing data.', 502, { source });
      return payload[dataKey];
    }
  }
  return payload;
}

export function createPublicService(client) {
  return Object.freeze({
    async get(endpoint, params, query) {
      const validated = validatePublicRequest(endpoint, params, query);
      const path = endpoint.upstreamPath.replace(/:([A-Za-z][A-Za-z0-9]*)/g, (_match, name) => {
        return encodeURIComponent(validated.params[name]);
      });
      return unwrapResponse(await client.get(endpoint.source, path, validated.query), endpoint.source);
    },
  });
}
