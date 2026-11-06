import { AppError } from "../../../shared/errors/app-error.js";
import { certificationConfig } from "../../../config/certifications.js";

export function createCertificationEvents({
  maxConnections = 1000,
  maxPerActor = 2,
} = {}) {
  if (
    !Number.isInteger(maxConnections) ||
    maxConnections < 1 ||
    !Number.isInteger(maxPerActor) ||
    maxPerActor < 1
  )
    throw new TypeError("Invalid certification event connection limits.");
  const owners = new Map(),
    reviewers = new Set(),
    all = new Set();
  const keyOf = (actor) =>
    JSON.stringify([actor.role, actor.source, actor.reference]);
  function subscribe(actor, onEvent, onClose = () => {}) {
    if (
      !["student", "reviewer"].includes(actor?.role) ||
      !actor.reference ||
      !actor.source
    )
      throw new AppError("Không có quyền nhận cập nhật.", 403);
    const key = keyOf(actor),
      group = owners.get(key) ?? new Set();
    if (all.size >= maxConnections || group.size >= maxPerActor)
      throw new AppError(
        "Đã đạt giới hạn kết nối cập nhật. Vui lòng thử lại sau.",
        429,
        { code: "CERT_EVENTS_LIMIT", retryAfterSeconds: 10 },
      );
    const entry = { actor, onEvent, onClose };
    group.add(entry);
    owners.set(key, group);
    all.add(entry);
    if (actor.role === "reviewer") reviewers.add(entry);
    entry.detach = () => {
      all.delete(entry);
      reviewers.delete(entry);
      group.delete(entry);
      if (!group.size) owners.delete(key);
    };
    return entry.detach;
  }
  return Object.freeze({
    subscribe,
    publish({ owner, kind, applicationId, status, rowVersion }) {
      const recipients = new Set([
        ...reviewers,
        ...(owners.get(keyOf({ role: "student", ...owner })) ?? []),
      ]);
      const event = {
        kind,
        applicationId: applicationId.toLowerCase(),
        status,
        rowVersion,
      };
      for (const entry of recipients) {
        try {
          entry.onEvent(event);
        } catch {
          entry.detach();
          try {
            entry.onClose();
          } catch {}
        }
      }
    },
    closeAll() {
      for (const entry of [...all]) {
        entry.detach();
        try {
          entry.onClose();
        } catch {}
      }
    },
    get size() {
      return all.size;
    },
  });
}
export const certificationEvents = createCertificationEvents(
  certificationConfig.events,
);

// Publication is a best-effort hint after the database transaction has committed.
// Reconnection always reads the current record again; DB changes never fail because a client disconnected.
export function notifyCertificateChanged(events, kind, row) {
  if (!events || !row) return;
  try {
    events.publish({
      owner: { reference: row.ActorReference, source: row.ActorSource },
      kind,
      applicationId: row.Id,
      status: row.Status,
      rowVersion: row.VersionToken,
    });
  } catch {}
}
