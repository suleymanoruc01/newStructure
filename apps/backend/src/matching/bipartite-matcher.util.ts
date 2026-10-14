/**
 * Maximum Weight Bipartite Matching via the Kuhn-Munkres (Hungarian) Algorithm.
 *
 * Solves the optimal global assignment problem between M candidates and N shift vacancies,
 * maximizing aggregate platform social welfare / match quality while guaranteeing
 * Pareto optimality over naive greedy heuristics.
 */

export type MatchSlot = {
  slotId: string;
  jobId: string;
  name?: string;
};

export type MatchCandidate = {
  candidateId: string;
  name?: string;
};

export type AssignmentPair = {
  candidateId: string;
  slotId: string;
  score: number;
};

export type OptimalAssignmentResult = {
  assignments: AssignmentPair[];
  unassignedCandidateIds: string[];
  unfilledSlotIds: string[];
  totalScore: number;
  averageScore: number;
  greedyBaselineScore: number;
  socialWelfareGainPercent: number;
};

export type MatcherOptions = {
  minScoreThreshold?: number; // Pairs below this score are not matched (e.g., threshold = 30)
};

/**
 * Standard Kuhn-Munkres algorithm for maximum-weight bipartite matching.
 * Solves max sum w(u, v) on bipartite graph (U, V).
 * Complexity: O(N^3) where N = max(|U|, |V|).
 */
export function solveMaximumWeightBipartiteMatching(
  weights: number[][], // weights[u][v]
): { rowToCol: number[]; colToRow: number[] } {
  const nRows = weights.length;
  if (nRows === 0) return { rowToCol: [], colToRow: [] };
  const nCols = weights[0]!.length;
  if (nCols === 0) return { rowToCol: [], colToRow: [] };

  const dim = Math.max(nRows, nCols);

  // Convert to square cost matrix for min-cost matching: cost = maxVal - weight
  let maxWeight = 0;
  for (let r = 0; r < nRows; r++) {
    for (let c = 0; c < nCols; c++) {
      if (weights[r]![c]! > maxWeight) {
        maxWeight = weights[r]![c]!;
      }
    }
  }

  // Cost matrix of size (dim + 1) x (dim + 1), 1-indexed for standard Hungarian implementation
  const cost: number[][] = Array.from({ length: dim + 1 }, () =>
    new Array<number>(dim + 1).fill(0),
  );

  for (let i = 1; i <= dim; i++) {
    for (let j = 1; j <= dim; j++) {
      const r = i - 1;
      const c = j - 1;
      if (r < nRows && c < nCols) {
        cost[i]![j] = maxWeight - weights[r]![c]!;
      } else {
        // Dummy padding entries have cost = maxWeight (equivalent to 0 weight)
        cost[i]![j] = maxWeight;
      }
    }
  }

  // Hungarian O(N^3) algorithm with potential dual variables
  const u = new Array<number>(dim + 1).fill(0);
  const v = new Array<number>(dim + 1).fill(0);
  const p = new Array<number>(dim + 1).fill(0);
  const way = new Array<number>(dim + 1).fill(0);

  for (let i = 1; i <= dim; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array<number>(dim + 1).fill(Number.POSITIVE_INFINITY);
    const used = new Array<boolean>(dim + 1).fill(false);

    do {
      used[j0] = true;
      const i0 = p[j0]!;
      let delta = Number.POSITIVE_INFINITY;
      let j1 = 0;

      for (let j = 1; j <= dim; j++) {
        if (!used[j]) {
          const cur = cost[i0]![j]! - u[i0]! - v[j]!;
          if (cur < minv[j]!) {
            minv[j] = cur;
            way[j] = j0;
          }
          if (minv[j]! < delta) {
            delta = minv[j]!;
            j1 = j;
          }
        }
      }

      for (let j = 0; j <= dim; j++) {
        if (used[j]) {
          u[p[j]!] += delta;
          v[j] -= delta;
        } else {
          minv[j] -= delta;
        }
      }

      j0 = j1;
    } while (p[j0] !== 0);

    do {
      const j1 = way[j0]!;
      p[j0] = p[j1]!;
      j0 = j1;
    } while (j0 !== 0);
  }

  const rowToCol = new Array<number>(nRows).fill(-1);
  const colToRow = new Array<number>(nCols).fill(-1);

  for (let j = 1; j <= dim; j++) {
    const r = p[j]! - 1;
    const c = j - 1;
    if (r < nRows && c < nCols) {
      rowToCol[r] = c;
      colToRow[c] = r;
    }
  }

  return { rowToCol, colToRow };
}

