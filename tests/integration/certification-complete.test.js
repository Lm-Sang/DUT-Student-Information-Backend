import assert from "node:assert/strict";
import { setImmediate } from "node:timers/promises";
import test from "node:test";
import { createCertificationsService } from "../../src/modules/certifications/services/certifications.service.js";
import { createItCertificationsService } from "../../src/modules/certifications/services/it-certifications.service.js";
import { AppError } from "../../src/shared/errors/app-error.js";

const actor = {
  role: "student",
  reference: "student",
  source: "auth",
  studentCode: "102230001",
  cohortYear: 2023,
};
const inspection = {
  status: "needs_review",
  reasons: ["DOCUMENT_CONTENT_REVIEW_REQUIRED"],
};

function fixture(
  createService,
  count = createService === createCertificationsService ? 1 : 4,
) {
  const files = Array.from({ length: count }, (_, index) => ({
    Id: `file-${index}`,
    ObjectKey: `evidence/${index}`,
    OriginalFileName: `${index}.png`,
    DeclaredSizeBytes: 1,
    DeclaredContentType: "image/png",
    Status: "pending",
  }));
  const submission = {
    Id: "submission",
    Status: "uploading",
    Files: files,
    CertificateTypeId: 1,
    Result: {},
    CatalogSnapshot: { type: { formSchema: { fields: [] } } },
    FullName: "Sinh viên",
    ClassName: "23T1",
    BirthDate: "2005-01-01",
    TheoryScore: 8,
    PracticalScore: 9,
    ExamSession: "2026",
    Certificate: {
      ID: 1,
      MaHS: actor.studentCode,
      MaCC: "CNTT01",
      CoSoCapCC: "Cơ sở cấp thử nghiệm",
    },
  };
  const application = {
    Id: "application",
    ActorReference: actor.reference,
    ActorSource: actor.source,
    StudentCode: actor.studentCode,
    CohortYear: actor.cohortYear,
    Status: "uploading",
    VersionToken: "version",
    CurrentSubmissionId: null,
    Submissions: [submission],
  };
  if (createService === createCertificationsService)
    Object.assign(application, {
      CertificateTypeId: submission.CertificateTypeId,
      Result: submission.Result,
      CatalogSnapshot: submission.CatalogSnapshot,
      FullName: submission.FullName,
      ClassName: submission.ClassName,
      Files: files,
    });
  const events = [];
  const state = {
    files,
    application,
    submission,
    events,
    finished: null,
    inspect: async () => inspection,
  };
  const repository = {
    async get() {
      return application;
    },
    async catalog() {
      events.push("catalog");
      return {
        languages: [{ Id: 1, IsPublished: true }],
        types: [{ Id: 1, LanguageId: 1, IsPublished: true }],
        policies: [
          {
            Id: 1,
            LanguageId: 1,
            CohortFrom: 2023,
            IsRecognized: true,
            Revision: 1,
          },
        ],
      };
    },
    async claimSubmission() {
      events.push("claim");
    },
    async releaseSubmission() {
      events.push("release");
    },
    async finishSubmission(input) {
      events.push("finish");
      state.finished = input;
      submission.Status = "submitted";
      application.Status = "submitted";
      application.CurrentSubmissionId = submission.Id;
      return application;
    },
  };
  const storage = {
    async head(key) {
      events.push(`head:${key}`);
      return { sizeBytes: 1 };
    },
    async read(key, limit) {
      assert.equal(limit, 1024);
      assert.ok(events.includes(`head:${key}`));
      events.push(`read:${key}`);
      return Buffer.from([Number(key.split("/").at(-1))]);
    },
    async remove(key) {
      events.push(`remove:${key}`);
    },
  };
  const service = createService({
    repository,
    storage,
    config: { maxFileBytes: 1024 },
    clock: () => new Date("2026-10-26T00:00:00Z"),
    inspectionQueue: {
      run: (task) => (state.schedule ? state.schedule(task) : task()),
    },
    inspectImage: async (bytes, contentType) => {
      const index = bytes[0];
      assert.equal(contentType, "image/png");
      assert.ok(events.includes(`read:evidence/${index}`));
      events.push(`inspect:${index}`);
      return state.inspect(index);
    },
  });
  return {
    ...state,
    state,
    repository,
    storage,
    complete: () => service.complete(actor, application.Id),
  };
}

