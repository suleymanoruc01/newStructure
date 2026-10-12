import { formatPayTry, tryMajorToMinor } from './pay';

test('formats kuruş as TRY', () => {
  expect(formatPayTry(40_000)).toBe('₺400');
  expect(formatPayTry(null)).toBeNull();
  expect(tryMajorToMinor('400')).toBe(40_000);
  expect(tryMajorToMinor('')).toBeUndefined();
});
