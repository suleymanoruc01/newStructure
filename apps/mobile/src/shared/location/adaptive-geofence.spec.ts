import {
  computeAdaptivePollingIntervalSec,
  getProximityBand,
} from './adaptive-geofence';

describe('adaptive-geofence', () => {
  describe('computeAdaptivePollingIntervalSec', () => {
    it('returns sparse interval when shift is > 3 hours away', () => {
      const normal = computeAdaptivePollingIntervalSec({
        distanceM: 500,
        minutesUntilShift: 240,
        isLowBattery: false,
      });
      expect(normal).toBe(900); // 15 mins

      const lowBattery = computeAdaptivePollingIntervalSec({
        distanceM: 500,
        minutesUntilShift: 240,
        isLowBattery: true,
      });
      expect(lowBattery).toBe(1800); // 30 mins
    });

    it('returns high-frequency interval (5s) when at venue within check-in window', () => {
      const interval = computeAdaptivePollingIntervalSec({
        distanceM: 40,
        minutesUntilShift: 20,
        isLowBattery: false,
      });
      expect(interval).toBe(5);
    });

    it('returns near-perimeter interval (15s) when within 1km', () => {
      const interval = computeAdaptivePollingIntervalSec({
        distanceM: 600,
        minutesUntilShift: 45,
        isLowBattery: false,
      });
      expect(interval).toBe(15);
    });

    it('scales interval smoothly for transit distances (> 5km)', () => {
      const interval = computeAdaptivePollingIntervalSec({
        distanceM: 10000,
        minutesUntilShift: 60,
        isLowBattery: false,
      });
      expect(interval).toBe(200);
    });
  });

  describe('getProximityBand', () => {
    it('categorizes distance bands correctly', () => {
      expect(getProximityBand(50)).toBe('at_venue');
      expect(getProximityBand(500)).toBe('nearby');
      expect(getProximityBand(3000)).toBe('in_transit');
      expect(getProximityBand(12000)).toBe('far');
    });
  });
});
