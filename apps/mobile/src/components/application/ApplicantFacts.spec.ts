import { ageYears } from './ApplicantFacts';

test('age from ISO birth date', () => {
  expect(ageYears('2000-01-01')).toBeGreaterThanOrEqual(25);
  expect(ageYears(null)).toBeNull();
  expect(ageYears('not-a-date')).toBeNull();
});
