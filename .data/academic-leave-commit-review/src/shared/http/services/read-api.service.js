import { parseReadApiRequestDto } from '../dto/read-api.request.dto.js';
import { toReadApiResponseDto } from '../mappers/read-api.mapper.js';

export function createReadApiService(repository) {
  return Object.freeze({
    async get(endpoint, params, query) {
      const request = parseReadApiRequestDto(endpoint, params, query);
      return toReadApiResponseDto(await repository.get(endpoint, request), endpoint.source);
    },
  });
}
