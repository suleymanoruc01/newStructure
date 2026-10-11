export function computeConfirmWindow(
  startsAt: Date,
  confirmHours: number,
  noResponseMinutes: number,
  now = new Date(),
): { confirmOpensAt: Date; confirmDeadlineAt: Date } {
  const threeHoursMs = confirmHours * 60 * 60 * 1000;
  const opensAt = new Date(
    Math.max(now.getTime(), startsAt.getTime() - threeHoursMs),
  );
  const deadlineAt = new Date(
    opensAt.getTime() + noResponseMinutes * 60 * 1000,
  );
  return { confirmOpensAt: opensAt, confirmDeadlineAt: deadlineAt };
}

export function isConfirmWindowOpen(
  confirmOpensAt: Date,
  confirmDeadlineAt: Date,
  startsAt: Date,
  now = new Date(),
): boolean {
  return (
    now.getTime() >= confirmOpensAt.getTime() &&
    now.getTime() < startsAt.getTime()
  );
}

export function isCheckInWindowOpen(
  startsAt: Date,
  earlyMinutes: number,
  lateMinutes: number,
  now = new Date(),
): boolean {
  const earliest = startsAt.getTime() - earlyMinutes * 60 * 1000;
  const latest = startsAt.getTime() + lateMinutes * 60 * 1000;
  return now.getTime() >= earliest && now.getTime() <= latest;
}
