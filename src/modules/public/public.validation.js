import { AppError } from '../../shared/errors/app-error.js';

const identifierPattern = /^[A-Za-z0-9._-]{1,80}$/;
const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function invalid(name, requirement) {
  throw new AppError(`${name} ${requirement}.`, 400);
}

function parseValue(name, value, rule) {
  if (value === undefined) {
    if (rule.default !== undefined) return String(rule.default);
    if (rule.required) invalid(name, 'is required');
    return undefined;
  }
  if (typeof value !== 'string') invalid(name, 'must be a single string value');
  value = value.trim();
  if (!value || value.length > (rule.maxLength ?? 200) || /[\u0000-\u001f\u007f]/.test(value)) {
    invalid(name, 'must be a non-empty value within the allowed length');
  }
  switch (rule.type) {
    case 'integer': {
      if (!/^\d+$/.test(value)) invalid(name, 'must be a positive integer');
      const number = Number(value);
      if (!Number.isSafeInteger(number) || number < (rule.min ?? 1) || number > (rule.max ?? 2147483647)) {
        invalid(name, 'is outside the allowed range');
      }
      if (rule.values && !rule.values.includes(number)) invalid(name, 'has an unsupported value');
      return String(number);
    }
    case 'boolean':
      if (!['true', 'false'].includes(value.toLowerCase())) invalid(name, 'must be true or false');
      return value.toLowerCase();
    case 'identifier':
      if (!identifierPattern.test(value) || ['.', '..'].includes(value)) invalid(name, 'is not a valid identifier');
      break;
    case 'guid':
      if (!guidPattern.test(value)) invalid(name, 'must be a UUID');
      break;
    case 'semester-code':
      if (!/^\d{4}$/.test(value)) invalid(name, 'must be a four-digit semester code');
      break;
    case 'text':
      break;
    default:
      throw new Error(`Unknown validation rule: ${rule.type}`);
  }
  return value;
}

export function validatePublicRequest(endpoint, params = {}, query = {}) {
  const queryRules = endpoint.query ?? {};
  for (const name of Object.keys(query)) {
    if (!Object.hasOwn(queryRules, name)) invalid(name, 'is not a supported query parameter');
  }
  const validatedParams = {};
  const validatedQuery = {};
  for (const [name, rule] of Object.entries(endpoint.params ?? {})) {
    validatedParams[name] = parseValue(name, params[name], { ...rule, required: true });
  }
  for (const [name, rule] of Object.entries(queryRules)) {
    const value = parseValue(name, query[name], rule);
    if (value !== undefined) validatedQuery[name] = value;
  }
  return { params: validatedParams, query: validatedQuery };
}
