import { HttpStatus } from '@nestjs/common';
import { ErrorCode } from '@parton/api-contracts';

import { ApiException } from './api.exception.js';

export type JobSite = {
  name: string;
  city: string | null;
  latitude: number;
  longitude: number;
};

type GeoRow = {
  name?: string;
  legalName?: string;
  tradingName?: string | null;
  city?: string | null;
  latitude: unknown;
  longitude: unknown;
};

function coords(row: { latitude: unknown; longitude: unknown }) {
  if (row.latitude == null || row.longitude == null) {
    return null;
  }
  return { latitude: Number(row.latitude), longitude: Number(row.longitude) };
}

export function jobSiteFrom(job: {
  branch: GeoRow | null;
  employer: GeoRow;
}): JobSite | null {
  if (job.branch) {
    const pin = coords(job.branch);
    if (!pin) {
      return null;
    }
    return {
      name: job.branch.name ?? 'Şube',
      city: job.branch.city ?? null,
      ...pin,
    };
  }
  const pin = coords(job.employer);
  if (!pin) {
    return null;
  }
  return {
    name: job.employer.tradingName ?? job.employer.legalName ?? 'İşyeri',
    city: job.employer.city ?? null,
    ...pin,
  };
}

export function requireJobSite(job: {
  branch: GeoRow | null;
  employer: GeoRow;
}): JobSite {
  const site = jobSiteFrom(job);
  if (!site) {
    throw new ApiException(
      HttpStatus.UNPROCESSABLE_ENTITY,
      ErrorCode.VALIDATION_FAILED,
      'İşyeri veya şube konumu gerekli.',
    );
  }
  return site;
}

export function requireWorkplaceCoords(employer: {
  latitude: unknown;
  longitude: unknown;
}): { latitude: number; longitude: number } {
  const pin = coords(employer);
  if (!pin) {
    throw new ApiException(
      HttpStatus.UNPROCESSABLE_ENTITY,
      ErrorCode.VALIDATION_FAILED,
      'Şubesiz ilan için işyeri adresi ve konumu gerekli.',
    );
  }
  return pin;
}
