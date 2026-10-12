import type { ShiftIncidentCreateBody } from '@parton/api-contracts';

export function defaultIncidentSeverity(
  type: ShiftIncidentCreateBody['type'],
): ShiftIncidentCreateBody['severity'] {
  switch (type) {
    case 'emergency_help':
    case 'harassment':
      return 'critical';
    case 'workplace_closed':
    case 'pay_dispute':
      return 'high';
    case 'job_description_mismatch':
      return 'normal';
    default: {
      const _never: never = type;
      return _never;
    }
  }
}

export function incidentSeverityTone(
  severity: ShiftIncidentCreateBody['severity'],
): 'neutral' | 'warn' | 'error' {
  switch (severity) {
    case 'critical':
      return 'error';
    case 'high':
      return 'warn';
    case 'normal':
      return 'neutral';
    default: {
      const _never: never = severity;
      return _never;
    }
  }
}
