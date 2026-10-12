import { describe, expect, it } from 'vitest';

import { jobCatalogOccupationRequirementsSchema } from '@parton/api-contracts';

describe('jobCatalogOccupationRequirementsSchema', () => {
  it('rejects unknown requirement keys', () => {
    const parsed = jobCatalogOccupationRequirementsSchema.safeParse({
      requiredDocumentTypes: ['drivers_license'],
      surprise: true,
    });
    expect(parsed.success).toBe(false);
  });

  it('accepts structured document and license fields', () => {
    const parsed = jobCatalogOccupationRequirementsSchema.parse({
      requiredDocumentTypes: ['drivers_license', 'food_hygiene'],
      driversLicenseClasses: ['B', 'C'],
      srcRequired: true,
    });
    expect(parsed.driversLicenseClasses).toEqual(['B', 'C']);
    expect(parsed.srcRequired).toBe(true);
  });
});