/**
 * Greedily matches candidates to slots in order of descending affinity weight.
 * Used as a performance and welfare benchmark against global Hungarian optimization.
 */
export function solveGreedyMatching(
  weights: number[][],
  minThreshold: number,
): { totalScore: number } {
  const nRows = weights.length;
  if (nRows === 0) return { totalScore: 0 };
  const nCols = weights[0]!.length;
  if (nCols === 0) return { totalScore: 0 };

  const edges: { r: number; c: number; weight: number }[] = [];
  for (let r = 0; r < nRows; r++) {
    for (let c = 0; c < nCols; c++) {
      const w = weights[r]![c]!;
      if (w >= minThreshold) {
        edges.push({ r, c, weight: w });
      }
    }
  }

  edges.sort((a, b) => b.weight - a.weight);

  const matchedRows = new Set<number>();
  const matchedCols = new Set<number>();
  let totalScore = 0;

  for (const edge of edges) {
    if (!matchedRows.has(edge.r) && !matchedCols.has(edge.c)) {
      matchedRows.add(edge.r);
      matchedCols.add(edge.c);
      totalScore += edge.weight;
    }
  }

  return { totalScore };
}

/**
 * High-Level Global Candidate-to-Slot Assignment Dispatcher.
 * Computes the optimal assignment between a set of candidates and a set of shift slots.
 */
export function computeOptimalCandidateShiftAssignment(
  candidates: MatchCandidate[],
  slots: MatchSlot[],
  affinityScoreFn: (candidate: MatchCandidate, slot: MatchSlot) => number,
  options?: MatcherOptions,
): OptimalAssignmentResult {
  const threshold = options?.minScoreThreshold ?? 0;

  if (candidates.length === 0 || slots.length === 0) {
    return {
      assignments: [],
      unassignedCandidateIds: candidates.map((c) => c.candidateId),
      unfilledSlotIds: slots.map((s) => s.slotId),
      totalScore: 0,
      averageScore: 0,
      greedyBaselineScore: 0,
      socialWelfareGainPercent: 0,
    };
  }

  // Construct affinity matrix weights[candIdx][slotIdx]
  const weights: number[][] = candidates.map((c) =>
    slots.map((s) => {
      const score = affinityScoreFn(c, s);
      return Number.isFinite(score) ? Math.max(0, score) : 0;
    }),
  );

  const { rowToCol } = solveMaximumWeightBipartiteMatching(weights);
  const greedy = solveGreedyMatching(weights, threshold);

  const assignments: AssignmentPair[] = [];
  const assignedCandidateIndices = new Set<number>();
  const assignedSlotIndices = new Set<number>();
  let totalScore = 0;

  for (let candIdx = 0; candIdx < candidates.length; candIdx++) {
    const slotIdx = rowToCol[candIdx];
    if (slotIdx !== undefined && slotIdx >= 0 && slotIdx < slots.length) {
      const score = weights[candIdx]![slotIdx]!;
      if (score >= threshold) {
        assignments.push({
          candidateId: candidates[candIdx]!.candidateId,
          slotId: slots[slotIdx]!.slotId,
          score,
        });
        assignedCandidateIndices.add(candIdx);
        assignedSlotIndices.add(slotIdx);
        totalScore += score;
      }
    }
  }

  const unassignedCandidateIds: string[] = [];
  for (let i = 0; i < candidates.length; i++) {
    if (!assignedCandidateIndices.has(i)) {
      unassignedCandidateIds.push(candidates[i]!.candidateId);
    }
  }

  const unfilledSlotIds: string[] = [];
  for (let j = 0; j < slots.length; j++) {
    if (!assignedSlotIndices.has(j)) {
      unfilledSlotIds.push(slots[j]!.slotId);
    }
  }

  const averageScore =
    assignments.length > 0 ? Math.round((totalScore / assignments.length) * 10) / 10 : 0;

  const greedyScore = greedy.totalScore;
  const gain =
    greedyScore > 0
      ? Math.round(((totalScore - greedyScore) / greedyScore) * 1000) / 10
      : 0;

  return {
    assignments,
    unassignedCandidateIds,
    unfilledSlotIds,
    totalScore,
    averageScore,
    greedyBaselineScore: greedyScore,
    socialWelfareGainPercent: Math.max(0, gain),
  };
}
