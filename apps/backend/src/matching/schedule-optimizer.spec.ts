import { describe, expect, it } from 'vitest';
import {
  areShiftsCompatible,
  optimizeWorkerSchedule,
  type SchedulableJob,
} from './schedule-optimizer.util.js';

describe('Multi-Shift Schedule Optimizer Algorithm', () => {
  describe('areShiftsCompatible', () => {
    it('rejects shifts where earlier ends after later starts (temporal overlap)', () => {
      const a: SchedulableJob = {
        id: '1',
        startsAt: new Date('2026-10-15T09:00:00Z'),
        endsAt: new Date('2026-10-15T14:00:00Z'),
        payAmountMinor: 100000,
      };
      const b: SchedulableJob = {
        id: '2',
        startsAt: new Date('2026-10-15T13:30:00Z'),
        endsAt: new Date('2026-10-15T18:00:00Z'),
        payAmountMinor: 100000,
      };
      expect(areShiftsCompatible(a, b)).toBe(false);
    });

    it('rejects shifts with insufficient transit buffer between distant venues', () => {
      // 30 km apart with only 15 min gap (requires at least ~60 min transit)
      const a: SchedulableJob = {
        id: '1',
        startsAt: new Date('2026-10-15T09:00:00Z'),
        endsAt: new Date('2026-10-15T14:00:00Z'),
        payAmountMinor: 100000,
        latitude: 40.99,
        longitude: 29.02,
      };
      const b: SchedulableJob = {
        id: '2',
        startsAt: new Date('2026-10-15T14:15:00Z'),
        endsAt: new Date('2026-10-15T19:00:00Z'),
        payAmountMinor: 100000,
        latitude: 41.0,
        longitude: 28.65,
      };
      expect(areShiftsCompatible(a, b)).toBe(false);
    });

    it('rejects two shifts in a 24h window exceeding statutory 11-hour labor limit', () => {
      // Shift A = 7 hours, Shift B = 6 hours (total = 13 hours > 11 hours)
      const a: SchedulableJob = {
        id: '1',
        startsAt: new Date('2026-10-15T06:00:00Z'),
        endsAt: new Date('2026-10-15T13:00:00Z'), // 7h
        payAmountMinor: 100000,
        latitude: 41.0,
        longitude: 29.0,
      };
      const b: SchedulableJob = {
        id: '2',
        startsAt: new Date('2026-10-15T16:00:00Z'),
        endsAt: new Date('2026-10-15T22:00:00Z'), // 6h (3h rest gap, but 13h total)
        payAmountMinor: 100000,
        latitude: 41.0,
        longitude: 29.0,
      };
      expect(areShiftsCompatible(a, b)).toBe(false);
    });

    it('accepts compliant split shifts with adequate transit and within daily limits', () => {
      // Shift A = 4 hours, Shift B = 4 hours (total = 8 hours <= 11 hours) with 2h rest gap
      const a: SchedulableJob = {
        id: '1',
        startsAt: new Date('2026-10-15T08:00:00Z'),
        endsAt: new Date('2026-10-15T12:00:00Z'),
        payAmountMinor: 80000,
        latitude: 41.0,
        longitude: 29.0,
      };
      const b: SchedulableJob = {
        id: '2',
        startsAt: new Date('2026-10-15T14:00:00Z'),
        endsAt: new Date('2026-10-15T18:00:00Z'),
        payAmountMinor: 80000,
        latitude: 41.0,
        longitude: 29.0,
      };
      expect(areShiftsCompatible(a, b)).toBe(true);
    });
  });

  describe('optimizeWorkerSchedule DP Algorithm', () => {
    it('returns empty result when given no jobs', () => {
      const res = optimizeWorkerSchedule([]);
      expect(res.selectedJobs).toHaveLength(0);
      expect(res.totalEarningsMinor).toBe(0);
    });

    it('selects the highest paying compatible subset among competing overlapping jobs', () => {
      // 3 jobs competing for the afternoon:
      // Job 1: 09:00 - 13:00 (₺800)
      // Job 2: 12:00 - 17:00 (₺1,200) - overlaps Job 1 and Job 3
      // Job 3: 14:00 - 18:00 (₺1,000) - compatible with Job 1 (₺800 + ₺1,000 = ₺1,800 > ₺1,200)
      const jobs: SchedulableJob[] = [
        {
          id: 'j1',
          title: 'Sabah Servis',
          startsAt: new Date('2026-10-15T09:00:00Z'),
          endsAt: new Date('2026-10-15T13:00:00Z'),
          payAmountMinor: 80000,
          latitude: 41.0,
          longitude: 29.0,
          matchScore: 90,
        },
        {
          id: 'j2',
          title: 'Öğle Yoğunluğu',
          startsAt: new Date('2026-10-15T12:00:00Z'),
          endsAt: new Date('2026-10-15T17:00:00Z'),
          payAmountMinor: 120000,
          latitude: 41.0,
          longitude: 29.0,
          matchScore: 80,
        },
        {
          id: 'j3',
          title: 'Akşam Hazırlık',
          startsAt: new Date('2026-10-15T14:30:00Z'),
          endsAt: new Date('2026-10-15T18:30:00Z'),
          payAmountMinor: 100000,
          latitude: 41.0,
          longitude: 29.0,
          matchScore: 90,
        },
      ];

      const res = optimizeWorkerSchedule(jobs);

      // Optimal selection is j1 + j3 = ₺1,800, NOT j2 = ₺1,200!
      expect(res.selectedJobs).toHaveLength(2);
      expect(res.selectedJobs.map((j) => j.id)).toEqual(['j1', 'j3']);
      expect(res.totalEarningsMinor).toBe(180000);
      expect(res.totalWorkingMinutes).toBe(480); // 4h + 4h = 8h
      expect(res.efficiencyScore).toBeGreaterThan(0);
    });
  });
});
