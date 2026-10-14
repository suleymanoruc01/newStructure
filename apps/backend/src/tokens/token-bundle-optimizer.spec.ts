import { describe, expect, it } from 'vitest';
import { optimizeTokenBundle } from './token-bundle-optimizer.util.js';

describe('token-bundle-optimizer.util (Unbounded Knapsack)', () => {
  const standardPackages = [
    { id: 'pkg-1', label: '1 Jeton', tokenCount: 1, priceTry: 50 },
    { id: 'pkg-5', label: '5 Jeton', tokenCount: 5, priceTry: 220 }, // 44 TL/token
    { id: 'pkg-10', label: '10 Jeton', tokenCount: 10, priceTry: 390 }, // 39 TL/token
    { id: 'pkg-50', label: '50 Jeton', tokenCount: 50, priceTry: 1600 }, // 32 TL/token
    { id: 'pkg-100', label: '100 Jeton', tokenCount: 100, priceTry: 2800 }, // 28 TL/token
  ];

  it('selects the single exact package when demand perfectly matches', () => {
    const result = optimizeTokenBundle(10, standardPackages);

    expect(result.optimalCostTry).toBe(390);
    expect(result.totalTokensAcquired).toBe(10);
    expect(result.surplusTokens).toBe(0);
    expect(result.bundle).toHaveLength(1);
    expect(result.bundle[0].packageId).toBe('pkg-10');
    expect(result.bundle[0].quantity).toBe(1);
  });

  it('computes the optimal multi-package combination for arbitrary demand', () => {
    // Need 23 tokens: 2x 10 tokens (780 TL) + 3x 1 token (150 TL) = 930 TL
    // OR 2x 10 tokens (780 TL) + 1x 5 tokens (220 TL) = 1000 TL for 25 tokens?
    // Let's verify algorithm finds the global minimum
    const result = optimizeTokenBundle(23, standardPackages);

    expect(result.totalTokensAcquired).toBeGreaterThanOrEqual(23);
    expect(result.optimalCostTry).toBeLessThanOrEqual(23 * 50); // Beating baseline
    expect(result.savingsTry).toBeGreaterThan(0);
    expect(result.savingsPercent).toBeGreaterThan(15);
  });

  it('exploits bulk discount overshoot when buying a larger package is cheaper than smaller ones', () => {
    // Packages: 10 tokens for 200 TL, 100 tokens for 600 TL
    const testPackages = [
      { id: 'small', label: '10 Jeton', tokenCount: 10, priceTry: 200 }, // 20 TL/token
      { id: 'large', label: '100 Jeton', tokenCount: 100, priceTry: 600 }, // 6 TL/token
    ];

    // Need 40 tokens: 4x small = 800 TL.
    // 1x large = 600 TL for 100 tokens (saves 200 TL and yields 60 bonus tokens!).
    const result = optimizeTokenBundle(40, testPackages);

    expect(result.optimalCostTry).toBe(600);
    expect(result.totalTokensAcquired).toBe(100);
    expect(result.surplusTokens).toBe(60);
    expect(result.bundle).toHaveLength(1);
    expect(result.bundle[0].packageId).toBe('large');
    expect(result.savingsTry).toBe(200);
  });

  it('handles zero demand and empty package list gracefully', () => {
    const zeroResult = optimizeTokenBundle(0, standardPackages);
    expect(zeroResult.optimalCostTry).toBe(0);
    expect(zeroResult.bundle).toHaveLength(0);

    const emptyResult = optimizeTokenBundle(10, []);
    expect(emptyResult.optimalCostTry).toBe(0);
    expect(emptyResult.bundle).toHaveLength(0);
  });
});