for (const [name, createService] of [
  ["language", createCertificationsService],
  ["IT", createItCertificationsService],
]) {
  if (createService === createItCertificationsService) {
    test(
      `${name} complete overlaps two inspections, bounds concurrency and preserves file order`,
      { timeout: 5000 },
      async () => {
        const f = fixture(createService);
        const started = f.files.map(() => Promise.withResolvers());
        const gates = f.files.map(() => Promise.withResolvers());
        f.state.inspect = (index) => {
          started[index].resolve();
          return gates[index].promise;
        };
        const completion = f.complete();
        try {
          await Promise.all([started[0].promise, started[1].promise]);
          assert.deepEqual(
            f.events.filter((event) => event.startsWith("head:")),
            ["head:evidence/0", "head:evidence/1"],
          );
          assert.equal(
            f.events[0] === "claim" || f.events[1] === "claim",
            true,
          );
          assert.equal(f.state.finished, null);
          // Keep file 0 blocked while the other worker processes the remaining files.
          for (let index = 1; index < f.files.length - 1; index++) {
            gates[index].resolve(inspection);
            await started[index + 1].promise;
          }
          gates[3].resolve(inspection);
          await setImmediate();
          assert.equal(f.state.finished, null);
          gates[0].resolve(inspection);
          assert.equal((await completion).status, "submitted");
          assert.deepEqual(
            f.state.finished.files,
            f.files.map((file) => ({ id: file.Id, inspection })),
          );
          assert.equal(f.events.includes("release"), false);
        } finally {
          gates.forEach((gate) => gate.resolve(inspection));
          await completion;
        }
      },
    );

    test(
      `${name} complete drains active work before release, stops queued files and permits retry`,
      { timeout: 5000 },
      async () => {
        const f = fixture(createService);
        const started = [Promise.withResolvers(), Promise.withResolvers()];
        const gates = [Promise.withResolvers(), Promise.withResolvers()];
        const failure = new Error("Transient image processing failure");
        f.state.inspect = (index) => {
          started[index].resolve();
          return gates[index].promise;
        };
        const completion = assert.rejects(
          f.complete(),
          (error) => error === failure,
        );
        try {
          await Promise.all(started.map((signal) => signal.promise));
          gates[0].reject(failure);
          await setImmediate();
          assert.equal(f.events.includes("release"), false);
          assert.equal(f.state.finished, null);
          assert.equal(
            f.events.some((event) => /evidence\/[23]$/.test(event)),
            false,
          );
          gates[1].resolve(inspection);
          await completion;
          assert.equal(f.events.at(-1), "release");
          assert.equal(
            f.events.some((event) => event.startsWith("remove:")),
            false,
          );
          f.state.inspect = async () => inspection;
          assert.equal((await f.complete()).status, "submitted");
        } finally {
          gates.forEach((gate) => gate.resolve(inspection));
          await completion;
        }
      },
    );
  }
  for (const failure of [
    "metadata mismatch",
    "oversized file",
    "truncated body",
    "invalid image",
  ]) {
    test(`${name} complete rejects ${failure} and removes only the invalid file`, async () => {
      const f = fixture(createService, 1);
      if (failure === "metadata mismatch")
        f.storage.head = async () => ({ sizeBytes: 2 });
      if (failure === "oversized file") {
        f.files[0].DeclaredSizeBytes = 1025;
        f.storage.head = async () => ({ sizeBytes: 1025 });
      }
      if (failure === "truncated body")
        f.storage.read = async () => Buffer.alloc(0);
      if (failure === "invalid image")
        f.state.inspect = async () => ({
          status: "failed",
          reasons: ["IMAGE_TOO_SMALL"],
        });
      await assert.rejects(f.complete(), (error) => {
        assert.equal(error.statusCode, 422);
        if (failure === "metadata mismatch" || failure === "oversized file") {
          assert.equal(error.details.code, "FILE_SIZE_MISMATCH");
          assert.equal(
            f.events.some((event) => event.startsWith("read:")),
            false,
          );
        }
        if (failure === "invalid image")
          assert.deepEqual(error.details, {
            fileName: "0.png",
            reasons: ["IMAGE_TOO_SMALL"],
          });
        return true;
      });
      assert.deepEqual(
        f.events.filter((event) => event.startsWith("remove:")),
        ["remove:evidence/0"],
      );
      assert.equal(f.events.at(-1), "release");
      assert.equal(f.state.finished, null);
    });
  }

  test(`${name} complete preserves valid evidence after a failed database response and retries`, async () => {
    const f = fixture(createService);
    const finish = f.repository.finishSubmission;
    const failure = new Error("Lost database response");
    f.repository.finishSubmission = async () => {
      throw failure;
    };
    await assert.rejects(f.complete(), (error) => error === failure);
    assert.equal(f.events.at(-1), "release");
    assert.equal(
      f.events.some((event) => event.startsWith("remove:")),
      false,
    );
    f.repository.finishSubmission = finish;
    const submitted = await f.complete();
    assert.equal(submitted.status, "submitted");
    const eventCount = f.events.length;
    assert.deepEqual(await f.complete(), submitted);
    assert.equal(f.events.length, eventCount);
  });

  test(`${name} busy inspection queue releases the claim and preserves the file for retry`, async () => {
    const f = fixture(createService, 1);
    f.state.schedule = () =>
      Promise.reject(
        new AppError("Busy", 503, { code: "CERT_IMAGE_QUEUE_FULL" }),
      );
    await assert.rejects(
      f.complete(),
      (e) => e.statusCode === 503 && e.details.code === "CERT_IMAGE_QUEUE_FULL",
    );
    assert.equal(f.events.at(-1), "release");
    assert.equal(
      f.events.some((e) => e.startsWith("remove:")),
      false,
    );
    assert.equal(f.state.finished, null);
    f.state.schedule = null;
    assert.equal((await f.complete()).status, "submitted");
  });

  test(`${name} complete does not inspect files or release another request's claim on conflict`, async () => {
    const f = fixture(createService);
    const conflict = new Error("Claim conflict");
    f.repository.claimSubmission = async () => {
      throw conflict;
    };
    await assert.rejects(f.complete(), (error) => error === conflict);
    assert.deepEqual(
      f.events.filter((event) => event !== "catalog"),
      [],
    );
  });
}
