import { describe, expect, it } from 'vitest';

import { parseRequiredDocumentTypes } from '../src/common/parse-required-document-types.util.js';

describe('parseRequiredDocumentTypes', () => {
  it('returns string entries from an array', () => {
    expect(parseRequiredDocumentTypes(['food_hygiene', 'first_aid'])).toEqual([
      'food_hygiene',
      'first_aid',
    ]);
  });

  it('drops non-strings and returns empty for non-arrays', () => {
    expect(parseRequiredDocumentTypes(['ok', 1, null, 'x'])).toEqual(['ok', 'x']);
    expect(parseRequiredDocumentTypes(null)).toEqual([]);
    expect(parseRequiredDocumentTypes({})).toEqual([]);
  });
});
