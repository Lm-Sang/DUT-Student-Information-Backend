import { AppError } from '../../../shared/errors/app-error.js';

function fail(message, field, status = 422) {
  throw new AppError(message, status, { code: 'INVALID_CERTIFICATE', field });
}
function plain(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
export function validateFormSchema(schema) {
  if (!plain(schema) || Object.keys(schema).some(k => k !== 'fields') ||
      !Array.isArray(schema.fields) || !schema.fields.length || schema.fields.length > 20)
    fail('Form cần từ 1 đến 20 trường kết quả.', 'formSchema', 400);
  const keys = new Set();
  const fields = schema.fields.map(field => {
    if (!plain(field) || Object.keys(field).some(k => !['key','label','type','required','min','max','step','options','optionsFrom'].includes(k)))
      fail('Cấu hình trường không hợp lệ.', 'formSchema', 400);
    if (typeof field.key !== 'string' || !/^[a-z][a-zA-Z0-9_]{0,39}$/.test(field.key) ||
        ['constructor','prototype'].includes(field.key) || keys.has(field.key))
      fail('Mã trường không hợp lệ hoặc bị trùng.', 'formSchema', 400);
    keys.add(field.key);
    if (typeof field.label !== 'string' || !field.label.trim() || field.label.length > 100 ||
        /[\u0000-\u001f]/.test(field.label) || typeof field.required !== 'boolean')
      fail('Cần nhãn và cờ bắt buộc cho từng trường.', field.key, 400);
    const result = { key: field.key, label: field.label.trim(), type: field.type, required: field.required };
    if (field.type === 'number') {
      if ('options' in field || 'optionsFrom' in field || ![field.min,field.max,field.step].every(n => typeof n === 'number' && Number.isFinite(n) &&
          Math.abs(n * 100 - Math.round(n * 100)) < 1e-7) ||
          field.min < 0 || field.max > 9999999.99 || field.max < field.min || field.step <= 0)
        fail('Trường điểm cần min, max và step hợp lệ.', field.key, 400);
      return { ...result, min: field.min, max: field.max, step: field.step };
    }
    if (field.type === 'select') {
      if ('optionsFrom' in field) {
        if (field.optionsFrom !== 'certificateLevels' || ['options','min','max','step'].some(k => k in field))
          fail('Nguồn danh sách bậc không hợp lệ.',field.key,400);
        return {...result,optionsFrom:'certificateLevels'};
      }
      const valueOf = option => typeof option === 'string' ? option : option?.value;
      const validOption = option => {
        if (typeof option === 'string') return Boolean(option.trim()) && option.length <= 100 && !/[\u0000-\u001f]/.test(option);
        return plain(option) && Object.keys(option).every(k => ['value','label'].includes(k)) &&
          typeof option.value === 'string' && Boolean(option.value.trim()) && option.value.length <= 100 &&
          typeof option.label === 'string' && Boolean(option.label.trim()) && option.label.length <= 200 &&
          !/[\u0000-\u001f]/.test(option.value+option.label);
      };
      if (['min','max','step'].some(k => k in field) || !Array.isArray(field.options) ||
          !field.options.length || field.options.length > 100 || new Set(field.options.map(valueOf)).size !== field.options.length ||
          field.options.some(option => !validOption(option)))
        fail('Trường lựa chọn cần danh sách giá trị hợp lệ.', field.key, 400);
      return { ...result, options: field.options.map(option => typeof option === 'string' ? option : {...option}) };
    }
    fail('Chỉ hỗ trợ trường number hoặc select.', field.key, 400);
  });
  return { fields };
}
export function resolveFormSchema(schema, levels = []) {
  return {fields:schema.fields.map(field => {
    if (field.optionsFrom !== 'certificateLevels') return structuredClone(field);
    const {optionsFrom,...resolved} = field;
    return {...resolved,options:levels.filter(level => level.Code != null && level.DisplayName != null)
      .map(level => ({value:level.Code,label:level.DisplayName}))};
  })};
}
export function validateResult(value, schema) {
  if (!plain(value)) fail('Kết quả phải là một object.', 'result');
  const fields = new Map(schema.fields.map(f => [f.key,f]));
  for (const key of Object.keys(value)) if (!fields.has(key)) fail('Trường kết quả không được cấu hình.', key);
  const result = {};
  for (const field of fields.values()) {
    const input = value[field.key];
    if (input === undefined || input === null || input === '') {
      if (field.required) fail('Thiếu trường kết quả bắt buộc.', field.key);
      continue;
    }
    if (field.type === 'select') {
      if (!field.options.some(option => (typeof option === 'string' ? option : option.value) === input))
        fail('Giá trị không thuộc danh sách lựa chọn.', field.key);
    } else {
      const scaled = Math.round((input - field.min) * 100), step = Math.round(field.step * 100);
      if (typeof input !== 'number' || !Number.isFinite(input) || input < field.min || input > field.max ||
          Math.abs(input * 100 - Math.round(input * 100)) > 1e-7 || scaled % step !== 0)
        fail('Điểm nằm ngoài thang hoặc sai bước điểm.', field.key);
    }
    result[field.key] = input;
  }
  return result;
}
export function recognition(type, language, policies, cohortYear) {
  const deny = reason => ({ eligible: false, reason, policies: [] });
  if (!language?.IsPublished || !type.IsPublished) return deny('Loại chứng chỉ chưa được xuất bản.');
  const matches = p => cohortYear >= p.CohortFrom && (p.CohortTo == null || cohortYear <= p.CohortTo);
  const languagePolicy = policies.find(p => p.LanguageId === language.Id && matches(p));
  if (!languagePolicy || !languagePolicy.IsRecognized) return deny(languagePolicy?.Reason || 'Ngôn ngữ chưa được công nhận cho khóa này.');
  const typePolicies = policies.filter(p => p.CertificateTypeId === type.Id);
  const typePolicy = typePolicies.find(matches);
  if (typePolicies.length && (!typePolicy || !typePolicy.IsRecognized))
    return deny(typePolicy?.Reason || 'Loại chứng chỉ không được công nhận cho khóa này.');
  return { eligible: true, reason: null, policies: [languagePolicy, ...(typePolicy ? [typePolicy] : [])] };
}
export function canEdit(status) {
  return ['uploading','needs_changes'].includes(status);
}
