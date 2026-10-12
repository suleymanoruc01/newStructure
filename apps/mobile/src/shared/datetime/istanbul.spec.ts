import { weekdaySun0 } from './istanbul';

test('Istanbul weekday is Sunday=0', () => {
  expect(
    weekdaySun0(new Date('2026-10-12T12:00:00.000Z'), 'Europe/Istanbul'),
  ).toBe(1);
});
