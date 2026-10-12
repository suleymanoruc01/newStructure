export function formatPayTry(
  minor: number | null | undefined,
  currency = 'TRY',
): string | null {
  if (minor == null || !Number.isFinite(minor)) {
    return null;
  }
  const major = minor / 100;
  const amount = major.toLocaleString('tr-TR', {
    minimumFractionDigits: Number.isInteger(major) ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return currency === 'TRY' ? `₺${amount}` : `${amount} ${currency}`;
}

export function tryMajorToMinor(raw: string): number | undefined {
  const trimmed = raw.trim().replace(',', '.');
  if (!trimmed) {
    return undefined;
  }
  const major = Number.parseFloat(trimmed);
  if (!Number.isFinite(major) || major < 0) {
    return undefined;
  }
  return Math.round(major * 100);
}
