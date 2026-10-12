function minutesLabel(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} dk`;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} sa ${rest} dk` : `${hours} sa`;
}

export function remainingLabel(
  deadlineIso: string,
  now = Date.now(),
): string | null {
  const ms = new Date(deadlineIso).getTime() - now;
  if (!Number.isFinite(ms)) {
    return null;
  }
  if (ms <= 0) {
    return '0 dk';
  }
  return minutesLabel(Math.round(ms / 60_000));
}

export function elapsedLabel(
  startedIso: string,
  now = Date.now(),
): string | null {
  const ms = now - new Date(startedIso).getTime();
  if (!Number.isFinite(ms)) {
    return null;
  }
  return minutesLabel(Math.max(0, Math.round(ms / 60_000)));
}

export function durationHours(startsAt: string, endsAt: string): number | null {
  const ms = new Date(endsAt).getTime() - new Date(startsAt).getTime();
  if (!Number.isFinite(ms) || ms <= 0) {
    return null;
  }
  return Math.round((ms / 3_600_000) * 10) / 10;
}
