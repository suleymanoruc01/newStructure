import { dayIntervals } from '../workers/availability.util.js';

type Interval = { start: number; end: number };

export type AvailabilityRecord = {
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
  crossesMidnight: boolean;
};

function minutesSinceMidnightUtc(date: Date): number {
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}

export function buildDayIntervalMap(
  windows: AvailabilityRecord[],
): Map<number, Interval[]> {
  const byDay = new Map<number, Interval[]>();

  for (const window of windows) {
    const chunks = dayIntervals({
      dayOfWeek: window.dayOfWeek,
      startMinute: window.startMinute,
      endMinute: window.endMinute,
      crossesMidnight: window.crossesMidnight,
    });
    for (const chunk of chunks) {
      const list = byDay.get(chunk.day) ?? [];
      for (const interval of chunk.intervals) {
        list.push(interval);
      }
      byDay.set(chunk.day, list);
    }
  }

  return byDay;
}

function jobToSegments(
  startsAt: Date,
  endsAt: Date,
): { day: number; start: number; end: number }[] {
  if (endsAt.getTime() <= startsAt.getTime()) {
    return [];
  }
  const startDay = startsAt.getUTCDay();
  const endDay = endsAt.getUTCDay();
  const startMin = minutesSinceMidnightUtc(startsAt);
  const endMin = minutesSinceMidnightUtc(endsAt);

  if (startDay === endDay) {
    return [{ day: startDay, start: startMin, end: endMin }];
  }

  const segments: { day: number; start: number; end: number }[] = [
    { day: startDay, start: startMin, end: 1440 },
  ];
  let day = (startDay + 1) % 7;
  while (day !== endDay) {
    segments.push({ day, start: 0, end: 1440 });
    day = (day + 1) % 7;
  }
  segments.push({ day: endDay, start: 0, end: endMin });
  return segments;
}

function segmentCovered(
  byDay: Map<number, Interval[]>,
  segment: { day: number; start: number; end: number },
): boolean {
  const list = byDay.get(segment.day) ?? [];
  return list.some(
    (interval) =>
      interval.start <= segment.start && interval.end >= segment.end,
  );
}

export function availabilityCoversJob(
  windows: AvailabilityRecord[],
  startsAt: Date,
  endsAt: Date,
): boolean {
  const byDay = buildDayIntervalMap(windows);
  const segments = jobToSegments(startsAt, endsAt);
  if (segments.length === 0) {
    return false;
  }
  return segments.every((segment) => segmentCovered(byDay, segment));
}

/** agent-default: gap-night-shift — cross-midnight or late-night window */
export function jobRequiresNightShiftAvailability(
  startsAt: Date,
  endsAt: Date,
): boolean {
  if (startsAt.getUTCDay() !== endsAt.getUTCDay()) {
    return true;
  }
  const startMin = minutesSinceMidnightUtc(startsAt);
  const endMin = minutesSinceMidnightUtc(endsAt);
  if (endMin < startMin) {
    return true;
  }
  return startMin >= 22 * 60 || endMin <= 6 * 60;
}
