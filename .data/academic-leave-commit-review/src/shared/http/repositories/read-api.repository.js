// The repository owns upstream paths and transport calls. Validation and
// response mapping stay outside this layer, as with SQL repositories.
export function createReadApiRepository(client) {
  return Object.freeze({
    /**
     * @param {{ source: string, upstreamPath: string }} endpoint
     * @param {import('../dto/read-api.request.dto.js').ReadApiRequestDto} request
     */
    async get(endpoint, request) {
      const path = endpoint.upstreamPath.replace(/:([A-Za-z][A-Za-z0-9]*)/g, (_match, name) => {
        return encodeURIComponent(request.params[name]);
      });
      return client.get(endpoint.source, path, request.query);
    },
  });
}
