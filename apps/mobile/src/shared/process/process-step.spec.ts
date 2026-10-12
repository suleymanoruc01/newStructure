import { processDoneCount } from './process-step';

test('counts applied, review, decision, then shift', () => {
  expect(processDoneCount(null, false)).toBe(1);
  expect(processDoneCount('pending', false)).toBe(2);
  expect(processDoneCount('accepted', false)).toBe(3);
  expect(processDoneCount('rejected', false)).toBe(3);
  expect(processDoneCount('accepted', true)).toBe(4);
});
