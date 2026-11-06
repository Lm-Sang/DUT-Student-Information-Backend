import { AppError } from "../../../shared/errors/app-error.js";
import { validateFormSchema } from "../rules/certifications.rules.js";

export function invalid(message, field) {
  throw new AppError(message, 400, { code: "INVALID_INPUT", field });
}
export function evidenceContentType(value) {
  const normalized=typeof value==='string'?value.trim().toLowerCase():'';
  const contentType=normalized==='image/jpg'?'image/jpeg':normalized;
  if(!['image/jpeg','image/png'].includes(contentType))invalid('Chỉ nhận JPG, JPEG hoặc PNG.','contentType');
  return contentType;
}
export function object(value, allowed, name = "body") {
  if (!value || typeof value !== "object" || Array.isArray(value))
    invalid("Cần gửi một JSON object.", name);
  for (const key of Object.keys(value))
    if (!allowed.includes(key))
      invalid("Trường không được hỗ trợ: " + key, key);
  return value;
}
export function text(value, field, max, required = false) {
  if (value === null || value === undefined || value === "") {
    if (required) invalid("Thiếu " + field, field);
    return null;
  }
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.trim().length > max ||
    /[\u0000-\u001f\u007f]/.test(value)
  )
    invalid(field + " không hợp lệ.", field);
  return value.trim();
}
export function integer(value, field, min = 1, max = 2147483647) {
  if (!Number.isSafeInteger(value) || value < min || value > max)
    invalid(field + " không hợp lệ.", field);
  return value;
}
export function uuid(value, field = "id") {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  )
    invalid("ID không hợp lệ.", field);
  return value.toLowerCase();
}
export function rowVersion(value) {
  if (typeof value !== "string")
    throw new AppError("Cần header If-Match của bản ghi đang cập nhật.", 428);
  const match = /^(?:"([0-9a-f]{16})"|([0-9a-f]{16}))$/i.exec(value);
  if (!match) invalid("If-Match không hợp lệ.", "If-Match");
  return (match[1] ?? match[2]).toUpperCase();
}
function date(value, field = 'issuedOn') {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    value.slice(0, 4) === "0000" ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(value).toISOString().slice(0, 10) !== value
  )
    invalid("Ngày không hợp lệ.", field);
  return value;
}
function published(input) {
  if (input === undefined) return false;
  if (typeof input !== "boolean")
    invalid("isPublished phải là boolean.", "isPublished");
  return input;
}
export function parseLanguage(body) {
  const input = object(body, ["code", "displayName", "isPublished"]);
  const code = text(input.code, "code", 10, true);
  if (!/^[A-Za-z][A-Za-z0-9-]*$/.test(code))
    invalid("Mã ngôn ngữ không hợp lệ.", "code");
  return {
    code,
    displayName: text(input.displayName, "displayName", 100, true),
    isPublished: published(input.isPublished),
  };
}
export function parseType(body) {
  const input = object(body, [
    "code",
    "displayName",
    "languageId",
    "isPublished",
    "formSchema",
    "baseCertificateTypeId",
  ]);
  const code = text(input.code, "code", 50, true);
  if (!/^[\p{L}\p{N}][\p{L}\p{N} _.-]*$/u.test(code))
    invalid("Mã loại không hợp lệ.", "code");
  return {
    code,
    displayName: text(input.displayName, "displayName", 200) ?? "",
    languageId:
      input.languageId == null ? null : integer(input.languageId, "languageId"),
    isPublished: published(input.isPublished),
    baseCertificateTypeId:
      input.baseCertificateTypeId == null
        ? null
        : integer(input.baseCertificateTypeId, "baseCertificateTypeId"),
    formSchema: validateFormSchema(input.formSchema),
  };
}
export function parsePolicy(body) {
  const input = object(body, [
    "languageId",
    "certificateTypeId",
    "cohortFrom",
    "cohortTo",
    "isRecognized",
    "reason",
    "documentReference",
  ]);
  const languageId =
    input.languageId == null ? null : integer(input.languageId, "languageId");
  const certificateTypeId =
    input.certificateTypeId == null
      ? null
      : integer(input.certificateTypeId, "certificateTypeId");
  if ((languageId === null) === (certificateTypeId === null))
    invalid("Chọn một ngôn ngữ hoặc một loại chứng chỉ.", "languageId");
  const cohortFrom = integer(input.cohortFrom, "cohortFrom", 1900, 2199);
  const cohortTo =
    input.cohortTo == null
      ? null
      : integer(input.cohortTo, "cohortTo", cohortFrom, 2199);
  if (typeof input.isRecognized !== "boolean")
    invalid("isRecognized phải là boolean.", "isRecognized");
  return {
    languageId,
    certificateTypeId,
    cohortFrom,
    cohortTo,
    isRecognized: input.isRecognized,
    reason: text(input.reason, "reason", 2000, !input.isRecognized),
    documentReference: text(input.documentReference, "documentReference", 255),
  };
}
export function parsePreparation(body, config) {
  const input = object(body, ["applicationId", "data", "files"]);
  const data = object(
    input.data,
    [
      "fullName",
      "studentCode",
      "className",
      "certificateTypeId",
      "issuingOrganizationId",
      "result",
      "issuedOn",
      "notes",
    ],
    "data",
  );
  if (
    !data.result ||
    typeof data.result !== "object" ||
    Array.isArray(data.result)
  )
    invalid("Cần object result.", "result");
  const studentCode =
    data.studentCode === undefined
      ? null
      : text(data.studentCode, "studentCode", 9, true);
  if (studentCode !== null && !/^\d{9}$/.test(studentCode))
    invalid("MSSV phải có chín chữ số.", "studentCode");
  if (
    !Array.isArray(input.files) ||
    input.files.length !== 1
  )
    invalid("Mỗi hồ sơ ngoại ngữ phải có đúng một file minh chứng.", "files");
  return {
    applicationId:
      input.applicationId === undefined
        ? null
        : uuid(input.applicationId, "applicationId"),
    data: {
      fullName: text(data.fullName, "fullName", 150),
      studentCode,
      className: text(data.className, "className", 50),
      certificateTypeId: integer(data.certificateTypeId, "certificateTypeId"),
      issuingOrganizationId: integer(data.issuingOrganizationId, 'issuingOrganizationId'),
      result: data.result,
      issuedOn: date(data.issuedOn),
      notes: text(data.notes, "notes", 2000),
    },
    files: input.files.map((f) => {
      object(f, ["purpose", "fileName", "contentType", "sizeBytes"]);
      const purpose = f.purpose ?? "general";
      if (!["general", "lr", "sw", "combined"].includes(purpose))
        invalid("Vai trò ảnh không hợp lệ.", "purpose");
      const contentType=evidenceContentType(f.contentType);
      return {
        purpose,
        fileName: text(f.fileName, "fileName", 255, true),
        contentType,
        sizeBytes: integer(f.sizeBytes, "sizeBytes", 1, config.maxFileBytes),
      };
    }),
  };
}
export function parseIssuer(body) {
  const input = object(body, ['code', 'displayName', 'isActive', 'sourceUrl', 'verifiedOn', 'certificateTypeIds']);
  const code = text(input.code, 'code', 50, true);
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(code)) invalid('Mã cơ sở cấp không hợp lệ.', 'code');
  if (typeof input.isActive !== 'boolean') invalid('isActive phải là boolean.', 'isActive');
  const sourceUrl = text(input.sourceUrl, 'sourceUrl', 1000, true);
  try { const url = new URL(sourceUrl); if (url.protocol !== 'https:' || url.username || url.password) throw new Error(); }
  catch { invalid('Nguồn tham khảo phải là URL HTTPS.', 'sourceUrl'); }
  if (!Array.isArray(input.certificateTypeIds) || input.certificateTypeIds.length > 100
    || new Set(input.certificateTypeIds).size !== input.certificateTypeIds.length)
    invalid('Danh sách loại chứng chỉ liên kết không hợp lệ.', 'certificateTypeIds');
  const verifiedOn = date(input.verifiedOn, 'verifiedOn');
  return { code, displayName: text(input.displayName, 'displayName', 250, true), isActive: input.isActive,
    sourceUrl, verifiedOn, certificateTypeIds: input.certificateTypeIds.map(id => integer(id, 'certificateTypeIds')) };
}
export function parseReview(body) {
  const input = object(body, ["decision", "reason", "verificationMethod"]);
  if (!["processing", "verified", "needs_changes", "rejected"].includes(input.decision))
    invalid("Quyết định không hợp lệ.", "decision");
  if (
    (input.decision === 'verified' || input.verificationMethod != null) && !["document_comparison", "issuer_lookup", "other"].includes(
      input.verificationMethod,
    )
  )
    invalid("Cách xác minh không hợp lệ.", "verificationMethod");
  return {
    decision: input.decision,
    reason: text(input.reason, "reason", 2000, ['needs_changes','rejected'].includes(input.decision)),
    verificationMethod: input.verificationMethod ?? null,
  };
}
export function parseList(query, defaultStatus = null) {
  object(query, ["page", "pageSize", "status"]);
  const parsed = {};
  for (const [key, fallback, max] of [
    ["page", 1, 100000],
    ["pageSize", 20, 100],
  ]) {
    const raw = query[key] ?? String(fallback);
    if (typeof raw !== "string" || !/^[1-9]\d*$/.test(raw))
      invalid("Phân trang không hợp lệ.", key);
    parsed[key] = integer(Number(raw), key, 1, max);
  }
  parsed.status = query.status ?? defaultStatus;
  if (
    parsed.status !== null &&
    ![
      "uploading",
      "submitted",
      "processing",
      "needs_changes",
      "verified",
      "rejected",
    ].includes(parsed.status)
  )
    invalid("Trạng thái không hợp lệ.", "status");
  return parsed;
}
export function empty(body, query = {}) {
  object(body ?? {}, []);
  object(query, [], "query");
}
