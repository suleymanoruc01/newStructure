import { describe, expect, it } from 'vitest';
import {
  generateRecurringShiftMatrix,
  parseLocalTimeToMinutes,
  type RecurringScheduleTemplate,
} from './recurring-schedule.util.js';
import type { AvailablePackage } from '../tokens/token-bundle-optimizer.util.js';

describe('recurring-schedule.util', () => {
  describe('parseLocalTimeToMinutes', () => {
    it('parses valid 24h time strings to total minutes', () => {
      expect(parseLocalTimeToMinutes('00:00')).toBe(0);
      expect(parseLocalTimeToMinutes('08:30')).toBe(510);
      expect(parseLocalTimeToMinutes('18:00')).toBe(1080);
      expect(parseLocalTimeToMinutes('23:59')).toBe(1439);
    });

    it('throws error on malformed time strings', () => {
      expect(() => parseLocalTimeToMinutes('bad-time')).toThrow('Invalid time format');
      expect(() => parseLocalTimeToMinutes('12')).toThrow('Invalid time format');
    });
  });

  describe('generateRecurringShiftMatrix', () => {
    const template: RecurringScheduleTemplate = {
      jobTitle: 'Hafta Sonu Barista',
      branchIds: ['branch-kadikoy', 'branch-besiktas'],
      occupationCode: 'barista',
      requiredHeadcountPerBranch: 2,
      startTimeLocal: '18:00',
      endTimeLocal: '23:00', // 5 hours
      baseHourlyRateTry: 200,
      daysOfWeek: [5, 6], // Friday and Saturday
    };

    const mockTokenPackages: AvailablePackage[] = [
      { id: 'p-1', label: '1 Jeton', tokenCount: 1, priceTry: 50 },
      { id: 'p-10', label: '10 Jeton', tokenCount: 10, priceTry: 400 },
      { id: 'p-50', label: '50 Jeton', tokenCount: 50, priceTry: 1750 },
    ];

    it('generates exact matrix for 2 branches over 2 weeks (8 occurrences, 16 seats)', () => {
      // Starting from a Friday (2026-10-16)
      const result = generateRecurringShiftMatrix(template, {
        startDateIso: '2026-10-16',
        weeksCount: 2,
        availableTokenPackages: mockTokenPackages,
      });

      // 2 weeks x 2 days/week (Fri, Sat) = 4 calendar dates
      // 4 calendar dates x 2 branches = 8 occurrences
      expect(result.totalOccurrences).toBe(8);
      // 8 occurrences x 2 headcount = 16 seats
      expect(result.totalShiftSeats).toBe(16);
      // 5h duration x 200 TL = 1000 TL per seat x 16 seats = 16,000 TL
      expect(result.totalLaborBudgetTry).toBe(16000);

      // Verify token bundle optimization
      expect(result.tokenOptimization).toBeDefined();
      expect(result.tokenOptimization?.requiredTokens).toBe(16);
      expect(result.tokenOptimization?.optimalCostTry).toBeGreaterThan(0);
    });

    it('correctly calculates overnight shifts past midnight (22:00 to 04:00 = 6 hours)', () => {
      const overnightTemplate: RecurringScheduleTemplate = {
        ...template,
        branchIds: ['branch-1'],
        startTimeLocal: '22:00',
        endTimeLocal: '04:00', // overnight
        daysOfWeek: [5], // Friday only
      };

      const result = generateRecurringShiftMatrix(overnightTemplate, {
        startDateIso: '2026-10-16',
        weeksCount: 1,
      });

      expect(result.totalOccurrences).toBe(1);
      const occurrence = result.occurrences[0];
      expect(occurrence.durationHours).toBe(6);

      const start = new Date(occurrence.startsAt);
      const end = new Date(occurrence.endsAt);
      const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      expect(diffHours).toBe(6);
    });

    it('skips excluded dates (e.g. holidays or venue maintenance)', () => {
      const result = generateRecurringShiftMatrix(template, {
        startDateIso: '2026-10-16',
        weeksCount: 1,
        excludedDateKeys: ['2026-10-16'], // Exclude Friday
      });

      // Only Saturday remains (1 date x 2 branches = 2 occurrences)
      expect(result.totalOccurrences).toBe(2);
      expect(result.occurrences.every((o) => o.dateKey === '2026-10-17')).toBe(true);
    });
  });
});
