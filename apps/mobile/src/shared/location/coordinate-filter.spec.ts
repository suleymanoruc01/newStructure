import { CoordinateFilter } from './coordinate-filter';

describe('CoordinateFilter', () => {
  it('initializes with the first coordinate sample', () => {
    const filter = new CoordinateFilter();
    const result = filter.update(41.0082, 28.9784, 10);
    expect(result.latitude).toBeCloseTo(41.0082, 4);
    expect(result.longitude).toBeCloseTo(28.9784, 4);
    expect(result.accuracyM).toBe(10);
  });

  it('dampens sudden outlier GPS drift spikes with high variance', () => {
    const filter = new CoordinateFilter();
    // Establish stable baseline (e.g. 3 good readings)
    filter.update(41.0082, 28.9784, 5);
    filter.update(41.00821, 28.97841, 5);
    filter.update(41.00822, 28.97842, 5);

    // Sudden outlier spike with high accuracy uncertainty (e.g. GPS bounce in mall)
    const spike = filter.update(41.015, 28.985, 40);

    // Filtered coordinates should reject the jump and stay very close to true position
    expect(spike.latitude).toBeLessThan(41.009);
    expect(spike.longitude).toBeLessThan(28.979);
  });

  it('resets cleanly when reset() is called', () => {
    const filter = new CoordinateFilter();
    filter.update(41.0082, 28.9784, 10);
    filter.reset();
    const result = filter.update(40.98, 29.02, 8);
    expect(result.latitude).toBe(40.98);
    expect(result.longitude).toBe(29.02);
  });
});
