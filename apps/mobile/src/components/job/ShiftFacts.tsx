import React from 'react';
import type { Shift } from '@parton/api-contracts';

import { JobFacts } from './JobFacts';

export function ShiftFacts({ shift }: { shift: Shift }) {
  return (
    <JobFacts
      branchName={shift.branchName}
      startsAt={shift.startsAt}
      endsAt={shift.endsAt}
      payAmountMinor={shift.payAmountMinor}
      payCurrency={shift.payCurrency}
      amenities={shift.amenities}
      requiredDocumentTypes={shift.requiredDocumentTypes}
    />
  );
}
