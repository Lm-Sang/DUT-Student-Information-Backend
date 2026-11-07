const text = (value) => String(value ?? "").trim();
// Seven Monday–Sunday slots, matching CourseRegistration ScheduleFactory.ParseDays.
export function parseSchoolSchedule(value) {
  const parts = text(value).split(";");
  if (parts.length !== 7) return [];
  return parts.flatMap((part, dayIndex) => {
    const match = /^\s*(\d{1,2})\s*-\s*(\d{1,2})(?:\s*,\s*(.*))?$/.exec(part);
    if (!match) return [];
    const start = Number(match[1]),
      end = Number(match[2]);
    if (start < 1 || end < start || end > 20) return [];
    const room = text(match[3]);
    return [
      {
        dayIndex,
        startPeriod: start,
        endPeriod: end,
        room: room && !room.includes("?") ? room : null,
      },
    ];
  });
}
