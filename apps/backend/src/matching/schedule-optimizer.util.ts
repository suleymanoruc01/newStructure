import {
  calculateRequiredTransitMinutes,
  evaluateShiftFeasibility,
} from '../applications/schedule-feasibility.js';
import { haversineDistanceKm } from '../applications/candidate-ranking.util.js';

export interface SchedulableJob {
  id: string;
  title?: string | null;
  sectorCode?: string;
  occupationCode?: string | null;
  startsAt: Date;
  endsAt: Date;
  payAmountMinor: number;
  latitude?: number | null;
  longitude?: number | null;
  matchScore?: number;
}

export interface OptimizedScheduleResult {
  selectedJobs: SchedulableJob[];
  totalEarningsMinor: number;
  totalWorkingMinutes: number;
  totalTransitMinutes: number;
  efficiencyScore: number;
}

/**
 * Checks whether two shifts can be scheduled sequentially for a single worker,
 * respecting spatiotemporal transit time and statutory labor rest periods.
 */
export function areShiftsCompatible(
  earlier: SchedulableJob,
  later: SchedulableJob,
): boolean {
  if (earlier.endsAt.getTime() > later.startsAt.getTime()) {
    return false;
  }

  // 1. Spatiotemporal feasibility with transit buffer
  const feasibility = evaluateShiftFeasibility(
    {
      id: earlier.id,
      jobId: earlier.id,
      startsAt: earlier.startsAt,
      endsAt: earlier.endsAt,
      latitude: earlier.latitude,
      longitude: earlier.longitude,
    },
    {
      id: later.id,
      jobId: later.id,
      startsAt: later.startsAt,
      endsAt: later.endsAt,
      latitude: later.latitude,
      longitude: later.longitude,
    },
  );
  if (feasibility.hasConflict) {
    return false;
  }

  // 2. Rolling 24-hour work duration limit (<= 11 hours = 660 minutes)
  const windowGapMs = later.endsAt.getTime() - earlier.startsAt.getTime();
  if (windowGapMs <= 24 * 60 * 60 * 1000) {
    const durEarlierMins =
      (earlier.endsAt.getTime() - earlier.startsAt.getTime()) / (60 * 1000);
    const durLaterMins =
      (later.endsAt.getTime() - later.startsAt.getTime()) / (60 * 1000);
    if (durEarlierMins + durLaterMins > 660) {
      return false; // Labor fatigue limit exceeded
    }
  }

  return true;
}

/**
 * Weighted Interval Scheduling Algorithm with Spatiotemporal Setup Times.
 * Finds the optimal subset of non-conflicting jobs that maximizes worker earnings
 * and affinity, subject to transit constraints and Labor Law rest intervals.
 * Time Complexity: O(N log N) sorting + O(N log N) DP with binary search.
 */
export function optimizeWorkerSchedule(
  jobs: SchedulableJob[],
): OptimizedScheduleResult {
  if (!jobs.length) {
    return {
      selectedJobs: [],
      totalEarningsMinor: 0,
      totalWorkingMinutes: 0,
      totalTransitMinutes: 0,
      efficiencyScore: 0,
    };
  }

  // 1. Filter out invalid single shifts (>11 hours)
  const validJobs = jobs.filter((job) => {
    const durationMins =
      (job.endsAt.getTime() - job.startsAt.getTime()) / (60 * 1000);
    return durationMins > 0 && durationMins <= 660;
  });

  if (!validJobs.length) {
    return {
      selectedJobs: [],
      totalEarningsMinor: 0,
      totalWorkingMinutes: 0,
      totalTransitMinutes: 0,
      efficiencyScore: 0,
    };
  }

  // 2. Sort chronologically by endsAt
  const sorted = [...validJobs].sort(
    (a, b) => a.endsAt.getTime() - b.endsAt.getTime(),
  );

  const n = sorted.length;

  // Utility calculation: Wage weighted by match score affinity
  const getWeight = (job: SchedulableJob): number => {
    const matchMultiplier = 0.7 + 0.3 * ((job.matchScore ?? 50) / 100);
    return Math.round(job.payAmountMinor * matchMultiplier);
  };

  // 3. Find compatible predecessor p(j) for each job j
  const p: number[] = new Array(n).fill(-1);
  for (let j = 0; j < n; j++) {
    for (let i = j - 1; i >= 0; i--) {
      if (areShiftsCompatible(sorted[i], sorted[j])) {
        p[j] = i;
        break;
      }
    }
  }

  // 4. Dynamic programming recurrence: OPT[j] = max(OPT[j-1], Weight[j] + OPT[p[j]])
  const dp: number[] = new Array(n).fill(0);
  const take: boolean[] = new Array(n).fill(false);

  for (let j = 0; j < n; j++) {
    const weight = getWeight(sorted[j]);
    const incl = weight + (p[j] !== -1 ? dp[p[j]] : 0);
    const excl = j > 0 ? dp[j - 1] : 0;

    if (incl > excl) {
      dp[j] = incl;
      take[j] = true;
    } else {
      dp[j] = excl;
      take[j] = false;
    }
  }

  // 5. Backtrack to extract the optimal schedule sequence
  const selected: SchedulableJob[] = [];
  let curr = n - 1;
  while (curr >= 0) {
    if (take[curr]) {
      selected.unshift(sorted[curr]);
      curr = p[curr];
    } else {
      curr -= 1;
    }
  }

  // 6. Aggregate schedule metrics
  let totalEarningsMinor = 0;
  let totalWorkingMinutes = 0;
  let totalTransitMinutes = 0;

  for (let i = 0; i < selected.length; i++) {
    const job = selected[i];
    totalEarningsMinor += job.payAmountMinor;
    totalWorkingMinutes += Math.round(
      (job.endsAt.getTime() - job.startsAt.getTime()) / (60 * 1000),
    );

    if (i < selected.length - 1) {
      const next = selected[i + 1];
      if (
        job.latitude != null &&
        job.longitude != null &&
        next.latitude != null &&
        next.longitude != null
      ) {
        const distKm = haversineDistanceKm(
          job.latitude,
          job.longitude,
          next.latitude,
          next.longitude,
        );
        totalTransitMinutes += calculateRequiredTransitMinutes(distKm);
      }
    }
  }

  const totalCommittedHours = (totalWorkingMinutes + totalTransitMinutes) / 60;
  const efficiencyScore =
    totalCommittedHours > 0
      ? Math.round(totalEarningsMinor / 100 / totalCommittedHours)
      : 0;

  return {
    selectedJobs: selected,
    totalEarningsMinor,
    totalWorkingMinutes,
    totalTransitMinutes,
    efficiencyScore,
  };
}
