import { AppError } from "../../../shared/errors/app-error.js";
import {certificationImageQueue} from '../queues/image-inspection-queue.js';

// Each task holds image bytes and decoded pixels; keep concurrency bounded.
const concurrency = 2;

export async function inspectEvidenceFiles(
  files,
  { storage, inspectImage, config, inspectionQueue=certificationImageQueue },
) {
  const results = new Array(files.length);
  let nextIndex = 0;
  let failed = false;

  async function inspectFile(file) {
    const metadata = await storage.head(file.ObjectKey);
    if (
      metadata.sizeBytes !== file.DeclaredSizeBytes ||
      metadata.sizeBytes > config.maxFileBytes
    ) {
      await storage.remove(file.ObjectKey);
      throw new AppError("Dung lượng ảnh không khớp khai báo.", 422, {
        code: "FILE_SIZE_MISMATCH",
      });
    }
    const bytes = await storage.read(file.ObjectKey, config.maxFileBytes);
    if (bytes.length !== file.DeclaredSizeBytes) {
      await storage.remove(file.ObjectKey);
      throw new AppError("Dung lượng minh chứng không khớp.", 422);
    }
    const inspection = await inspectImage(bytes, file.DeclaredContentType);
    if (!["passed", "needs_review"].includes(inspection.status)) {
      await storage.remove(file.ObjectKey);
      throw new AppError("Ảnh minh chứng không đạt.", 422, {
        fileName: file.OriginalFileName,
        reasons: inspection.reasons,
      });
    }
    return { id: file.Id, inspection };
  }

  async function worker() {
    while (!failed && nextIndex < files.length) {
      const index = nextIndex++;
      try {
        results[index] = await inspectionQueue.run(()=>failed?undefined:inspectFile(files[index]));
      } catch (error) {
        failed = true;
        throw error;
      }
    }
  }

  // Drain active tasks before the caller can release the submission claim.
  const workers = await Promise.allSettled(
    Array.from({ length: Math.min(concurrency, files.length) }, () => worker()),
  );
  const failure = workers.find((result) => result.status === "rejected");
  if (failure) throw failure.reason;
  return results;
}
