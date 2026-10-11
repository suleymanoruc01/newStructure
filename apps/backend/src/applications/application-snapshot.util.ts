import type { ApplicationProfileSnapshot } from '@parton/api-contracts';

type WorkerRow = {
  firstName: string | null;
  lastName: string | null;
  birthDate: Date | null;
  gender: string | null;
  sectors: { sectorCode: string }[];
  occupations: { occupationCode: string }[];
};

export function buildProfileSnapshot(
  worker: WorkerRow,
): ApplicationProfileSnapshot {
  return {
    firstName: worker.firstName,
    lastName: worker.lastName,
    birthDate: worker.birthDate
      ? worker.birthDate.toISOString().slice(0, 10)
      : null,
    gender: worker.gender,
    sectorCodes: worker.sectors.map((s) => s.sectorCode),
    occupationCodes: worker.occupations.map((o) => o.occupationCode),
    capturedAt: new Date().toISOString(),
  };
}

export function workerDisplayName(snapshot: ApplicationProfileSnapshot): string {
  const parts = [snapshot.firstName, snapshot.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : 'İş arayan';
}
