import { pressTarget } from './press-feedback';

test('press scales slightly and reduced motion stays still', () => {
  expect(pressTarget(false, true)).toBe(0.97);
  expect(pressTarget(false, false)).toBe(1);
  expect(pressTarget(true, true)).toBe(1);
});
