import { istanbulDayKey, weekDayKeys } from '../../shared/datetime/istanbul';
import { dockHidden, workerShiftRoute } from './dock-routes';

describe('dock routes', () => {
  it('hides the dock after a screen is pushed', () => {
    expect(dockHidden(0)).toBe(false);
    expect(dockHidden(undefined)).toBe(false);
    expect(dockHidden(1)).toBe(true);
  });

  it('sends an open confirm to availability and a finished shift nowhere', () => {
    expect(workerShiftRoute('awaiting_confirm')).toBe('WorkerShiftAvailability');
    expect(workerShiftRoute('can_come')).toBe('WorkerShiftCheckIn');
    expect(workerShiftRoute('checked_in')).toBe('WorkerShiftInShift');
    expect(workerShiftRoute('completed')).toBeNull();
  });

  it('keys the Istanbul civil day', () => {
    expect(istanbulDayKey('2026-01-11T21:30:00.000Z', 'Europe/Istanbul')).toBe(
      '2026-01-12',
    );
  });

  it('starts the week on Monday in Istanbul', () => {
    expect(weekDayKeys(new Date('2026-01-14T12:00:00.000Z'), 'Europe/Istanbul')).toEqual([
      '2026-01-12',
      '2026-01-13',
      '2026-01-14',
      '2026-01-15',
      '2026-01-16',
      '2026-01-17',
      '2026-01-18',
    ]);
  });
});