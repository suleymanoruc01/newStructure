import { matchProvinces, TR_PROVINCES } from './tr-provinces';

test('empty query shows popular cities, typed query matches Turkish letters', () => {
  expect(TR_PROVINCES).toHaveLength(81);
  expect(matchProvinces('')[0]).toBe('İstanbul');
  expect(matchProvinces('izmir')).toEqual(['İzmir']);
  expect(matchProvinces('şanlı')).toEqual(['Şanlıurfa']);
});
