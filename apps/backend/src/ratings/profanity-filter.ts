const PROFANITY_TERMS = [
  'amk',
  'aq',
  'orospu',
  'siktir',
  'piç',
  'göt',
  'yarrak',
  'kahpe',
];

export function containsProfanity(text: string): boolean {
  const normalized = text
    .toLocaleLowerCase('tr-TR')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ');
  const tokens = normalized.split(/\s+/).filter(Boolean);
  return tokens.some((token) =>
    PROFANITY_TERMS.some((term) => token.includes(term)),
  );
}
