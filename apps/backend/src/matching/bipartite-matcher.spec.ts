import { describe, expect, it } from 'vitest';
import {
  computeOptimalCandidateShiftAssignment,
  solveGreedyMatching,
  solveMaximumWeightBipartiteMatching,
} from './bipartite-matcher.util.js';

describe('bipartite-matcher.util (Kuhn-Munkres Algorithm)', () => {
  it('solves 2x2 maximum weight assignment and outperforms naive greedy heuristics', () => {
    // Worker 0: Slot 0 = 95, Slot 1 = 90
    // Worker 1: Slot 0 = 92, Slot 1 = 40
    const weights = [
      [95, 90],
      [92, 40],
    ];

    const greedy = solveGreedyMatching(weights, 0);
    expect(greedy.totalScore).toBe(95 + 40); // 135

    const { rowToCol } = solveMaximumWeightBipartiteMatching(weights);
    // Worker 0 should be assigned to Slot 1 (90)
    // Worker 1 should be assigned to Slot 0 (92)
    expect(rowToCol[0]).toBe(1);
    expect(rowToCol[1]).toBe(0);

    const optimalSum = weights[0]![rowToCol[0]!]! + weights[1]![rowToCol[1]!]!;
    expect(optimalSum).toBe(182);
    expect(optimalSum).toBeGreaterThan(greedy.totalScore);
  });

  it('handles asymmetric candidate > slots rectangular matching (M=4, N=2)', () => {
    const candidates = [
      { candidateId: 'cand-1', name: 'Ayşe' },
      { candidateId: 'cand-2', name: 'Mehmet' },
      { candidateId: 'cand-3', name: 'Zeynep' },
      { candidateId: 'cand-4', name: 'Can' },
    ];

    const slots = [
      { slotId: 'slot-1', jobId: 'job-A' },
      { slotId: 'slot-2', jobId: 'job-B' },
    ];

    const affinity = (c: { candidateId: string }, s: { slotId: string }) => {
      if (c.candidateId === 'cand-1') return s.slotId === 'slot-1' ? 88 : 70;
      if (c.candidateId === 'cand-2') return s.slotId === 'slot-1' ? 95 : 60;
      if (c.candidateId === 'cand-3') return s.slotId === 'slot-1' ? 80 : 92;
      return 50; // cand-4
    };

    const result = computeOptimalCandidateShiftAssignment(candidates, slots, affinity);

    expect(result.assignments).toHaveLength(2);
    expect(result.unfilledSlotIds).toHaveLength(0);
    expect(result.unassignedCandidateIds).toHaveLength(2);

    // Mehmet (cand-2) has 95 on slot-1, Zeynep (cand-3) has 92 on slot-2
    const slot1Match = result.assignments.find((a) => a.slotId === 'slot-1');
    const slot2Match = result.assignments.find((a) => a.slotId === 'slot-2');
    expect(slot1Match?.candidateId).toBe('cand-2');
    expect(slot2Match?.candidateId).toBe('cand-3');
    expect(result.totalScore).toBe(95 + 92);
  });

  it('handles asymmetric slots > candidates rectangular matching (M=2, N=3)', () => {
    const candidates = [
      { candidateId: 'cand-1' },
      { candidateId: 'cand-2' },
    ];

    const slots = [
      { slotId: 'slot-A', jobId: 'job-1' },
      { slotId: 'slot-B', jobId: 'job-1' },
      { slotId: 'slot-C', jobId: 'job-2' },
    ];

    const affinity = (c: { candidateId: string }, s: { slotId: string }) => {
      if (c.candidateId === 'cand-1') return s.slotId === 'slot-A' ? 85 : 50;
      return s.slotId === 'slot-C' ? 90 : 40;
    };

    const result = computeOptimalCandidateShiftAssignment(candidates, slots, affinity);
    expect(result.assignments).toHaveLength(2);
    expect(result.unassignedCandidateIds).toHaveLength(0);
    expect(result.unfilledSlotIds).toHaveLength(1);
    expect(result.unfilledSlotIds).toContain('slot-B');
    expect(result.totalScore).toBe(85 + 90);
  });

  it('prunes pairings that fall below minimum quality threshold', () => {
    const candidates = [{ candidateId: 'cand-poor' }];
    const slots = [{ slotId: 'slot-1', jobId: 'job-1' }];

    const result = computeOptimalCandidateShiftAssignment(
      candidates,
      slots,
      () => 20, // Low score 20
      { minScoreThreshold: 50 },
    );

    expect(result.assignments).toHaveLength(0);
    expect(result.unassignedCandidateIds).toEqual(['cand-poor']);
    expect(result.unfilledSlotIds).toEqual(['slot-1']);
    expect(result.totalScore).toBe(0);
  });

  it('handles empty inputs without throwing errors', () => {
    const emptyResult = computeOptimalCandidateShiftAssignment([], [], () => 0);
    expect(emptyResult.assignments).toHaveLength(0);
    expect(emptyResult.totalScore).toBe(0);
    expect(emptyResult.socialWelfareGainPercent).toBe(0);
  });
});
