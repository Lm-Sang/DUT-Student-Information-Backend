import { AppError } from '../../errors/app-error.js';

/** @returns {import('../dto/read-api.response.dto.js').ReadApiResponseDto} */
export function toReadApiResponseDto(payload, source) {
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
