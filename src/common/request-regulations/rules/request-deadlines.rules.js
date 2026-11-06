const dayMs = 24 * 60 * 60 * 1000;

function timestamp(value) {
  if (!value) return null;
  const text = value instanceof Date ? value.toISOString() : String(value);
  const time = Date.parse(/(?:Z|[+-]\d{2}:\d{2})$/i.test(text) ? text : text + 'Z');
  return Number.isFinite(time) ? time : null;
}

/** Calendar-day regulations, evaluated without changing the application workflow. */
export function requestDeadlines({ kind, status, submittedAt, receivedAt, paperReceivedAt, paperDeadlineAt }, now = new Date()) {
  const submitted = timestamp(submittedAt), received = timestamp(receivedAt);
  const paper = timestamp(paperReceivedAt);
  const certificate = kind === 'certificate';
  const intake = submitted === null ? null : submitted + dayMs;
  const processing = certificate
    ? received === null ? null : received + 13 * dayMs
    : paper === null ? null : paper + 5 * dayMs;
  const result = certificate && submitted !== null ? submitted + 14 * dayMs : null;
  const paperDue = certificate ? null : timestamp(paperDeadlineAt);
  const tags = [];
  const late = deadline => deadline !== null && new Date(now).getTime() > deadline;
  if (status === 'submitted' && late(intake)) tags.push('intake');
  if (status === 'processing' && late(processing)) tags.push('processing');
  if (certificate && ['submitted', 'processing'].includes(status) && late(result)) tags.push('result');
  if (!certificate && status === 'received' && late(paperDue)) tags.push('paper_submission');
  const iso = value => value === null ? null : new Date(value).toISOString();
  return {
    deadlineStatus: tags.length ? 'overdue' : 'on_time',
    overdue: tags.length > 0,
    overdueTags: tags,
    deadlines: { intakeAt: iso(intake), processingAt: iso(processing), resultAt: iso(result), paperSubmissionAt: iso(paperDue) },
  };
}
