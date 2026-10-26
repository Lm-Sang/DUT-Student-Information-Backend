import { randomUUID } from "node:crypto";
import { AppError } from "../../../shared/errors/app-error.js";
import { inspectEvidenceFiles } from "./evidence-inspection.service.js";
import { notifyCertificateChanged } from "../events/certification-events.js";
import {
  validateResult,
  recognition,
  canEdit,
  resolveFormSchema,
} from "../domain/certifications.rules.js";
import {
  applicationDto,
  languageDto,
  typeDto,
  policyDto,
  listDto,
} from "../mappers/certifications.mapper.js";

export function createCertificationsService({
  repository,
  storage,
  inspectImage,
  config,
  clock = () => new Date(),
  events,
  inspectionQueue,
}) {
  function role(actor, expected) {
    if (actor?.role !== expected)
      throw new AppError("Không có quyền thao tác.", 403);
  }
  function manager(actor) {
    if (
      !Array.isArray(actor?.permissions) ||
      !actor.permissions.includes("certifications:catalog:manage")
    )
      throw new AppError("Cần quyền quản lý danh mục.", 403);
  }
  function profile(actor) {
    role(actor, "student");
    if (
      !/^\d{9}$/.test(actor.studentCode ?? "") ||
      !Number.isInteger(actor.cohortYear) ||
      actor.cohortYear < 1900 ||
      actor.cohortYear > 2199
    )
      throw new AppError(
        "Thiếu MSSV hoặc khóa từ hồ sơ sinh viên đáng tin cậy.",
        403,
      );
  }
  async function load(actor, applicationId) {
    const application = await repository.get(applicationId);
    if (!application) throw new AppError("Không tìm thấy hồ sơ.", 404);
    if (
      actor.role === "student" &&
      (application.ActorReference !== actor.reference ||
        application.ActorSource !== actor.source)
    )
      throw new AppError("Không được truy cập hồ sơ này.", 403);
    return application;
  }
  function lookup(catalog, typeId, cohortYear) {
    const type = catalog.types.find((t) => t.Id === typeId);
    if (!type) throw new AppError("Không tìm thấy loại chứng chỉ.", 422);
    const language = catalog.languages.find((l) => l.Id === type.LanguageId);
    const allowed = recognition(type, language, catalog.policies, cohortYear);
    if (!allowed.eligible)
      throw new AppError(allowed.reason, 422, {
        code: "CERT_NOT_RECOGNIZED",
        cohortYear,
      });
    return { type, language, policies: allowed.policies };
  }
  function policySnapshot(policy) {
    return {
      id: policy.Id,
      revision: policy.Revision,
      cohortFrom: policy.CohortFrom,
      cohortTo: policy.CohortTo ?? null,
      isRecognized: Boolean(policy.IsRecognized),
      reason: policy.Reason ?? null,
      documentReference: policy.DocumentReference ?? null,
    };
  }
  function snapshot(details) {
    return {
      type: {
        id: details.type.Id,
        code: details.type.Code,
        displayName: details.type.DisplayName,
        revision: details.type.Revision,
        formSchema: resolveFormSchema(
          details.type.FormSchema,
          details.type.Levels,
        ),
      },
      language: {
        id: details.language.Id,
        code: details.language.Code,
        displayName: details.language.DisplayName,
      },
      policies: details.policies.map(policySnapshot),
    };
  }
  return Object.freeze({
    async catalog(actor) {
      profile(actor);
      const catalog = await repository.catalog();
      return {
        cohortYear: actor.cohortYear,
        maxFiles: 1,
        maxFileBytes: config.maxFileBytes,
        imageValidation: {
          maxPixels: config.maxPixels,
          minImageSide: config.minImageSide,
          blurThreshold: config.blurThreshold,
        },
        student: {
          studentCode: actor.studentCode,
          cohortYear: actor.cohortYear,
          fullName: actor.name ?? "",
          className: actor.className ?? "",
          source: actor.source,
        },
        languages: catalog.languages
          .filter((l) => l.IsPublished)
          .map((language) => ({
            ...languageDto(language),
            types: catalog.types
              .filter((t) => t.LanguageId === language.Id && t.IsPublished)
              .map((type) => {
                const allowed = recognition(
                  type,
                  language,
                  catalog.policies,
                  actor.cohortYear,
                );
                return {
                  ...typeDto(type),
                  eligible: allowed.eligible,
                  eligibilityMessage: allowed.reason,
                };
              }),
          })),
      };
    },
    async managementCatalog(actor) {
      manager(actor);
      const catalog = await repository.catalog();
      return {
        languages: catalog.languages.map(languageDto),
        types: catalog.types.map(typeDto),
        policies: catalog.policies.map(policyDto),
      };
    },
    async saveCatalog(actor, kind, data, id = null, expected = null) {
      manager(actor);
      const catalog = await repository.catalog();
      const existing = id ? catalog[kind].find((row) => row.Id === id) : null;
      if (existing?.IsSchoolProvided) {
        if (
          data.code !== existing.Code ||
          (kind === "types" &&
            (data.displayName !== existing.DisplayName ||
              data.languageId !== (existing.LanguageId ?? null) ||
              (data.baseCertificateTypeId ?? null) !==
                (existing.BaseCertificateTypeId ?? null)))
        )
          throw new AppError(
            "Mã và tên danh mục của trường phải giữ nguyên; chỉ chỉnh cấu hình sử dụng.",
            409,
            { code: "CERT_SCHOOL_IDENTITY_LOCKED" },
          );
        if (kind === "types") {
          const levels = (existing.Levels ?? []).filter(
            (level) => level.Code != null && level.DisplayName != null,
          );
          const field = data.formSchema.fields.find(
            (field) => field.key === "level" && field.type === "select",
          );
          if (
            field &&
            levels.length &&
            field.optionsFrom !== "certificateLevels" &&
            (field.options.length !== levels.length ||
              levels.some(
                (level) =>
                  !field.options.some(
                    (option) =>
                      typeof option === "object" &&
                      option.value === level.Code &&
                      option.label === level.DisplayName,
                  ),
              ))
          )
            throw new AppError(
              "Mã bậc và tên bậc phải khớp nguyên bản danh mục trường.",
              409,
              { code: "CERT_SCHOOL_LEVEL_LOCKED" },
            );
          if (field && levels.length)
            data = {
              ...data,
              formSchema: {
                fields: data.formSchema.fields.map((item) =>
                  item === field
                    ? {
                        key: item.key,
                        label: item.label,
                        type: item.type,
                        required: item.required,
                        optionsFrom: "certificateLevels",
                      }
                    : item,
                ),
              },
            };
        }
      }
      if (kind === "types") {
        if (
          !data.displayName &&
          !(
            existing?.IsSchoolProvided &&
            existing.DisplayName === "" &&
            !data.isPublished
          )
        )
          throw new AppError("Cần tên loại chứng chỉ.", 400);
        if (
          data.languageId == null &&
          !(
            existing?.IsSchoolProvided &&
            existing.LanguageId == null &&
            !data.isPublished
          )
        )
          throw new AppError("Cần ngôn ngữ của loại chứng chỉ.", 400);
        if (
          data.formSchema.fields.some(
            (field) => field.optionsFrom === "certificateLevels",
          ) &&
          !(existing?.Levels ?? []).some(
            (level) => level.Code != null && level.DisplayName != null,
          )
        )
          throw new AppError("Loại chứng chỉ chưa có danh sách bậc.", 400);
        if (existing?.BaseCertificateTypeId && !data.baseCertificateTypeId)
          data = {
            ...data,
            baseCertificateTypeId: existing.BaseCertificateTypeId,
          };
        if (data.baseCertificateTypeId) {
          const base = catalog.types.find(
            (row) => row.Id === data.baseCertificateTypeId,
          );
          if (
            !base ||
            base.Id === id ||
            base.LanguageId !== data.languageId ||
            (existing?.BaseCertificateTypeId &&
              existing.BaseCertificateTypeId !== base.Id)
          )
            throw new AppError("Loại gốc của bản bổ sung không hợp lệ.", 400);
        }
      }
      const row = await repository.saveCatalog(kind, { data, id, expected });
      return { languages: languageDto, types: typeDto, policies: policyDto }[
        kind
      ](row);
    },
    async list(actor, query) {
      return listDto(await repository.list({ ...query, actor }));
    },
    async get(actor, applicationId) {
      return applicationDto(await load(actor, applicationId));
    },
    async prepare(actor, input) {
      profile(actor);
      if (!Array.isArray(input.files) || input.files.length !== 1)
        throw new AppError(
          "Mỗi hồ sơ ngoại ngữ phải có đúng một file minh chứng.",
          400,
          { field: "files" },
        );
      if (
        input.data.studentCode !== null &&
        input.data.studentCode !== undefined &&
        input.data.studentCode !== actor.studentCode
      )
        throw new AppError("MSSV phải khớp hồ sơ sinh viên đăng nhập.", 403);
      const today = new Date(clock().getTime() + 7 * 3600000)
        .toISOString()
        .slice(0, 10);
      if (input.data.issuedOn > today)
        throw new AppError("Ngày cấp không được ở tương lai.", 422);
      const catalog = await repository.catalog();
      const details = lookup(
        catalog,
        input.data.certificateTypeId,
        actor.cohortYear,
      );
      const data = {
        ...input.data,
        result: validateResult(
          input.data.result,
          resolveFormSchema(details.type.FormSchema, details.type.Levels),
        ),
      };
      const applicationId = input.applicationId ?? randomUUID();
      let expected = null;
      let replacedFiles = [];
      if (input.applicationId) {
        const application = await load(actor, applicationId);
        const expiry = application.ExpiresAt?.replace(/Z?$/, "Z");
        const expiredCheck =
          application.Status === "checking" && new Date(expiry) <= clock();
        if (!canEdit(application.Status) && !expiredCheck)
          throw new AppError(
            "Hồ sơ chỉ được sửa khi chưa nộp hoặc có yêu cầu bổ sung.",
            409,
          );
        if (
          application.StudentCode !== actor.studentCode ||
          application.CohortYear !== actor.cohortYear
        )
          throw new AppError("Hồ sơ sinh viên không khớp.", 403);
        expected = application.VersionToken;
        replacedFiles = application.Files.filter(
          (file) => file.Bucket === storage.bucket,
        );
      }
      if (!storage.bucket) throw new AppError("Chưa cấu hình bucket R2.", 503);
      const expiresAt = new Date(
        clock().getTime() + config.uploadTtlSeconds * 1000,
      ).toISOString();
      const files = [],
        uploads = [];
      for (const file of input.files) {
        const id = randomUUID(),
          suffix = applicationId + "/" + id;
        const objectKey = "certifications/evidence/" + suffix;
        const signed = await storage.presignUpload(
          objectKey,
          file.contentType,
          config.uploadTtlSeconds,
        );
        files.push({ ...file, id, objectKey });
        uploads.push({
          id,
          purpose: file.purpose,
          fileName: file.fileName,
          ...signed,
          expiresAt,
        });
      }
      const prepared = await repository.prepareSubmission({
        actor,
        applicationId,
        expected,
        existing: Boolean(input.applicationId),
        data,
        snapshot: snapshot(details),
        policyVersions: catalog.policies.map((p) => ({
          id: p.Id,
          revision: p.Revision,
        })),
        files,
        bucket: storage.bucket,
        expiresAt,
      });
      // The replacement is committed before removing superseded evidence.
      // A storage cleanup failure must not hide a successful preparation.
      await Promise.allSettled(
        replacedFiles.map((file) => storage.remove(file.ObjectKey)),
      );
      notifyCertificateChanged(events, "language", prepared);
      return { applicationId, expiresAt, uploads };
    },
    async complete(actor, applicationId) {
      profile(actor);
      const application = await load(actor, applicationId);
      if (["submitted", "verified", "rejected"].includes(application.Status))
        return applicationDto(application);
      if (application.Status !== "uploading")
        throw new AppError("Hồ sơ không thể nộp thêm.", 409);
      const pending = application;
      if (pending.Files.length !== 1)
        throw new AppError(
          "Hồ sơ ngoại ngữ phải có đúng một file minh chứng.",
          409,
          { field: "files" },
        );
      validateResult(pending.Result, pending.CatalogSnapshot.type.formSchema);
      lookup(
        await repository.catalog(),
        pending.CertificateTypeId,
        application.CohortYear,
      );
      const reference = {
        actor,
        applicationId,
        expected: application.VersionToken,
        claimToken: randomUUID(),
      };
      const claimed = await repository.claimSubmission(reference);
      if (claimed?.VersionToken) reference.expected = claimed.VersionToken;
      let result;
      try {
        const files = await inspectEvidenceFiles(pending.Files, {
          storage,
          inspectImage,
          config,
          inspectionQueue,
        });
        const catalog = await repository.catalog();
        const details = lookup(
          catalog,
          pending.CertificateTypeId,
          application.CohortYear,
        );
        const acceptedSnapshot = {
          ...pending.CatalogSnapshot,
          policies: details.policies.map(policySnapshot),
        };
        result = await repository.finishSubmission({
          ...reference,
          files,
          snapshot: acceptedSnapshot,
          policyVersions: catalog.policies.map((p) => ({
            id: p.Id,
            revision: p.Revision,
          })),
        });
      } catch (error) {
        // Keep valid, immutable uploads on transient failures so complete can be retried.
        // In particular, a lost DB response must never delete committed evidence.
        await repository.releaseSubmission(reference).catch(() => {});
        throw error;
      }
      notifyCertificateChanged(events, "language", result);
      return applicationDto(result);
    },
    async review(actor, applicationId, expected, input) {
      role(actor, "reviewer");
      const application = await load(actor, applicationId);
      if (
        application.Status !== "submitted" ||
        application.VersionToken !== expected
      )
        throw new AppError("Hồ sơ đã thay đổi hoặc không còn chờ duyệt.", 409);
      const result = await repository.review({
        actor,
        applicationId,
        expected,
        ...input,
      });
      notifyCertificateChanged(events, "language", result);
      return applicationDto(result);
    },
    async download(actor, applicationId, fileId) {
      const application = await load(actor, applicationId);
      const file = (application.SubmittedAt ? application.Files : []).find(
        (f) =>
          f.Id.toLowerCase() === fileId.toLowerCase() &&
          f.Status === "completed",
      );
      if (!file) throw new AppError("Không tìm thấy minh chứng đã nhận.", 404);
      return {
        url: await storage.download(file.ObjectKey, config.downloadTtlSeconds),
        expiresIn: config.downloadTtlSeconds,
      };
    },
  });
}
