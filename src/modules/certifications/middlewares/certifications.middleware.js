import { AppError } from "../../../shared/errors/app-error.js";

export function createCertificationMiddleware(
  config,
  contextProvider,
  studentContextProvider,
  reviewerContextProvider,
) {
  const windows = new Map();
  return function context(role) {
    return async (req, res, next) => {
      try {
        const expectedRole = role === "student" ? "student" : "reviewer";
        res.set({
          "Cache-Control": "private, no-store",
          "Referrer-Policy": "no-referrer",
          "Access-Control-Expose-Headers": "ETag",
        });
        if (!contextProvider && role !== "student" && !reviewerContextProvider)
          throw new AppError(
            "Chưa cấu hình xác thực chuyên viên và quản lý danh mục.",
            503,
            { code: "CERT_AUTH_CONTEXT_REQUIRED" },
          );
        const actor = contextProvider
          ? await contextProvider(req, role)
          : role === "student"
            ? await studentContextProvider(req)
            : await reviewerContextProvider(req, role);
        if (
          !actor ||
          actor.role !== expectedRole ||
          typeof actor.reference !== "string" ||
          !actor.reference.trim() ||
          actor.reference.length > 128 ||
          !["development", "manual", "auth"].includes(actor.source) ||
          (expectedRole === "reviewer" &&
            (typeof actor.name !== "string" ||
              !actor.name.trim() ||
              actor.name.length > 150))
        ) {
          throw new AppError("Không có ngữ cảnh thao tác phù hợp.", 403);
        }
        if (
          role === "catalog" &&
          (!Array.isArray(actor.permissions) ||
            !actor.permissions.includes("certifications:catalog:manage"))
        )
          throw new AppError("Cần quyền quản lý danh mục.", 403);
        if (
          req.body !== undefined &&
          Buffer.byteLength(JSON.stringify(req.body), "utf8") >
            (role === "catalog" ? 65536 : 16384)
        )
          throw new AppError("Request vượt giới hạn dữ liệu.", 413);
        if (
          ["POST", "PUT", "PATCH"].includes(req.method) &&
          req.body !== undefined &&
          !req.is("application/json")
        )
          throw new AppError("Cần gửi Content-Type application/json.", 415);
        const key = `${actor.source}:${actor.reference}:${role}`;
        const now = Date.now();
        for (const [stored, window] of windows)
          if (now - window.started >= 60000) windows.delete(stored);
        const window = windows.get(key) ?? { started: now, count: 0 };
        window.count++;
        if (windows.size > 1000 && !windows.has(key))
          throw new AppError("Vui lòng thử lại sau.", 429);
        windows.set(key, window);
        if (window.count > 120) {
          res.set("Retry-After", "60");
          throw new AppError("Quá nhiều yêu cầu trong một phút.", 429);
        }
        req.certificationActor = Object.freeze({
          ...actor,
          permissions: Object.freeze(
            Array.isArray(actor.permissions) ? [...actor.permissions] : [],
          ),
        });
        next();
      } catch (error) {
        next(error);
      }
    };
  };
}
