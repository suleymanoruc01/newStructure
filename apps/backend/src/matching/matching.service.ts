import type {
  AvailabilityWindow,
  WorkerOccupation,
  WorkerProfile,
  WorkerSector,
} from '../generated/prisma/client.js';
import { computeWorkerCompletion } from '../workers/worker-profile.util.js';
import { haversineKm } from '../common/distance.util.js';
import { ISTANBUL_TIME_ZONE, istanbulCivil } from '../common/istanbul-civil.js';
import {
  availabilityCoversJob,
  jobRequiresNightShiftAvailability,
} from './job-availability-coverage.util.js';

type JobCandidate = {
  id: string;
  employerId: string;
  status: string;
  sectorCode: string;
  occupationCode: string | null;
  startsAt: Date;
  endsAt: Date;
  remainingHeadcount: number;
  favoritesOnly: boolean;
  genderFilter: string | null;
  minAge: number | null;
  maxAge: number | null;
  requiredDocumentTypes: string[];
  branchLatitude: number;
  branchLongitude: number;
};

export type MatchingContext = {
  favoredEmployerIds?: Set<string>;
  uploadedDocumentTypes?: Set<string>;
  timeZone?: string;
};

type WorkerContext = {
  profile: WorkerProfile;
  sectors: WorkerSector[];
  occupations: WorkerOccupation[];
  windows: AvailabilityWindow[];
};

export type EligibilityResult = {
  eligible: boolean;
  reasons: string[];
  matchReasons: string[];
  distanceKm: number | null;
  matchScore: number;
};

export function ageYearsAt(
  birthDate: Date,
  at: Date,
  timeZone: string = ISTANBUL_TIME_ZONE,
): number {
  const birth = istanbulCivil(birthDate, timeZone);
  const when = istanbulCivil(at, timeZone);
  let age = when.year - birth.year;
  if (
    when.month < birth.month ||
    (when.month === birth.month && when.day < birth.day)
  ) {
    age -= 1;
  }
  return age;
}

export function evaluateJobEligibility(
  job: JobCandidate,
  worker: WorkerContext,
  context?: MatchingContext,
): EligibilityResult {
  const timeZone = context?.timeZone ?? ISTANBUL_TIME_ZONE;
  const reasons: string[] = [];
  const matchReasons: string[] = [];

  const completion = computeWorkerCompletion({
    profile: worker.profile,
    windows: worker.windows,
    sectors: worker.sectors,
    occupations: worker.occupations,
  });
  if (!completion.complete) {
    reasons.push('profile_incomplete');
  }

  if (job.status !== 'published') {
    reasons.push('job_not_open');
  }
  if (job.remainingHeadcount <= 0) {
    reasons.push('no_seats');
  }
  if (job.startsAt.getTime() <= Date.now()) {
    reasons.push('job_started');
  }

  const sectorCodes = worker.sectors.map((s) => s.sectorCode);
  if (!sectorCodes.includes(job.sectorCode)) {
    reasons.push('sector_mismatch');
  } else {
    matchReasons.push('sector_match');
  }

  if (
    job.occupationCode &&
    !worker.occupations.some((o) => o.occupationCode === job.occupationCode)
  ) {
    reasons.push('occupation_mismatch');
  } else if (job.occupationCode) {
    matchReasons.push('occupation_match');
  }

  if (job.genderFilter && worker.profile.gender !== job.genderFilter) {
    reasons.push('gender_mismatch');
  }

  if (job.minAge !== null || job.maxAge !== null) {
    const birth = worker.profile.birthDate;
    const age = birth ? ageYearsAt(birth, job.startsAt, timeZone) : null;
    if (
      age === null ||
      (job.minAge !== null && age < job.minAge) ||
      (job.maxAge !== null && age > job.maxAge)
    ) {
      reasons.push('age_mismatch');
    }
  }

  if (job.favoritesOnly) {
    const favored = context?.favoredEmployerIds?.has(job.employerId) ?? false;
    if (!favored) {
      reasons.push('favorites_only');
    } else {
      matchReasons.push('favorites_match');
    }
  }

  for (const docType of job.requiredDocumentTypes) {
    if (!context?.uploadedDocumentTypes?.has(docType)) {
      reasons.push('document_required');
    }
  }

  const availabilityWindows = worker.windows.map((w) => ({
    dayOfWeek: w.dayOfWeek,
    startMinute: w.startMinute,
    endMinute: w.endMinute,
    crossesMidnight: w.crossesMidnight,
  }));
  if (
    !availabilityCoversJob(
      availabilityWindows,
      job.startsAt,
      job.endsAt,
      timeZone,
    )
  ) {
    reasons.push('availability_mismatch');
  } else {
    matchReasons.push('availability_match');
  }

  if (
    jobRequiresNightShiftAvailability(job.startsAt, job.endsAt, timeZone) &&
    !worker.profile.nightShiftAvailable
  ) {
    reasons.push('night_shift_unavailable');
  }

  let distanceKm: number | null = null;
  if (
    worker.profile.homeLatitude !== null &&
    worker.profile.homeLongitude !== null
  ) {
    distanceKm = haversineKm(
      Number(worker.profile.homeLatitude),
      Number(worker.profile.homeLongitude),
      job.branchLatitude,
      job.branchLongitude,
    );
    matchReasons.push('distance_ranked');
  }

  let matchScore = 0;
  if (reasons.length === 0) {
    let score = 50;
    if (distanceKm !== null) {
      const distAffinity = Math.round(30 * Math.exp(-distanceKm / 15));
      score += distAffinity;
    } else {
      score += 15;
    }

    if (
      job.occupationCode &&
      worker.occupations.some((o) => o.occupationCode === job.occupationCode)
    ) {
      score += 10;
    }

    if (context?.favoredEmployerIds?.has(job.employerId)) {
      score += 10;
    }

    matchScore = Math.min(100, Math.max(15, Math.round(score)));
  }

  return {
    eligible: reasons.length === 0,
    reasons,
    matchReasons,
    distanceKm,
    matchScore,
  };
}
