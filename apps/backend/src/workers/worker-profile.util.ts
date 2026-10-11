import type { AvailabilityWindow, WorkerOccupation, WorkerProfile, WorkerSector } from '../generated/prisma/client.js';

export function computeWorkerCompletion(input: {
  profile: WorkerProfile;
  windows: AvailabilityWindow[];
  sectors: WorkerSector[];
  occupations: WorkerOccupation[];
}): { complete: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!input.profile.firstName || !input.profile.lastName) {
    missing.push('name');
  }
  if (!input.profile.birthDate) {
    missing.push('birthDate');
  }
  if (!input.profile.gender) {
    missing.push('gender');
  }
  if (
    input.profile.homeLatitude === null ||
    input.profile.homeLongitude === null
  ) {
    missing.push('homeLocation');
  }
  if (input.sectors.length === 0) {
    missing.push('sectors');
  }
  if (input.windows.length === 0) {
    missing.push('availability');
  }
  return { complete: missing.length === 0, missing };
}
