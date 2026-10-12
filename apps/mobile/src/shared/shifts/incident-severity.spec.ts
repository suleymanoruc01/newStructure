import {
  defaultIncidentSeverity,
  incidentSeverityTone,
} from './incident-severity';

test('defaults harassment and emergency to critical, mismatch to normal', () => {
  expect(defaultIncidentSeverity('emergency_help')).toBe('critical');
  expect(defaultIncidentSeverity('harassment')).toBe('critical');
  expect(defaultIncidentSeverity('workplace_closed')).toBe('high');
  expect(defaultIncidentSeverity('pay_dispute')).toBe('high');
  expect(defaultIncidentSeverity('job_description_mismatch')).toBe('normal');
  expect(incidentSeverityTone('critical')).toBe('error');
  expect(incidentSeverityTone('high')).toBe('warn');
  expect(incidentSeverityTone('normal')).toBe('neutral');
});
