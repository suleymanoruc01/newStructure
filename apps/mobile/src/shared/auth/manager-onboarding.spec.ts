import { managerOnboardingComplete } from './manager-onboarding';

test('treats workplace managers with empty branchIds as onboarded', () => {
  expect(
    managerOnboardingComplete([
      { role: 'manager', employerId: '11111111-1111-1111-1111-111111111111' },
    ]),
  ).toBe(true);
});

test('keeps unbound manager intent in onboarding', () => {
  expect(managerOnboardingComplete([{ role: 'manager' }])).toBe(false);
});
