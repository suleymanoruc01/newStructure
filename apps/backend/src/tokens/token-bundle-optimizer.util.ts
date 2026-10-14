/**
 * Unbounded Knapsack Optimal Token Package Bundle Optimizer.
 *
 * Given an employer's token quota requirement K (e.g. for staffing upcoming shifts)
 * and active TokenPackage configurations, computes the exact combination of packages
 * that satisfies the token demand at the absolute minimum TRY expense.
 *
 * Implements 1D Dynamic Programming with state-backtracking: O(K * N).
 */

export type AvailablePackage = {
  id: string;
  label: string;
  tokenCount: number;
  priceTry: number;
  discountPercent?: number;
};

export type BundleItem = {
  packageId: string;
  label: string;
  unitTokenCount: number;
  unitPriceTry: number;
  quantity: number;
  subtotalTokens: number;
  subtotalCostTry: number;
};

export type OptimalTokenBundleResult = {
  targetTokensRequired: number;
  totalTokensAcquired: number;
  surplusTokens: number;
  optimalCostTry: number;
  effectiveCostPerTokenTry: number;
  baselineCostTry: number; // Cost if buying smallest unit package repeatedly
  savingsTry: number;
  savingsPercent: number;
  bundle: BundleItem[];
};

export function optimizeTokenBundle(
  requiredTokens: number,
  packages: AvailablePackage[],
): OptimalTokenBundleResult {
  const K = Math.max(0, Math.round(requiredTokens));

  // Filter valid packages with positive tokens and price
  const validPkgs = packages.filter((p) => p.tokenCount > 0 && p.priceTry > 0);

  if (K === 0 || validPkgs.length === 0) {
    return {
      targetTokensRequired: K,
      totalTokensAcquired: 0,
      surplusTokens: 0,
      optimalCostTry: 0,
      effectiveCostPerTokenTry: 0,
      baselineCostTry: 0,
      savingsTry: 0,
      savingsPercent: 0,
      bundle: [],
    };
  }

  // Find max token capacity across all packages to bound the search space
  let maxPkgTokens = 0;
  for (const pkg of validPkgs) {
    if (pkg.tokenCount > maxPkgTokens) {
      maxPkgTokens = pkg.tokenCount;
    }
  }

  // Search horizon: up to K + maxPkgTokens (overshooting could be cheaper due to bulk discounts)
  const maxTarget = K + maxPkgTokens;

  // dp[t] = minimum cost to achieve exactly t tokens
  const dp: number[] = new Array<number>(maxTarget + 1).fill(Number.POSITIVE_INFINITY);
  const choice: number[] = new Array<number>(maxTarget + 1).fill(-1);

  dp[0] = 0;

  for (let t = 1; t <= maxTarget; t++) {
    for (let i = 0; i < validPkgs.length; i++) {
      const pkg = validPkgs[i]!;
      const prev = Math.max(0, t - pkg.tokenCount);
      const cost = dp[prev]! + pkg.priceTry;
      if (cost < dp[t]!) {
        dp[t] = cost;
        choice[t] = i;
      }
    }
  }

  // Find the minimal cost across all amounts >= K
  let bestTarget = K;
  let minCost = Number.POSITIVE_INFINITY;

  for (let t = K; t <= maxTarget; t++) {
    if (dp[t]! < minCost) {
      minCost = dp[t]!;
      bestTarget = t;
    }
  }

  // Backtrack to assemble bundle items
  const counts = new Map<number, number>();
  let curr = bestTarget;

  while (curr > 0 && choice[curr]! >= 0) {
    const pkgIdx = choice[curr]!;
    const pkg = validPkgs[pkgIdx]!;
    counts.set(pkgIdx, (counts.get(pkgIdx) ?? 0) + 1);
    curr = Math.max(0, curr - pkg.tokenCount);
  }

  const bundle: BundleItem[] = [];
  let totalTokensAcquired = 0;
  let optimalCostTry = 0;

  for (const [pkgIdx, quantity] of counts.entries()) {
    const pkg = validPkgs[pkgIdx]!;
    const subtotalTokens = quantity * pkg.tokenCount;
    const subtotalCostTry = quantity * pkg.priceTry;

    bundle.push({
      packageId: pkg.id,
      label: pkg.label,
      unitTokenCount: pkg.tokenCount,
      unitPriceTry: pkg.priceTry,
      quantity,
      subtotalTokens,
      subtotalCostTry,
    });

    totalTokensAcquired += subtotalTokens;
    optimalCostTry += subtotalCostTry;
  }

  // Sort bundle by package token count descending for clean presentation
  bundle.sort((a, b) => b.unitTokenCount - a.unitTokenCount);

  // Baseline comparison: smallest unit package cost per token
  const sortedByUnit = [...validPkgs].sort((a, b) => a.tokenCount - b.tokenCount);
  const smallest = sortedByUnit[0]!;
  const baselineCostTry = Math.ceil(K / smallest.tokenCount) * smallest.priceTry;

  const savingsTry = Math.max(0, baselineCostTry - optimalCostTry);
  const savingsPercent =
    baselineCostTry > 0
      ? Math.round((savingsTry / baselineCostTry) * 1000) / 10
      : 0;

  const effectiveCostPerTokenTry =
    totalTokensAcquired > 0
      ? Math.round((optimalCostTry / totalTokensAcquired) * 100) / 100
      : 0;

  return {
    targetTokensRequired: K,
    totalTokensAcquired,
    surplusTokens: totalTokensAcquired - K,
    optimalCostTry,
    effectiveCostPerTokenTry,
    baselineCostTry,
    savingsTry,
    savingsPercent,
    bundle,
  };
}
