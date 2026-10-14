/**
 * Mobile Locale & Language Preference Manager.
 *
 * Provides persisted language switching (tr-TR / en-US), locale-aware currency,
 * and date-time formatters conforming to internationalization standards.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n, { type SupportedLanguage, SUPPORTED_LANGUAGES } from '../../i18n';

export const LOCALE_STORAGE_KEY = 'parton.user_locale';

/**
 * Returns the currently active application language code.
 */
export function getCurrentLanguage(): SupportedLanguage {
  const current = (i18n.language ?? 'tr-TR') as SupportedLanguage;
  if (current === 'en-US' || current === 'tr-TR') {
    return current;
  }
  return 'tr-TR';
}

/**
 * Changes the active language, updates i18n instance, and persists to local storage.
 */
export async function changeLanguage(lang: SupportedLanguage): Promise<void> {
  await i18n.changeLanguage(lang);
  try {
    await AsyncStorage.setItem(LOCALE_STORAGE_KEY, lang);
  } catch {
    // Non-blocking storage fallback
  }
}

/**
 * Initializes language preference from storage during application startup.
 */
export async function initializeLanguage(): Promise<SupportedLanguage> {
  try {
    const saved = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved === 'en-US' || saved === 'tr-TR') {
      await i18n.changeLanguage(saved);
      return saved;
    }
  } catch {
    // Fallback to default
  }
  return 'tr-TR';
}

/**
 * Formats a monetary amount into a clean localized currency string.
 */
export function formatLocalizedCurrency(
  amountMinor: number,
  currency: string = 'TRY',
  lang?: SupportedLanguage,
): string {
  const currentLang = lang ?? getCurrentLanguage();
  const major = amountMinor / 100;

  try {
    return new Intl.NumberFormat(currentLang, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(major);
  } catch {
    return `${major.toFixed(2)} ${currency}`;
  }
}

/**
 * Formats a Date object using localized calendar options.
 */
export function formatLocalizedDate(
  date: Date,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' },
  lang?: SupportedLanguage,
): string {
  const currentLang = lang ?? getCurrentLanguage();
  try {
    return new Intl.DateTimeFormat(currentLang, options).format(date);
  } catch {
    return date.toISOString();
  }
}

export { SUPPORTED_LANGUAGES, type SupportedLanguage };
